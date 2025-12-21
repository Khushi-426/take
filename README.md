# 🏥 PhysioCheck – AI-Powered Rehabilitation Platform

Here is a clean, professional README.md formatted specifically for GitHub. It covers the project structure, features, tech stack, and installation instructions based on the code provided.

**PhysioCheck** is a full-stack rehabilitation platform designed to bridge the gap between patients and therapists using advanced Computer Vision and AI. It provides real-time posture correction, rep counting, and recovery analytics for patients, while offering therapists a dedicated dashboard to monitor progress and assign rehabilitation protocols.

---

## 🚀 Features

### 👤 For Patients

- **Real-Time AI Coaching**  
  Utilizes Computer Vision (OpenCV + MediaPipe) to track body landmarks, count reps, and detect form errors instantly during exercises.

- **Smart AI Assistant**  
  Features an integrated "AI Coach" powered by Google Gemini, capable of answering context-aware questions about recovery, form, and specific workout data.

- **Visual Guides**  
  Includes a "Ghost Model" overlay to help users visualize and mimic correct movements during their session.

- **Progress Tracking**  
  Offers detailed analytics charts for Range of Motion (ROM), accuracy, and consistency over time.

---

### 🧑‍⚕️ For Therapists

- **Patient Dashboard**  
  A centralized hub to monitor patient adherence, recovery trends, and risk levels (classified as High Risk, Alert, or Normal).

- **Protocol Assignment**  
  Allows therapists to assign specific exercises (e.g., Squats, Bicep Curls) with custom difficulties to individual patients.

- **Notifications**  
  Real-time alerts system to track patient milestones or flag lack of activity.

---

## 🛠️ Tech Stack

The project utilizes a hybrid architecture comprising a React Frontend, a Node.js/Express Backend for API management, and a Flask/Python Backend for high-performance AI and Computer Vision processing.

- **Frontend:**  
  React (Vite), Tailwind CSS, Three.js (@react-three/fiber), Recharts, Socket.io-client

- **API Backend:**  
  Node.js, Express, MongoDB (Mongoose), JWT Authentication, Bcrypt

- **AI Engine:**  
  Python, Flask, OpenCV, MediaPipe, Scikit-learn (Random Forest), Google Gemini API, Flask-SocketIO

- **Database:**  
  MongoDB Cloud (Atlas)

---

## 📂 Project Structure

```text
PhysioCheck/
├── frontend/             # React + Vite application
│   ├── src/              # Components, Pages, 3D Models
│   └── public/           # Static assets
├── backend/              # Node.js API Server
│   ├── models/           # Mongoose Schemas (User, Protocol, Session)
│   ├── routes/           # Express Routes (Auth, Therapist, etc.)
│   └── config/           # DB Configuration
├── app.py                # Main Python Flask App (AI & Streaming)
├── ai_engine.py          # AI Logic (Recovery Prediction, Gemini Integration)
├── workout_session.py    # Computer Vision Logic (Rep counting, Angle calc)
└── ...
⚙️ Installation & Setup
Prerequisites
Node.js & npm

Python 3.8+

MongoDB Instance

1️⃣ Database Setup
Ensure you have a MongoDB connection string ready.
The application uses a database named physiocheck_db.

2️⃣ Python AI Engine (Flask)
This service handles the camera feed and AI processing.

bash
Copy code
# Navigate to the root directory
cd Physio_

# Install Python dependencies
pip install flask flask-cors flask-socketio flask-bcrypt flask-mail pymongo \
opencv-python mediapipe numpy joblib python-dotenv requests certifi

# Create a .env file in the root directory
# (See Configuration section below)

# Start the Python Server (Runs on Port 5001)
python app.py
Note: This server handles the video feed and socket connections.

3️⃣ Backend API (Node.js)
This service handles authentication, user management, and data persistence.

bash
Copy code
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create a .env file in the backend directory
# (See Configuration section below)

# Start the Node Server (Runs on Port 5000)
npm run dev
4️⃣ Frontend (React)
The user interface.

bash
Copy code
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server (Default Vite port)
npm run dev
🔐 Configuration
You need to configure environment variables for both the Python and Node.js backends.

Root .env (for Python app.py)
env
Copy code
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
GEMINI_API_KEY=your_google_gemini_api_key
Backend .env (for Node server.js)
env
Copy code
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/
JWT_SECRET=your_jwt_secret_key
🏃 Usage
Start all services

Python → Port 5001

Node.js → Port 5000

React → Default Vite port

Sign Up / Login
Create an account via the web interface. Patients and Therapists have different dashboards.

Start Workout

Navigate to the Dashboard

Select an exercise (e.g., Bicep Curl)

Allow camera access when prompted

Perform the exercise; the AI will count reps and correct form in real time

Therapist View
Log in as a therapist to assign exercises and view detailed patient recovery data.

🧠 AI Capabilities
Pose Estimation
Uses MediaPipe Pose to track 33 body landmarks.

Angle Calculation
Calculates joint angles (elbow, knee, shoulder) to determine rep completion and form quality.

Recovery Prediction
Analyzes session history using a Random Forest model (or heuristic fallback) to predict recovery trends and highlight asymmetry between left and right limbs.

Generative Feedback
The AIEngine class connects to Google's Gemini Flash-Lite model to provide context-aware answers to user queries like:

"Why is my shoulder hurting?"

"How is my form?"


```
