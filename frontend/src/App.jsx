// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 
import { GoogleOAuthProvider } from '@react-oauth/google'; 

// Renaming the import for clarity: Existing Dashboard is now PatientDashboard
import PatientDashboard from './Dashboard'; 
import TherapistDashboard from './TherapistDashboard'; // NEW: Therapist Dashboard
import HomeRedirect from './HomeRedirect'; // NEW: Logic for the root path

import Tracker from './Tracker';
import Report from './Report';
import Tutorial from './Tutorial'; 
import Profile from './pages/Profile';
import Analytics from './pages/Analytics'; // Daily Report Graphs
import RiskPrediction from './pages/RiskPrediction'; // AI Recovery Page
import Navbar from './components/Navbar';
import * as Pages from './pages/PlaceholderPages';

// ✅ YOUR GOOGLE CLIENT ID
const GOOGLE_CLIENT_ID = "254404106678-ql7lb3kidfsvdjk5a4fcjl7t7kn61aos.apps.googleusercontent.com"; 

const Layout = ({ children }) => {
  const location = useLocation();
  // Hide Navbar only on the active tracking page to maximize screen space
  const showNavbar = location.pathname !== '/track';

  return (
    <>
      {showNavbar && <Navbar />}
      <div style={{ minHeight: 'calc(100vh - 80px)' }}>
        {children}
      </div>
    </>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* --- MAIN ENTRY POINT --- */}
              {/* The root path now uses HomeRedirect to check user type and send them to the correct dashboard. */}
              <Route path="/" element={<HomeRedirect />} />
              
              {/* --- DASHBOARDS --- */}
              {/* Patient Dashboard (The existing Dashboard component, now on a dedicated path) */}
              <Route path="/patient-dashboard" element={<PatientDashboard />} />
              {/* Therapist Dashboard (NEW, completely separate UI) */}
              <Route path="/therapist-dashboard" element={<TherapistDashboard />} />
              
              {/* --- Other Main Pages --- */}
              <Route path="/track" element={<Tracker />} />
              <Route path="/report" element={<Report />} />
              
              {/* --- Training Section --- */}
              <Route path="/training/library" element={<Tutorial />} /> 
              <Route path="/training/detail" element={<Pages.ExerciseDetail />} />
              
              {/* --- Authentication --- */}
              <Route path="/auth/login" element={<Pages.Login />} />
              <Route path="/auth/signup" element={<Pages.Signup />} />
              <Route path="/auth/onboarding" element={<Pages.Onboarding />} />

              {/* --- Profile --- */}
              <Route path="/profile/overview" element={<Profile />} />
              <Route path="/profile/medical" element={<Pages.MedicalInfo />} />
              <Route path="/profile/preferences" element={<Pages.Preferences />} />

              {/* --- Programs --- */}
              <Route path="/programs/my-programs" element={<Pages.MyPrograms />} />
              <Route path="/programs/custom" element={<Pages.CustomProgram />} />

              {/* --- ANALYTICS ROUTES --- */}
              {/* 1. Daily Report (Accuracy Graphs) */}
              <Route path="/analytics/accuracy" element={<Analytics />} />
              {/* 2. AI Recovery (Prediction & Risk) */}
              <Route path="/analytics/risk" element={<RiskPrediction />} />

              {/* --- Community --- */}
              <Route path="/community/achievements" element={<Pages.Achievements />} />
              <Route path="/community/challenges" element={<Pages.Challenges />} />
              <Route path="/community/therapist" element={<Pages.TherapistModule />} />

              {/* --- Support --- */}
              <Route path="/support/faq" element={<Pages.FAQ />} />
              <Route path="/support/contact" element={<Pages.Contact />} />
              <Route path="/support/legal" element={<Pages.Legal />} />

              <Route path="/tutorial" element={<Tutorial />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;