import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';

const Report = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/report_data')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{height:'100vh', background:'#1c1c1c', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}>Generating Report...</div>;

  // --- CRASH FIX: Check if summary exists ---
  // If the server restarted, data might be {} (empty). We handle that here.
  if (!data || !data.summary) {
    return (
        <div style={{height:'100vh', background:'#1c1c1c', color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'20px'}}>
            <h2>No Session Data Found</h2>
            <p style={{color:'#888'}}>The session data was lost (server restarted) or no workout was performed.</p>
            <button 
                onClick={() => navigate('/')} 
                style={{padding:'10px 20px', background:'#00bcd4', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}
            >
                Return to Dashboard
            </button>
        </div>
    );
  }

  const { summary } = data;
  const totalReps = summary.RIGHT.total_reps + summary.LEFT.total_reps;

  // --- Recommendation Logic ---
  const getRecommendations = () => {
    const recs = [];
    if (totalReps === 0) {
      return [{ title: "Start Up", text: "No reps detected. Ensure you are visible in the frame next time.", color: "#aaa" }];
    }

    // Tempo
    const rTime = summary.RIGHT.min_time;
    const lTime = summary.LEFT.min_time;
    if (rTime > 0 && lTime > 0) {
        const ratio = Math.max(rTime, lTime) / Math.min(rTime, lTime);
        if (ratio > 1.25) {
            const slower = rTime > lTime ? 'RIGHT' : 'LEFT';
            recs.push({ title: "Tempo Imbalance", text: `Your ${slower} arm is significantly slower. Try to match the speed of both arms.`, color: "#ff9800" });
        } else if (rTime < 1.5) {
            recs.push({ title: "Too Fast", text: "Slow down! Fast reps reduce muscle tension. Aim for 2-3 seconds per rep.", color: "#f44336" });
        } else {
            recs.push({ title: "Great Tempo", text: "Your repetition speed is consistent and controlled. Keep it up!", color: "#4CAF50" });
        }
    }

    // Form
    const rErr = summary.RIGHT.error_count;
    const lErr = summary.LEFT.error_count;
    if (rErr > 0 || lErr > 0) {
        const side = rErr > lErr ? "RIGHT" : (lErr > rErr ? "LEFT" : "BOTH");
        recs.push({ title: `Form Check (${side})`, text: `Detected ${rErr + lErr} form errors (Over-curl/Over-extend). Focus on stopping before locking out your elbows.`, color: "#f44336" });
    } else {
        recs.push({ title: "Perfect Form", text: "Zero form errors detected! Your technique is solid.", color: "#4CAF50" });
    }

    // Balance
    const diff = Math.abs(summary.RIGHT.total_reps - summary.LEFT.total_reps);
    if (diff > 2) {
        recs.push({ title: "Muscle Imbalance", text: `You did ${diff} more reps on one side. Always finish your set with equal reps.`, color: "#ff9800" });
    }

    return recs;
  };

  const recommendations = getRecommendations();

  // Animation Variants
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div style={{ minHeight: '100vh', background: '#1c1c1c', color: '#fff', padding: '40px', fontFamily: 'sans-serif' }}>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom:'1px solid #333', paddingBottom:'20px' }}>
            <div>
                <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Session <span style={{color: '#00bcd4'}}>Report</span></h1>
                <p style={{ color: '#888', margin: '5px 0 0 0' }}>Duration: {data.duration} seconds</p>
            </div>
            <button onClick={() => navigate('/')} style={{ background:'transparent', border:'1px solid #444', color:'#fff', padding:'10px 20px', borderRadius:'20px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px' }}>
                <ArrowLeft size={18} /> Back to Dashboard
            </button>
        </header>

        <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            {/* Total Summary */}
            <motion.div variants={item} style={{ background: '#252525', padding: '30px', borderRadius: '15px', textAlign: 'center', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#00bcd4' }}>{totalReps}</div>
                <div style={{ textTransform: 'uppercase', color: '#888', letterSpacing: '2px' }}>Total Repetitions</div>
            </motion.div>

            {/* Right Arm Card */}
            <motion.div variants={item} style={{ background: '#252525', padding: '25px', borderRadius: '15px', borderTop: '4px solid #f44336' }}>
                <h2 style={{ color: '#f44336', display: 'flex', alignItems: 'center', gap: '10px' }}>RIGHT ARM <Activity size={20}/></h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    <span>Reps</span> <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{summary.RIGHT.total_reps}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    <span>Best Time</span> <span style={{ fontWeight: 'bold', color: '#ff9800' }}>{summary.RIGHT.min_time.toFixed(2)}s</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Errors</span> <span style={{ fontWeight: 'bold', color: summary.RIGHT.error_count > 0 ? '#f44336' : '#4CAF50' }}>{summary.RIGHT.error_count}</span>
                </div>
            </motion.div>

            {/* Left Arm Card */}
            <motion.div variants={item} style={{ background: '#252525', padding: '25px', borderRadius: '15px', borderTop: '4px solid #00bcd4' }}>
                <h2 style={{ color: '#00bcd4', display: 'flex', alignItems: 'center', gap: '10px' }}>LEFT ARM <Activity size={20}/></h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    <span>Reps</span> <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{summary.LEFT.total_reps}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    <span>Best Time</span> <span style={{ fontWeight: 'bold', color: '#ff9800' }}>{summary.LEFT.min_time.toFixed(2)}s</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Errors</span> <span style={{ fontWeight: 'bold', color: summary.LEFT.error_count > 0 ? '#f44336' : '#4CAF50' }}>{summary.LEFT.error_count}</span>
                </div>
            </motion.div>

            {/* Recommendations Panel */}
            <motion.div variants={item} style={{ background: '#222', padding: '30px', borderRadius: '15px', gridColumn: '1 / -1', marginTop: '20px' }}>
                <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px' }}>AI Analysis & Recommendations</h3>
                
                {recommendations.length > 0 ? recommendations.map((rec, index) => (
                    <div key={index} style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                        <div>
                           {rec.title.includes("Perfect") ? <CheckCircle color={rec.color} /> : <AlertTriangle color={rec.color} />}
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 5px 0', color: rec.color }}>{rec.title}</h4>
                            <p style={{ margin: 0, color: '#ccc', fontSize: '0.95rem' }}>{rec.text}</p>
                        </div>
                    </div>
                )) : <div style={{color:'#aaa'}}>No specific recommendations available.</div>}
            </motion.div>

        </motion.div>
      </div>
    </div>
  );
};

export default Report;