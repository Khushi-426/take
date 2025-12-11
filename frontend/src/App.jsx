import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Tracker from './Tracker';
import Report from './Report';
import Tutorial from './Tutorial'; // Import new file

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tutorial" element={<Tutorial />} /> {/* New Route */}
          <Route path="/track" element={<Tracker />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;