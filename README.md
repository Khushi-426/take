<!-- 🧠🦾 DARK THEME README FOR PHYSIO CHECK 🦾🧠 -->

<div align="center">

<h1 align="center">
  <br/>
  🦾 Physio Check
</h1>

<h3>AI-Powered Physical Rehabilitation & Exercise Monitoring Platform</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Backend-Flask-black?style=for-the-badge&logo=flask" />
  <img src="https://img.shields.io/badge/Computer%20Vision-OpenCV-green?style=for-the-badge&logo=opencv" />
  <img src="https://img.shields.io/badge/AI-MediaPipe-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/ML-Scikit--Learn-red?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,js,html,css,python,flask,opencv,git" />
</p>

> 🚀 **Physio Check** is a next-generation **AI rehabilitation platform** that helps therapists **assign, track, and analyze physical therapy exercises** using **real-time computer vision**.

</div>

---

## 🌑 Overview

**Physio Check** bridges the gap between **traditional physiotherapy** and **modern AI systems**.

It enables:
- 🧑‍⚕️ Therapists to **assign exercises visually** using body-part selection
- 🧍 Patients to **perform rehab exercises at home**
- 🤖 AI to **track posture, count reps, validate form, and give feedback** in real time

The system uses **OpenCV + MediaPipe Pose Estimation** to analyze human motion and provide **objective, data-driven rehabilitation insights**.

---

## 🧠 Core Capabilities

| Feature | Description |
|------|-------------|
| 🦴 Body-Part Based Assignment | Therapist clicks on a body part to assign exercises |
| 📸 Real-Time Pose Tracking | Live skeletal tracking using MediaPipe |
| 🔢 Rep Counting | Automatic repetition detection |
| ⚠️ Posture Validation | Detects incorrect angles & unsafe movements |
| 📊 Progress Analytics | Recovery trends, accuracy, consistency |
| 👨‍⚕️ Therapist Dashboard | Patient management & monitoring |
| 🧍 Patient Dashboard | Exercise guidance & performance feedback |

---

## 🦾 Supported Exercises (Current)

| Exercise | Target Area |
|--------|-------------|
| 💪 Bicep Curls | Arms |
| 🦵 Knee Lifts | Lower Body |
| 🏋️ Shoulder Press | Shoulders |
| 🧎 Squats | Legs & Core |
| 🚣 Standing Row | Back & Arms |

> ⚡ Architecture allows **easy extension** for new rehab exercises.

---

## ⚙️ Tech Stack

| Layer | Technology |
|------|-----------|
| 💻 Frontend | React (Vite) |
| 🎨 UI / Animations | CSS, SVG, Charts |
| 🧠 Computer Vision | OpenCV + MediaPipe |
| 🤖 Machine Learning | Scikit-Learn |
| 🔥 Backend | Flask + REST APIs |
| 📡 Real-Time Processing | Python |
| 🗃️ Data | Session metrics & reports |

---

## 🗂️ Project Structure

```bash
Physio_Check/
├── frontend/
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Dashboards (Therapist / Patient)
│   │   ├── assets/            # SVGs, icons
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── app.py                 # Flask entry point
│   ├── workout_session.py     # Session state manager
│   ├── pose_processor.py      # MediaPipe pose logic
│   ├── angle_calculator.py    # Joint angle computation
│   ├── rep_counter.py         # Repetition logic
│   ├── calibration.py         # Exercise calibration
│   ├── models/                # ML models
│   └── constants.py
│
├── README.md
└── requirements.txt
```

---

````
## 🚀 Getting Started

Follow the steps below to set up **Physio Check** locally for development and testing.

---

### 📦 Prerequisites

Make sure you have the following installed:

- **Node.js** (v18 or later)
- **npm** or **yarn**
- **Python** (v3.9 – v3.11 recommended)
- **pip**
- **Git**
- A working **webcam** (required for pose tracking)

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/<your-username>/Physio_Check.git
cd Physio_Check
````

---

### 2️⃣ Backend Setup (Flask + Computer Vision)

Create and activate a virtual environment:

```
cd backend
python -m venv venv
```

**Activate the environment**

* **Windows**

```
venv\Scripts\activate
```

* **Linux / macOS**

```
source venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask server:

```bash
python app.py
```

The backend will run at:

```
http://localhost:5000
```

---

### 3️⃣ Frontend Setup (React + Vite)

Open a new terminal and navigate to the frontend directory:

```
cd frontend
```

Install dependencies:

```
npm install
```

Run the development server:

```
npm run dev
```

The frontend will be available at:

```
http://localhost:5173
```

---

### 4️⃣ Using the Application

1. Open the frontend in your browser.
2. Select **Therapist Dashboard** or **Patient Dashboard**.
3. Assign exercises based on body parts.
4. Allow webcam access for real-time pose tracking.
5. Perform exercises and receive live feedback.

---

### 🧪 Notes

* Ensure **only one camera-using application** is active at a time.
* Run backend **before** starting the frontend.
* MediaPipe performance improves in good lighting conditions.

---

### 🛠 Troubleshooting

* If MediaPipe fails to load, verify your Python version.
* If webcam doesn’t start, check browser permissions.
* Reinstall dependencies if module errors occur.

---
</div> 
