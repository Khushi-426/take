import cv2
import mediapipe as mp
import numpy as np

# --- 1. MEDIA PIPE INITIALIZATION ---
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_holistic = mp.solutions.holistic

# --- 2. UTILITY FUNCTION: ANGLE CALCULATION ---

def calculate_angle(a_coords, b_coords, c_coords):
    """
    Calculates the angle (in degrees) at the vertex 'b' (the elbow).
    a: Shoulder, b: Elbow, c: Wrist
    """
    # Convert list of coordinates to numpy array
    a = np.array(a_coords)
    b = np.array(b_coords)
    c = np.array(c_coords)
    
    # Calculate angle using atan2 for robust 2D angle calculation
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(np.degrees(radians))

    if angle > 180.0:
        angle = 360 - angle
        
    return angle

# --- 3. STATE VARIABLES & THRESHOLDS (The Bicep Curl Logic) ---

rep_count = 0
stage = "down" # "down" (arm extended) or "up" (arm contracted)

# Optimal thresholds for a standard Bicep Curl
CONTRACTED_THRESHOLD = 50  # Angle when the arm is fully bent (e.g., < 50 degrees)
EXTENDED_THRESHOLD = 160   # Angle when the arm is fully straight (e.g., > 160 degrees)

# --- 4. VIDEO CAPTURE & HOLISTIC MODEL SETUP ---

cap = cv2.VideoCapture(0) # 0 for default webcam

# Initialize the Holistic model for real-time tracking
with mp_holistic.Holistic(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5) as holistic:
    
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            print("Ignoring empty camera frame.")
            continue

        # Convert BGR image to RGB and set to read-only for processing
        image.flags.writeable = False
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = holistic.process(image)

        # Convert back to BGR and set to writeable for drawing annotations
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        # --- 5. LANDMARK EXTRACTION AND REP COUNTING ---
        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            h, w, c_dim = image.shape
            text_color = (255, 255, 255) # Default white color
            
            # Use a try-except block to prevent crashes if one point is temporarily lost
            try:
                # --- Get Coords for Right Arm ---
                # Landmark indices: 12=Shoulder, 14=Elbow, 16=Wrist
                shoulder = [landmarks[mp_holistic.PoseLandmark.RIGHT_SHOULDER].x, 
                            landmarks[mp_holistic.PoseLandmark.RIGHT_SHOULDER].y]
                elbow = [landmarks[mp_holistic.PoseLandmark.RIGHT_ELBOW].x, 
                         landmarks[mp_holistic.PoseLandmark.RIGHT_ELBOW].y]
                wrist = [landmarks[mp_holistic.PoseLandmark.RIGHT_WRIST].x, 
                         landmarks[mp_holistic.PoseLandmark.RIGHT_WRIST].y]
                
                # Calculate the angle
                elbow_angle = calculate_angle(shoulder, elbow, wrist)

                # Convert normalized elbow coords to pixel coords for text placement
                elbow_pixel_x = int(elbow[0] * w)
                elbow_pixel_y = int(elbow[1] * h)
                
                # --- State Machine Logic (The Bicep Curl Tracker) ---
                
                # 1. UP movement (Contraction)
                if elbow_angle < CONTRACTED_THRESHOLD:
                    stage = "up"
                    text_color = (0, 255, 0) # Green for contraction
                    
                # 2. DOWN movement (Extension and Rep Completion)
                if elbow_angle > EXTENDED_THRESHOLD:
                    if stage == "up":
                        # A full repetition is counted!
                        rep_count += 1
                    stage = "down"
                    text_color = (0, 255, 0) # Green for extension

                # 3. Simple Form Feedback Cues
                feedback_message = ""
                
                if stage == "down" and elbow_angle > CONTRACTED_THRESHOLD and elbow_angle < EXTENDED_THRESHOLD:
                    # Not fully straightening the arm
                    feedback_message = "STRAIGHTEN ARM"
                    text_color = (0, 165, 255) # Orange
                
                elif stage == "up" and elbow_angle > CONTRACTED_THRESHOLD:
                    # Not curling deeply enough
                    feedback_message = "CURL DEEPER!"
                    text_color = (0, 0, 255) # Red

                # --- Display Live Feedback ---

                # 1. Display Angle next to Elbow
                cv2.putText(image, f"Angle: {int(elbow_angle)}", 
                            (elbow_pixel_x, elbow_pixel_y - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, text_color, 2, cv2.LINE_AA)
                
                # 2. Display Rep Count (Top Right)
                cv2.putText(image, f"REPS: {rep_count}", (w - 300, 50), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 255, 255), 3, cv2.LINE_AA)
                
                # 3. Display Form Feedback (Bottom Center)
                if feedback_message:
                    cv2.putText(image, feedback_message, (int(w/2) - 150, h - 50), 
                                cv2.FONT_HERSHEY_SIMPLEX, 1, text_color, 2, cv2.LINE_AA)

            except Exception:
                # Silently fail if landmarks are briefly unavailable or calculation error occurs
                pass


        # --- 6. DRAW ANNOTATIONS (Skeleton) ---
        
        # Draw the pose landmarks (skeleton)
        mp_drawing.draw_landmarks(
            image,
            results.pose_landmarks,
            mp_holistic.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style())
        
        # Note: Face and Hand drawing is disabled for clarity in this fitness MVP.

        # Flip the image horizontally for a selfie-view display
        cv2.imshow('PhysioCheck MVP: Bicep Curl Tracker', image)
        
        # Exit on ESC key press
        if cv2.waitKey(5) & 0xFF == 27:
            break

# --- 7. CLEAN UP ---
cap.release()
cv2.destroyAllWindows()