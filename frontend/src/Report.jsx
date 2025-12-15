import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Download, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Confetti from "react-confetti";
import { useAuth } from "./context/AuthContext";

// --- UPDATED API URL (Must match Python Port 5001) ---
const API_URL = "http://localhost:5001";

const Report = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // Fetch from Python backend (Port 5001)
        const res = await fetch(`${API_URL}/report_data`);
        
        if (!res.ok) {
           throw new Error(`Server returned ${res.status}`);
        }

        const json = await res.json();
        if (json.error) {
           // Handle specific backend error message
           setError(json.error);
        } else {
           setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch report data:", err);
        setError("Could not load session report. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };

    // Small delay to ensure backend has finished processing stop_session
    const timeout = setTimeout(fetchReport, 500);
    return () => clearTimeout(timeout);
  }, []);

  if (loading)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
        }}
      >
        Generating Report...
      </div>
    );

  if (error)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          color: "#D32F2F",
        }}
      >
        <AlertTriangle size={48} />
        <h2>{error}</h2>
        <button
          onClick={() => navigate("/track")}
          style={{
            padding: "10px 20px",
            background: "#2C5D31",
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
          }}
        >
          Back to Tracker
        </button>
      </div>
    );

  // Prepare chart data
  const chartData = [
    { name: "Right", reps: data?.summary?.RIGHT?.total_reps || 0 },
    { name: "Left", reps: data?.summary?.LEFT?.total_reps || 0 },
  ];

  return (
    <div style={{ background: "#F9F7F3", minHeight: "100vh", padding: "40px" }}>
      <Confetti recycle={false} numberOfPieces={500} />

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "30px",
          padding: "40px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "2.5rem", color: "#1A3C34", margin: 0 }}>
              Session Complete!
            </h1>
            <p style={{ color: "#666", marginTop: "10px" }}>
              Great job on your {data?.exercise_name || "workout"} session.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "#F5F5F5",
              border: "none",
              padding: "12px 20px",
              borderRadius: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "600",
              color: "#555",
            }}
          >
            <ArrowLeft size={18} /> Dashboard
          </button>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <StatCard
            label="Total Duration"
            value={`${Math.floor(data?.duration || 0)}s`}
            color="#E3F2FD"
            textColor="#1565C0"
          />
          <StatCard
            label="Total Reps"
            value={
              (data?.summary?.RIGHT?.total_reps || 0) +
              (data?.summary?.LEFT?.total_reps || 0)
            }
            color="#E8F5E9"
            textColor="#2E7D32"
          />
          <StatCard
            label="Form Errors"
            value={
              (data?.summary?.RIGHT?.error_count || 0) +
              (data?.summary?.LEFT?.error_count || 0)
            }
            color="#FFEBEE"
            textColor="#C62828"
          />
        </div>

        {/* Charts & Details */}
        <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          {/* Chart */}
          <div style={{ flex: 1, minWidth: "300px", height: "300px" }}>
            <h3 style={{ marginBottom: "20px", color: "#444" }}>
              Symmetry Analysis
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="reps" fill="#2C5D31" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Feedback */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h3 style={{ marginBottom: "20px", color: "#444" }}>
              AI Feedback
            </h3>
            <div
              style={{
                background: "#FAFAFA",
                padding: "25px",
                borderRadius: "20px",
                border: "1px solid #eee",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>Right Arm</h4>
              <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "20px" }}>
                Completed {data?.summary?.RIGHT?.total_reps} reps with{" "}
                {data?.summary?.RIGHT?.error_count} detected form corrections.
              </p>

              <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>Left Arm</h4>
              <p style={{ color: "#666", fontSize: "0.9rem" }}>
                Completed {data?.summary?.LEFT?.total_reps} reps with{" "}
                {data?.summary?.LEFT?.error_count} detected form corrections.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            marginTop: "40px",
            paddingTop: "30px",
            borderTop: "1px solid #eee",
            display: "flex",
            justifyContent: "flex-end",
            gap: "15px",
          }}
        >
          <button className="btn-secondary" style={btnStyle}>
            <Share2 size={18} /> Share
          </button>
          <button className="btn-secondary" style={btnStyle}>
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, textColor }) => (
  <div
    style={{
      background: color,
      padding: "25px",
      borderRadius: "20px",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: "0.9rem",
        color: textColor,
        fontWeight: "700",
        marginBottom: "5px",
        opacity: 0.8,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: "2rem", fontWeight: "800", color: textColor }}>
      {value}
    </div>
  </div>
);

const btnStyle = {
  background: "#fff",
  border: "1px solid #ddd",
  padding: "12px 24px",
  borderRadius: "30px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "600",
  color: "#555",
};

export default Report;