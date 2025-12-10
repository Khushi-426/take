import cv2
import mediapipe as mp
import numpy as np
import time
import json
from flask import Flask, render_template, Response, jsonify

# --- 1. FLASK SETUP ---
app = Flask(__name__)

# --- 2. MEDIA PIPE AND CV2 INITIALIZATION (Global variables) ---
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils
cap = None
holistic_model = None

# --- 3. CONSTANTS AND GLOBAL STATE ---
CONTRACTED_THRESHOLD = 45   
EXTENDED_THRESHOLD = 170    
SAFE_ANGLE_MIN = 30         
SAFE_ANGLE_MAX = 175        

COUNTDOWN_TIME = 5 
is_tracking_active = False
start_time = 0 

# GLOBAL STATE for the current session's aggregate data
global_tracking_data = {
    'RIGHT': {'rep_count': 0, 'stage': "INACTIVE", 'angle': 0, 
              'rep_time': 0.0, 'min_rep_time': 0.0, 'curr_rep_time': 0.0, 'feedback': "", 
              'draw_coords': (0, 0), 'text_color': (255, 255, 255)},
    'LEFT':  {'rep_count': 0, 'stage': "INACTIVE", 'angle': 0, 
              'rep_time': 0.0, 'min_rep_time': 0.0, 'curr_rep_time': 0.0, 'feedback': "",
              'draw_coords': (0, 0), 'text_color': (255, 255, 255)},
    'status': 'INACTIVE'
}

# NEW: Stores angle data for the entire session for the final report
session_history = {
    'time': [],
    'right_angle': [],
    'left_angle': [],
    'right_feedback': 0, # Count of major right arm errors
    'left_feedback': 0   # Count of major left arm errors
}
final_report_summary = {} # Will hold data passed to /report_data route

# Placeholder for countdown text color
COUNTDOWN_COLOR = (0, 0, 255) 

# Internal state for rep counting
arm_states = {
    'RIGHT': {'rep_count': 0, 'stage': "down", 'last_down_time': time.time()},
    'LEFT':  {'rep_count': 0, 'stage': "down", 'last_down_time': time.time()}
}


# --- 4. UTILITY FUNCTION: ANGLE CALCULATION (No Change) ---
def calculate_angle(a_coords, b_coords, c_coords):
    a = np.array(a_coords)
    b = np.array(b_coords)
    c = np.array(c_coords)
    
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(np.degrees(radians))

    if angle > 180.0:
        angle = 360 - angle
        
    return angle

# --- 5. VIDEO STREAM GENERATOR ---
def gen_frames():
    global cap, holistic_model, is_tracking_active, start_time, global_tracking_data, arm_states, session_history
    
    if not is_tracking_active or cap is None or holistic_model is None:
        return

    while cap.isOpened() and is_tracking_active:
        success, image = cap.read()
        if not success:
            break

        image.flags.writeable = False
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = holistic_model.process(image)
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        h, w, _ = image.shape
        
        current_time = time.time()
        feedback_message = "" 
        
        # --- COUNTDOWN CHECK ---
        elapsed_time = current_time - start_time
        countdown_running = elapsed_time < COUNTDOWN_TIME

        if countdown_running:
            remaining_time = int(COUNTDOWN_TIME - elapsed_time)
            global_tracking_data['status'] = 'COUNTDOWN'
            global_tracking_data['remaining'] = remaining_time
        else:
            global_tracking_data['status'] = 'ACTIVE'


        # --- LANDMARK EXTRACTION AND REP COUNTING (DUAL ARM) ---
        current_frame_angles = {'RIGHT': 0, 'LEFT': 0}

        if results.pose_landmarks and not countdown_running:
            landmarks = results.pose_landmarks.landmark
            
            arm_config = {
                'RIGHT': {'shoulder': mp_holistic.PoseLandmark.RIGHT_SHOULDER, 'elbow': mp_holistic.PoseLandmark.RIGHT_ELBOW, 'wrist': mp_holistic.PoseLandmark.RIGHT_WRIST},
                'LEFT':  {'shoulder': mp_holistic.PoseLandmark.LEFT_SHOULDER, 'elbow': mp_holistic.PoseLandmark.LEFT_ELBOW, 'wrist': mp_holistic.PoseLandmark.LEFT_WRIST}
            }

            for arm, config in arm_config.items():
                try:
                    shoulder = [landmarks[config['shoulder']].x, landmarks[config['shoulder']].y]
                    elbow = [landmarks[config['elbow']].x, landmarks[config['elbow']].y]
                    wrist = [landmarks[config['wrist']].x, landmarks[config['wrist']].y]
                    
                    elbow_angle = calculate_angle(shoulder, elbow, wrist)
                    current_frame_angles[arm] = int(elbow_angle) # Log angle for history

                    elbow_pixel_x = int(elbow[0] * w)
                    elbow_pixel_y = int(elbow[1] * h)

                    current_stage = arm_states[arm]['stage']
                    time_since_last_down = current_time - arm_states[arm]['last_down_time']
                    
                    global_tracking_data[arm]['curr_rep_time'] = time_since_last_down
                    global_tracking_data[arm]['angle'] = int(elbow_angle)
                    global_tracking_data[arm]['feedback'] = "" 
                    current_text_color = (255, 255, 255) 
                    
                    # State Machine Logic (omitted for brevity, assume rep/stage updates are here)
                    # 1. UP movement (Contraction)
                    if elbow_angle < CONTRACTED_THRESHOLD:
                        arm_states[arm]['stage'] = "up"
                        global_tracking_data[arm]['stage'] = "UP"
                        
                    # 2. DOWN movement (Extension and Rep Completion)
                    if elbow_angle > EXTENDED_THRESHOLD:
                        if current_stage == "up":
                            rep_time = time_since_last_down
                            min_time = global_tracking_data[arm]['min_rep_time']
                            if min_time == 0.0 or rep_time < min_time:
                                global_tracking_data[arm]['min_rep_time'] = rep_time
                            arm_states[arm]['rep_count'] += 1
                            arm_states[arm]['last_down_time'] = current_time 
                            global_tracking_data[arm]['rep_count'] = arm_states[arm]['rep_count']
                            global_tracking_data[arm]['rep_time'] = rep_time
                        arm_states[arm]['stage'] = "down"
                        global_tracking_data[arm]['stage'] = "DOWN"

                    # 3. Form Feedback Cues (Prioritized)
                    if elbow_angle < SAFE_ANGLE_MIN:
                        feedback_message = f"{arm} ARM: DON'T OVER-CURL! ({int(elbow_angle)}°)"
                        global_tracking_data[arm]['feedback'] = "OVER-CURLING"
                        current_text_color = (0, 0, 255) 
                        session_history[f'{arm.lower()}_feedback'] += 1 # Log error
                    elif elbow_angle > SAFE_ANGLE_MAX:
                        feedback_message = f"{arm} ARM: DON'T OVER-EXTEND! ({int(elbow_angle)}°)"
                        global_tracking_data[arm]['feedback'] = "OVER-EXTENDING"
                        current_text_color = (0, 0, 255) 
                        session_history[f'{arm.lower()}_feedback'] += 1 # Log error
                    elif elbow_angle > CONTRACTED_THRESHOLD and elbow_angle < EXTENDED_THRESHOLD:
                        if arm_states[arm]['stage'] == "down":
                            global_tracking_data[arm]['feedback'] = "STRAIGHTEN ARM"
                            feedback_message = f"STRAIGHTEN {arm} ARM"
                            current_text_color = (0, 165, 255) 
                        elif arm_states[arm]['stage'] == "up":
                            global_tracking_data[arm]['feedback'] = "CURL DEEPER!"
                            feedback_message = f"CURL {arm} DEEPER!"
                            current_text_color = (0, 0, 255) 

                    # Store Drawing Data
                    global_tracking_data[arm]['draw_coords'] = (elbow_pixel_x, elbow_pixel_y)
                    global_tracking_data[arm]['text_color'] = current_text_color
                    
                    # Highlight the key landmarks (Must be done BEFORE the flip)
                    for landmark_id in [config['shoulder'].value, config['elbow'].value, config['wrist'].value]:
                        lm = landmarks[landmark_id]
                        cv2.circle(image, (int(lm.x * w), int(lm.y * h)), 8, (255, 0, 255), cv2.FILLED)

                except Exception:
                    global_tracking_data[arm]['angle'] = 0
                    global_tracking_data[arm]['stage'] = "LOST"
                    global_tracking_data[arm]['curr_rep_time'] = 0.0
                    current_frame_angles[arm] = 0 # Log 0 if lost
                    pass
        
            # Draw the pose skeleton (Must be done BEFORE the flip)
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp.solutions.pose.POSE_CONNECTIONS)
            
        # NEW: Log data to session history (only if not countdown)
        if not countdown_running:
            session_history['time'].append(round(current_time - start_time, 2))
            session_history['right_angle'].append(current_frame_angles['RIGHT'])
            session_history['left_angle'].append(current_frame_angles['LEFT'])


        # --- FIX: APPLY FLIP AND DRAW TEXT ---
        
        image = cv2.flip(image, 1)

        # Draw Text and Annotations on the Flipped Frame
        if global_tracking_data['status'] == 'ACTIVE':
            for arm in ['RIGHT', 'LEFT']:
                try:
                    metrics = global_tracking_data[arm]
                    original_x, original_y = metrics['draw_coords']
                    current_text_color = metrics['text_color']
                    elbow_angle = metrics['angle']

                    # Adjust X-coordinate for the flip: new_x = width - original_x
                    flipped_x = w - original_x - 50
                    
                    cv2.putText(image, f"{elbow_angle} deg", 
                                (flipped_x, original_y - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, current_text_color, 2, cv2.LINE_AA)

                except:
                    pass
                    
            if feedback_message:
                text_size = cv2.getTextSize(feedback_message, cv2.FONT_HERSHEY_SIMPLEX, 1.5, 3)[0]
                text_x = int((w - text_size[0]) / 2)
                
                cv2.putText(image, feedback_message, (text_x, h - 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, global_tracking_data[arm]['text_color'], 3, cv2.LINE_AA)
        
        if countdown_running:
             countdown_text = f"STARTING IN {remaining_time}"
             text_size = cv2.getTextSize(countdown_text, cv2.FONT_HERSHEY_SIMPLEX, 1.5, 4)[0]
             text_x = int((w - text_size[0]) / 2)
             cv2.putText(image, countdown_text, (text_x, int(h/2) + 20), 
                         cv2.FONT_HERSHEY_SIMPLEX, 1.5, COUNTDOWN_COLOR, 4, cv2.LINE_AA)

        if global_tracking_data['status'] == 'ACTIVE' and not results.pose_landmarks:
             cv2.putText(image, "LOST POSE: STEP BACK INTO FRAME!", 
                        (int(w/2) - 300, int(h/2) + 150), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 2, cv2.LINE_AA)


        # Encode the frame as JPEG for streaming
        ret, buffer = cv2.imencode('.jpg', image)
        frame = buffer.tobytes()
        
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

# --- 6. FLASK ROUTES ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/report')
def report_page():
    """New route to render the static report page."""
    return render_template('report.html')

@app.route('/start_tracking')
def start_tracking():
    global cap, holistic_model, is_tracking_active, start_time, session_history
    
    if is_tracking_active:
        return jsonify({'status': 'already_active'}), 200

    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            if cap: cap.release()
            cap = None
            raise IOError("Cannot open webcam")

        holistic_model = mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5)
        
        is_tracking_active = True
        start_time = time.time()
        
        # Reset ALL states for a new session
        for arm in ['LEFT', 'RIGHT']:
            arm_states[arm]['rep_count'] = 0
            arm_states[arm]['stage'] = "down"
            arm_states[arm]['last_down_time'] = time.time()
            global_tracking_data[arm] = {
                'rep_count': 0, 'stage': "DOWN", 'angle': 0, 
                'rep_time': 0.0, 'min_rep_time': 0.0, 'curr_rep_time': 0.0, 'feedback': "",
                'draw_coords': (0, 0), 'text_color': (255, 255, 255)
            }
        
        # Reset session history
        session_history['time'].clear()
        session_history['right_angle'].clear()
        session_history['left_angle'].clear()
        session_history['right_feedback'] = 0
        session_history['left_feedback'] = 0
        
        global_tracking_data['status'] = 'COUNTDOWN'

        return jsonify({'status': 'success', 'message': 'Tracking started.'}), 200
    except Exception as e:
        if cap: cap.release()
        is_tracking_active = False
        return jsonify({'status': 'error', 'message': f'Failed to start camera/model: {str(e)}'}), 500

@app.route('/stop_tracking')
def stop_tracking():
    global cap, holistic_model, is_tracking_active, final_report_summary, global_tracking_data, session_history
    
    is_tracking_active = False
    
    if cap: cap.release(); cap = None
    if holistic_model: holistic_model = None

    # Finalize the report summary data before sending to report page
    final_report_summary = {
        'duration': round(session_history['time'][-1] if session_history['time'] else 0, 2),
        'history': session_history,
        'summary': {
            'RIGHT': {
                'total_reps': global_tracking_data['RIGHT']['rep_count'],
                'min_time': global_tracking_data['RIGHT']['min_rep_time'],
                'error_count': session_history['right_feedback']
            },
            'LEFT': {
                'total_reps': global_tracking_data['LEFT']['rep_count'],
                'min_time': global_tracking_data['LEFT']['min_rep_time'],
                'error_count': session_history['left_feedback']
            }
        }
    }

    # Reset data state to INACTIVE
    global_tracking_data['status'] = 'INACTIVE'
    for arm in ['LEFT', 'RIGHT']:
        global_tracking_data[arm]['stage'] = 'INACTIVE'

    # Return success signal for frontend to redirect
    return jsonify({'status': 'success', 'message': 'Tracking stopped. Redirecting to report.', 'redirect': '/report'}), 200

@app.route('/video_feed')
def video_feed():
    if not is_tracking_active:
        return Response(b'', mimetype='multipart/x-mixed-replace; boundary=frame')
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/data_feed')
def data_feed():
    if not is_tracking_active:
        return jsonify({'status': 'INACTIVE'})
    return jsonify(global_tracking_data)

@app.route('/report_data')
def report_data():
    """New route to serve the finalized session data to the report page."""
    global final_report_summary
    return jsonify(final_report_summary)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)