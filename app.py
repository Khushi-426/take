import cv2
import mediapipe as mp
import numpy as np
import time
import json
from collections import deque # NEW: For smoothing
from flask import Flask, Response, jsonify
from flask_cors import CORS

# --- 1. FLASK SETUP ---
app = Flask(__name__)
CORS(app)

# --- 2. MEDIA PIPE SETUP ---
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils
cap = None
holistic_model = None

# --- 3. SETTINGS & STATE ---
CONTRACTED_THRESHOLD = 50   # Adjusted for better detection
EXTENDED_THRESHOLD = 160    
SAFE_ANGLE_MIN = 30         
SAFE_ANGLE_MAX = 175        
COUNTDOWN_TIME = 5 
SMOOTHING_WINDOW = 7        # Higher = Smoother numbers

is_tracking_active = False
start_time = 0 

# NEW: Buffers to store last 7 angles for average calculation
angle_buffers = {
    'RIGHT': deque(maxlen=SMOOTHING_WINDOW),
    'LEFT':  deque(maxlen=SMOOTHING_WINDOW)
}

global_tracking_data = {
    'RIGHT': {'rep_count': 0, 'stage': "INACTIVE", 'angle': 0, 
              'rep_time': 0.0, 'min_rep_time': 0.0, 'curr_rep_time': 0.0, 'feedback': "", 
              'draw_coords': (0, 0), 'text_color': (255, 255, 255)},
    'LEFT':  {'rep_count': 0, 'stage': "INACTIVE", 'angle': 0, 
              'rep_time': 0.0, 'min_rep_time': 0.0, 'curr_rep_time': 0.0, 'feedback': "",
              'draw_coords': (0, 0), 'text_color': (255, 255, 255)},
    'status': 'INACTIVE',
    'remaining': 0
}

session_history = {
    'time': [], 'right_angle': [], 'left_angle': [],
    'right_feedback': 0, 'left_feedback': 0
}
final_report_summary = {} 

arm_states = {
    'RIGHT': {'rep_count': 0, 'stage': "down", 'last_down_time': time.time()},
    'LEFT':  {'rep_count': 0, 'stage': "down", 'last_down_time': time.time()}
}

# --- 4. HELPER FUNCTIONS ---
def calculate_angle(a, b, c):
    a = np.array(a); b = np.array(b); c = np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(np.degrees(radians))
    return 360 - angle if angle > 180.0 else angle

def get_smoothed_angle(arm, new_angle):
    """Calculates the average of the last few frames to remove jitter."""
    if len(angle_buffers[arm]) == 0:
        # Fill buffer immediately to prevent startup lag
        for _ in range(SMOOTHING_WINDOW):
            angle_buffers[arm].append(new_angle)
    
    angle_buffers[arm].append(new_angle)
    return int(sum(angle_buffers[arm]) / len(angle_buffers[arm]))

# --- 5. MAIN VIDEO LOOP ---
def gen_frames():
    global cap, holistic_model, is_tracking_active, start_time, global_tracking_data, arm_states, session_history
    
    # SAFETY CHECK: If variables are None, exit to prevent crash
    if not is_tracking_active or cap is None or holistic_model is None:
        return

    while cap.isOpened() and is_tracking_active:
        success, image = cap.read()
        if not success: break

        image.flags.writeable = False
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = holistic_model.process(image)
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        h, w, _ = image.shape
        
        current_time = time.time()
        elapsed_time = current_time - start_time
        countdown_running = elapsed_time < COUNTDOWN_TIME

        if countdown_running:
            remaining = int(COUNTDOWN_TIME - elapsed_time)
            global_tracking_data['status'] = 'COUNTDOWN'
            global_tracking_data['remaining'] = remaining
        else:
            global_tracking_data['status'] = 'ACTIVE'

        current_frame_angles = {'RIGHT': 0, 'LEFT': 0}

        if results.pose_landmarks and not countdown_running:
            landmarks = results.pose_landmarks.landmark
            arm_config = {
                'RIGHT': {'shoulder': mp_holistic.PoseLandmark.RIGHT_SHOULDER, 'elbow': mp_holistic.PoseLandmark.RIGHT_ELBOW, 'wrist': mp_holistic.PoseLandmark.RIGHT_WRIST},
                'LEFT':  {'shoulder': mp_holistic.PoseLandmark.LEFT_SHOULDER, 'elbow': mp_holistic.PoseLandmark.LEFT_ELBOW, 'wrist': mp_holistic.PoseLandmark.LEFT_WRIST}
            }

            for arm, config in arm_config.items():
                try:
                    s = [landmarks[config['shoulder']].x, landmarks[config['shoulder']].y]
                    e = [landmarks[config['elbow']].x, landmarks[config['elbow']].y]
                    w_l = [landmarks[config['wrist']].x, landmarks[config['wrist']].y]
                    
                    raw_angle = calculate_angle(s, e, w_l)
                    # NEW: USE SMOOTHED ANGLE
                    angle = get_smoothed_angle(arm, raw_angle)
                    
                    current_frame_angles[arm] = angle
                    
                    # Update Global State
                    global_tracking_data[arm]['angle'] = angle
                    global_tracking_data[arm]['curr_rep_time'] = current_time - arm_states[arm]['last_down_time']
                    global_tracking_data[arm]['feedback'] = ""

                    # REP COUNTING LOGIC
                    if angle < CONTRACTED_THRESHOLD:
                        arm_states[arm]['stage'] = "up"
                        global_tracking_data[arm]['stage'] = "UP"
                    
                    if angle > EXTENDED_THRESHOLD:
                        if arm_states[arm]['stage'] == "up":
                            rep_time = current_time - arm_states[arm]['last_down_time']
                            if global_tracking_data[arm]['min_rep_time'] == 0.0 or rep_time < global_tracking_data[arm]['min_rep_time']:
                                global_tracking_data[arm]['min_rep_time'] = rep_time
                            arm_states[arm]['rep_count'] += 1
                            arm_states[arm]['last_down_time'] = current_time
                            global_tracking_data[arm]['rep_count'] = arm_states[arm]['rep_count']
                            global_tracking_data[arm]['rep_time'] = rep_time
                        arm_states[arm]['stage'] = "down"
                        global_tracking_data[arm]['stage'] = "DOWN"

                    # FORM FEEDBACK
                    if angle < SAFE_ANGLE_MIN:
                        global_tracking_data[arm]['feedback'] = "OVER-CURLING"
                        session_history[f'{arm.lower()}_feedback'] += 1
                    elif angle > SAFE_ANGLE_MAX:
                        global_tracking_data[arm]['feedback'] = "OVER-EXTENDING"
                        session_history[f'{arm.lower()}_feedback'] += 1
                    elif angle > CONTRACTED_THRESHOLD and angle < EXTENDED_THRESHOLD:
                         if arm_states[arm]['stage'] == "down": global_tracking_data[arm]['feedback'] = "STRAIGHTEN ARM"
                         elif arm_states[arm]['stage'] == "up": global_tracking_data[arm]['feedback'] = "CURL DEEPER"

                except Exception:
                    global_tracking_data[arm]['stage'] = "LOST"

            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp.solutions.pose.POSE_CONNECTIONS)
            
            # Log History
            session_history['time'].append(round(current_time - start_time, 2))
            session_history['right_angle'].append(current_frame_angles['RIGHT'])
            session_history['left_angle'].append(current_frame_angles['LEFT'])

        # Flip & Overlay
        image = cv2.flip(image, 1)
        if countdown_running:
             cv2.putText(image, str(global_tracking_data['remaining']), (int(w/2)-50, int(h/2)), cv2.FONT_HERSHEY_SIMPLEX, 5, (0,0,255), 5)
        
        ret, buffer = cv2.imencode('.jpg', image)
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

# --- 6. ROUTES ---
@app.route('/start_tracking')
def start_tracking():
    global cap, holistic_model, is_tracking_active, start_time, angle_buffers
    
    if is_tracking_active: return jsonify({'status': 'already_active'})
    
    try:
        cap = cv2.VideoCapture(0)
        # Initialize Globally (Stable Method)
        holistic_model = mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5)
        is_tracking_active = True
        start_time = time.time()
        
        # Reset Logic
        for arm in ['LEFT', 'RIGHT']:
            arm_states[arm]['rep_count'] = 0
            arm_states[arm]['stage'] = "down"
            arm_states[arm]['last_down_time'] = time.time()
            global_tracking_data[arm] = {'rep_count': 0, 'stage': "DOWN", 'angle': 0, 'rep_time': 0, 'min_rep_time': 0, 'curr_rep_time': 0, 'feedback': ""}
            angle_buffers[arm].clear() # Clear smoothing buffer
        
        session_history['time'] = []; session_history['right_angle'] = []; session_history['left_angle'] = []
        session_history['right_feedback'] = 0; session_history['left_feedback'] = 0
        global_tracking_data['status'] = 'COUNTDOWN'
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/stop_tracking')
def stop_tracking():
    global cap, holistic_model, is_tracking_active, final_report_summary
    is_tracking_active = False
    
    if cap: cap.release()
    if holistic_model: holistic_model.close(); holistic_model = None
    
    final_report_summary = {
        'duration': round(session_history['time'][-1] if session_history['time'] else 0, 2),
        'summary': {
            'RIGHT': {'total_reps': global_tracking_data['RIGHT']['rep_count'], 'min_time': global_tracking_data['RIGHT']['min_rep_time'], 'error_count': session_history['right_feedback']},
            'LEFT': {'total_reps': global_tracking_data['LEFT']['rep_count'], 'min_time': global_tracking_data['LEFT']['min_rep_time'], 'error_count': session_history['left_feedback']}
        }
    }
    return jsonify({'status': 'success'})

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/data_feed')
def data_feed():
    return jsonify(global_tracking_data)

@app.route('/report_data')
def report_data():
    return jsonify(final_report_summary)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)