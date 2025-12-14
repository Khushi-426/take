// frontend/src/TherapistDashboard.jsx

import React from 'react';
import { useAuth } from './context/AuthContext'; 

const TherapistDashboard = () => {
  const { user } = useAuth();
  const userName = user ? user.name || 'Therapist' : 'Therapist';

  return (
    <div style={{ padding: '20px', backgroundColor: '#e6f7ff', minHeight: '100vh' }}>
      <h1 style={{ 
        color: '#0050b3', 
        borderBottom: '3px solid #0050b3', 
        paddingBottom: '10px' 
      }}>
        Welcome, Dr. {userName}
      </h1>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '25px', 
        marginTop: '30px' 
      }}>
        
        {/* Card 1: Patient Management */}
        <div style={cardStyle}>
          <h2 style={cardHeaderStyle}>Patient Management</h2>
          <p>View, assign, and track all your active patient programs and progress reports.</p>
          <ul style={listStyle}>
            <li>Review pending patient reports</li>
            <li>Assign new rehabilitation programs</li>
          </ul>
          <button style={buttonStyle}>Go to Patient List</button>
        </div>

        {/* Card 2: Program Template Library */}
        <div style={cardStyle}>
          <h2 style={cardHeaderStyle}>Program Templates</h2>
          <p>Create and manage reusable exercise templates for efficient program assignment.</p>
          <ul style={listStyle}>
            <li>Create new template</li>
            <li>Edit existing templates</li>
          </ul>
          <button style={buttonStyle}>Manage Templates</button>
        </div>

        {/* Card 3: Messaging and Support */}
        <div style={cardStyle}>
          <h2 style={cardHeaderStyle}>Community & Support</h2>
          <p>Communicate with patients and other professionals.</p>
          <ul style={listStyle}>
            <li>Patient messages (3 new)</li>
            <li>Professional forums</li>
          </ul>
          <button style={buttonStyle}>Open Inbox</button>
        </div>
      </div>
    </div>
  );
};

const cardStyle = { 
    backgroundColor: 'white', 
    padding: '25px', 
    borderRadius: '12px', 
    boxShadow: '0 6px 15px rgba(0,0,0,0.1)',
    borderLeft: '5px solid #0050b3'
};
const cardHeaderStyle = { 
    marginBottom: '10px', 
    color: '#0050b3' 
};
const listStyle = { 
    listStyleType: 'disc', 
    paddingLeft: '20px', 
    margin: '15px 0' 
};
const buttonStyle = { 
    padding: '10px 15px', 
    backgroundColor: '#0050b3', 
    color: 'white', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    marginTop: '15px',
    fontWeight: 'bold'
};

export default TherapistDashboard;