"""
Exercise Verification Logic - Detects if the user is performing the wrong exercise
"""
import mediapipe as mp
import numpy as np
import math

class ExerciseVerifier:
    def __init__(self):
        self.mp_pose = mp.solutions.holistic.PoseLandmark

    def check_mismatch(self, landmarks, expected_exercise_name: str):
        """
        Checks if the current pose landmarks indicate an exercise that conflicts 
        with the expected exercise.
        
        Returns:
            is_wrong (bool): True if a conflicting exercise is detected.
            reason (str): The specific movement that caused the conflict.
        """
        if not landmarks:
            return False, ""

        # 1. Extract Key Coordinates & Angles
        features = self._extract_features(landmarks)
        
        # 2. Define Exclusion Rules (What shouldn't happen in the expected exercise)
        # expected_exercise_name matches keys in constants.py EXERCISE_PRESETS
        
        ex_name = expected_exercise_name.lower()

        # Rule Set:
        # Bicep Curl: No overhead reaching, no deep squatting, no single leg lifting
        if "bicep" in ex_name:
            if features['is_overhead']: return True, "Overhead Movement Detected"
            if features['is_squatting']: return True, "Squat Detected"
            if features['is_knee_lift']: return True, "Leg Lift Detected"

        # Shoulder Press: No deep squatting, no single leg lifting. 
        # (Note: Hands go high, so is_overhead is valid here)
        elif "shoulder" in ex_name or "press" in ex_name:
            if features['is_squatting']: return True, "Squat Detected"
            if features['is_knee_lift']: return True, "Leg Lift Detected"

        # Squat: No overhead reaching (unless Thruster?), no single leg lifting
        elif "squat" in ex_name:
            if features['is_overhead']: return True, "Overhead Movement Detected"
            if features['is_knee_lift']: return True, "Single Leg Lift Detected"

        # Knee Lift: No deep squatting, no overhead reaching
        elif "knee" in ex_name or "lift" in ex_name:
            if features['is_squatting']: return True, "Squat Detected"
            if features['is_overhead']: return True, "Overhead Movement Detected"
            
        # Standing Row: No overhead, no squatting, no leg lift
        elif "row" in ex_name:
            if features['is_overhead']: return True, "Overhead Movement Detected"
            if features['is_squatting']: return True, "Squat Detected"
            if features['is_knee_lift']: return True, "Leg Lift Detected"

        return False, ""

    def _extract_features(self, landmarks):
        """Analyzes geometric features of the pose"""
        pl = self.mp_pose
        
        # Helper to get coords
        def get_pos(idx):
            lm = landmarks[idx]
            return np.array([lm.x, lm.y])

        # Get Landmarks
        nose = get_pos(pl.NOSE.value)
        
        right_wrist = get_pos(pl.RIGHT_WRIST.value)
        left_wrist = get_pos(pl.LEFT_WRIST.value)
        
        right_hip = get_pos(pl.RIGHT_HIP.value)
        left_hip = get_pos(pl.LEFT_HIP.value)
        
        right_knee = get_pos(pl.RIGHT_KNEE.value)
        left_knee = get_pos(pl.LEFT_KNEE.value)
        
        right_ankle = get_pos(pl.RIGHT_ANKLE.value)
        left_ankle = get_pos(pl.LEFT_ANKLE.value)

        # --- FEATURE 1: OVERHEAD REACH ---
        # If wrists are significantly above the nose (y is smaller)
        is_overhead = (right_wrist[1] < nose[1]) or (left_wrist[1] < nose[1])

        # --- FEATURE 2: DEEP SQUAT ---
        # Calculate Knee Angle (Hip-Knee-Ankle)
        r_knee_angle = self._calculate_angle(right_hip, right_knee, right_ankle)
        l_knee_angle = self._calculate_angle(left_hip, left_knee, left_ankle)
        
        # If both knees are bent significantly (< 130 degrees)
        is_squatting = (r_knee_angle < 130) and (l_knee_angle < 130)

        # --- FEATURE 3: KNEE LIFT / SINGLE LEG ---
        # Check vertical distance between ankles
        ankle_y_diff = abs(right_ankle[1] - left_ankle[1])
        # If one ankle is > 15% of screen height higher than the other
        is_knee_lift = ankle_y_diff > 0.15 

        return {
            "is_overhead": is_overhead,
            "is_squatting": is_squatting,
            "is_knee_lift": is_knee_lift
        }

    def _calculate_angle(self, a, b, c):
        """Calculates angle ABC in degrees"""
        radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
        angle = np.abs(radians*180.0/np.pi)
        if angle > 180.0:
            angle = 360 - angle
        return angle