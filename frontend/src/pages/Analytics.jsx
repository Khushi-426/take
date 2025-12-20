import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Activity, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// UPDATED: Pointing to Python Backend
const API_URL = "http://localhost:5001";

const Analytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.email) return;

        const res = await fetch(`${API_URL}/api/user/analytics_detailed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });

        if (!res.ok) throw new Error("Failed to fetch analytics");

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Analytics Error:", err);
        setError("Could not load analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <div style={centerStyle}>Loading Analytics...</div>;
  if (error) return <div style={{ ...centerStyle, color: "red" }}>{error}</div>;

  // Safe fallback if history is empty
  const history = data?.history || [];
  const exerciseStats = data?.exercise_stats || [];

  return (
    <div
      style={{ padding: "40px 5%", background: "#F9F7F3", minHeight: "100vh" }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1
          style={{ fontSize: "2.5rem", color: "#1A3C34", marginBottom: "30px" }}
        >
          Your Progress
        </h1>

        {/* KPI Cards */}
        <div style={gridStyle}>
          <Card
            icon={<Activity color="#fff" />}
            title="Avg. Accuracy"
            value={`${data?.average_accuracy || 0}%`}
            color="#2C5D31"
          />
          <Card
            icon={<TrendingUp color="#fff" />}
            title="Total Sessions"
            value={history.length}
            color="#EF6C00"
          />
          <Card
            icon={<Calendar color="#fff" />}
            title="Last Workout"
            value={
              history.length > 0
                ? history[history.length - 1].date_short
                : "N/A"
            }
            color="#1565C0"
          />
        </div>

        {/* Charts */}
        <div
          style={{
            marginTop: "40px",
            display: "grid",
            gap: "30px",
            gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
          }}
        >
          {/* Line Chart: Accuracy Over Time */}
          <div style={chartCardStyle}>
            <h3 style={chartTitleStyle}>Accuracy Trend</h3>
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date_short" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#2C5D31"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart: Exercise Frequency */}
          <div style={chartCardStyle}>
            <h3 style={chartTitleStyle}>Exercise Volume</h3>
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exerciseStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="total_reps"
                    fill="#1565C0"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const centerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  fontSize: "1.2rem",
  color: "#666",
};
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
};
const chartCardStyle = {
  background: "#fff",
  padding: "25px",
  borderRadius: "20px",
  boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
};
const chartTitleStyle = {
  marginBottom: "20px",
  color: "#444",
  fontSize: "1.2rem",
};

const Card = ({ icon, title, value, color }) => (
  <div
    style={{
      background: "white",
      padding: "25px",
      borderRadius: "20px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
    }}
  >
    <div
      style={{
        width: "50px",
        height: "50px",
        borderRadius: "12px",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontSize: "0.9rem", color: "#888", fontWeight: "600" }}>
        {title}
      </div>
      <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#333" }}>
        {value}
      </div>
    </div>
  </div>
);

export default Analytics;
