import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { AlertTriangle, CheckCircle, Brain, Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// UPDATED: Pointing to Python Backend
const API_URL = "http://localhost:5001";

const RiskPrediction = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.email) return;

        const res = await fetch(`${API_URL}/api/user/ai_prediction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });

        if (res.ok) {
          const json = await res.json();
          // If empty/error, json might be { error: ... } or null
          if (!json.error) {
            setData(json);
          }
        }
      } catch (err) {
        console.error("AI Prediction Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div style={centerStyle}>Analyzing Biomechanics...</div>;

  if (!data)
    return (
      <div style={centerStyle}>
        <div style={{ textAlign: "center" }}>
          <Brain size={64} color="#ccc" style={{ marginBottom: "20px" }} />
          <h3>No Data Available</h3>
          <p>Complete at least one session to generate AI predictions.</p>
        </div>
      </div>
    );

  // Prepare Radar Data from Hotspots
  const radarData = [
    { subject: "Shoulder", A: data.hotspots?.shoulder || 0, fullMark: 100 },
    { subject: "Elbow", A: data.hotspots?.elbow || 0, fullMark: 100 },
    { subject: "Hip", A: data.hotspots?.hip || 0, fullMark: 100 },
    { subject: "Spine", A: 10, fullMark: 100 }, // Placeholder
    { subject: "Neck", A: 5, fullMark: 100 },   // Placeholder
  ];

  return (
    <div style={{ padding: "40px 5%", background: "#F9F7F3", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "2.5rem", color: "#1A3C34", marginBottom: "10px", display: "flex", alignItems: "center", gap: "15px" }}>
            <Brain color="#2C5D31" size={40} /> AI Recovery Prediction
          </h1>
          <p style={{ color: "#666", fontSize: "1.1rem" }}>
            Based on your movement patterns, our AI predicts your recovery trajectory.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
          
          {/* Main Chart: Recovery Trajectory */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Predicted ROM Improvement</h3>
            <div style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.rom_chart}>
                  <defs>
                    <linearGradient id="colorRom" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2C5D31" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2C5D31" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="rom" stroke="#2C5D31" fillOpacity={1} fill="url(#colorRom)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Radar */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Injury Risk Hotspots</h3>
            <div style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Risk Level" dataKey="A" stroke="#D32F2F" fill="#D32F2F" fillOpacity={0.5} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div style={{ marginTop: "30px", display: "grid", gap: "20px" }}>
          <h3 style={{ color: "#1A3C34", fontSize: "1.5rem" }}>AI Recommendations</h3>
          {data.recommendations?.map((rec, i) => (
            <div key={i} style={{ background: "#fff", padding: "20px", borderRadius: "15px", display: "flex", gap: "15px", alignItems: "flex-start", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <div style={{ marginTop: "3px" }}>
                {rec.includes("Imbalance") || rec.includes("Correction") ? (
                  <AlertTriangle color="#EF6C00" />
                ) : (
                  <CheckCircle color="#2C5D31" />
                )}
              </div>
              <div>
                <div style={{ fontWeight: "700", color: "#333", marginBottom: "5px" }}>
                  {rec.split(":")[0]}
                </div>
                <div style={{ color: "#666" }}>{rec.split(":")[1] || rec}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

// --- STYLES ---
const centerStyle = { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#888" };
const cardStyle = { background: "#fff", padding: "30px", borderRadius: "25px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" };
const cardTitleStyle = { marginBottom: "20px", color: "#444", fontSize: "1.2rem", fontWeight: "700" };

export default RiskPrediction;