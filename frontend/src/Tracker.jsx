import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, ArrowLeft, Maximize } from 'lucide-react';

const Tracker = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [data, setData] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [feedback, setFeedback] = useState("Press Start to Begin");
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  // Start/Stop Logic
  const toggleTracking = async () => {
    if (active) {
      try {
          await fetch('http://localhost:5000/stop_tracking');
      } catch(e) { console.error(e) }
      
      setActive(false);
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
      navigate('/report'); // Redirect to Report
    } else {
      try {
          const res = await fetch('http://localhost:5000/start_tracking');
          const json = await res.json();
          if (json.status === 'success') {
            setActive(true);
            setSessionTime(0);
            intervalRef.current = setInterval(fetchData, 100);
            timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
          }
      } catch (e) {
          alert("Backend error. Check console.");
      }
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/data_feed');
      const json = await res.json();
      setData(json);
      
      if (json.status === 'COUNTDOWN') {
        setFeedback(`Starting in ${json.remaining}...`);
      } else if (json.status === 'ACTIVE') {
        let msg = "MAINTAIN FORM";
        let color = "#4CAF50";

        if (json.RIGHT.feedback) { msg = `RIGHT: ${json.RIGHT.feedback}`; color = "#f44336"; }
        else if (json.LEFT.feedback) { msg = `LEFT: ${json.LEFT.feedback}`; color = "#f44336"; }
        
        setFeedback(msg);
        const fbBox = document.getElementById('feedback-box');
        if(fbBox) {
            fbBox.style.color = color;
            fbBox.style.borderColor = color;
        }
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    return () => { clearInterval(intervalRef.current); clearInterval(timerRef.current); }
  }, []);

  // Format seconds to MM:SS
  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', color: '#fff', overflow: 'hidden' }}>
      
      {/* COMPACT SIDEBAR */}
      <div style={{ width: '280px', background: '#111', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header / Timer */}
        <div style={{ padding: '20px', borderBottom: '1px solid #333', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#00bcd4', fontSize: '1.2rem', fontWeight: 'bold' }}>
            <Timer size={20} />
            {formatTime(sessionTime)}
          </div>
        </div>

        {/* Scrollable Metrics Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
            {['RIGHT', 'LEFT'].map(arm => {
                const metrics = data ? data[arm] : null;
                const isRight = arm === 'RIGHT';
                const color = isRight ? '#f44336' : '#00bcd4';
                
                return (
                <div key={arm} style={{ marginBottom: '20px', background: '#1a1a1a', borderRadius: '12px', padding: '15px', borderLeft: `4px solid ${color}` }}>
                    <h3 style={{ margin: '0 0 10px 0', color: color, fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                        {arm} ARM
                        <span style={{color:'#fff'}}>{metrics ? metrics.stage : '--'}</span>
                    </h3>
                    
                    {/* Primary Stats */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>REPS</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{metrics ? metrics.rep_count : '--'}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>ANGLE</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{metrics ? metrics.angle : '--'}°</div>
                        </div>
                    </div>

                    {/* Angle Visual Bar */}
                    <div style={{ height: '6px', background: '#333', borderRadius: '3px', marginBottom: '15px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: metrics ? `${(metrics.angle / 180) * 100}%` : '0%', 
                            height: '100%', background: color, transition: 'width 0.1s linear' 
                        }} />
                    </div>

                    {/* Detailed Time Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', fontSize: '0.75rem', color: '#aaa' }}>
                        <div style={{ background: '#222', padding: '5px', borderRadius: '5px', textAlign: 'center' }}>
                            <div>CURR</div>
                            <div style={{ color: '#fff' }}>{metrics && metrics.curr_rep_time > 0 ? metrics.curr_rep_time.toFixed(1) : '--'}s</div>
                        </div>
                        <div style={{ background: '#222', padding: '5px', borderRadius: '5px', textAlign: 'center' }}>
                            <div>BEST</div>
                            <div style={{ color: '#4CAF50' }}>{metrics && metrics.min_rep_time > 0 ? metrics.min_rep_time.toFixed(1) : '--'}s</div>
                        </div>
                        <div style={{ background: '#222', padding: '5px', borderRadius: '5px', textAlign: 'center' }}>
                            <div>LAST</div>
                            <div style={{ color: '#fff' }}>{metrics && metrics.rep_time > 0 ? metrics.rep_time.toFixed(1) : '--'}s</div>
                        </div>
                    </div>
                </div>
            )})}
        </div>

        {/* Footer Controls */}
        <div style={{ padding: '20px', borderTop: '1px solid #333' }}>
            <button 
                onClick={toggleTracking}
                style={{ 
                    width: '100%', padding: '15px', borderRadius: '30px', border: 'none', 
                    fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem',
                    background: active ? '#f44336' : '#4CAF50', color: '#fff',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }}
            >
                {active ? 'STOP SESSION' : 'START SESSION'}
            </button>
            <div 
                onClick={() => navigate('/')} 
                style={{ textAlign: 'center', marginTop: '15px', color: '#666', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <ArrowLeft size={14} /> Back to Menu
            </div>
        </div>
      </div>

      {/* MAXIMIZED VIDEO AREA */}
      <div style={{ flex: 1, position: 'relative', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {active ? (
          <img 
            src="http://localhost:5000/video_feed" 
            style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain', // Ensures full view of arms
                display: 'block'
            }} 
            alt="Stream"
          />
        ) : (
          <div style={{ textAlign: 'center', opacity: 0.3 }}>
            <Maximize size={64} style={{ marginBottom: '20px' }} />
            <h2>Ready to Workout</h2>
            <p>Ensure your upper body is clearly visible</p>
          </div>
        )}

        {/* FEEDBACK OVERLAY */}
        {active && (
            <div id="feedback-box" style={{ 
            position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.85)', padding: '15px 40px', borderRadius: '50px',
            fontSize: '1.8rem', fontWeight: 'bold', border: '2px solid #444', whiteSpace: 'nowrap',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transition: 'all 0.2s'
            }}>
            {feedback}
            </div>
        )}
      </div>

    </div>
  );
};

export default Tracker;