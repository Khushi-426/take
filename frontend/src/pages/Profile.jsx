import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  Trophy,
  Flame,
  Calendar,
  TrendingUp,
  Target,
  ArrowUpRight,
  ChevronRight,
  User,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./Profile.css";

// --- MOCK DATA FOR REALISTIC UI ---
const STATIC_DATA = {
  user: {
    name: "Alex Johnson",
    phase: "Week 4 — Mobility Phase",
    joined: "Nov 12, 2024",
  },
  metrics: {
    total_workouts: 24,
    total_minutes: 485,
    streak: 5,
    total_reps: 850,
    accuracy: 88,
  },
  graph_data: [
    { name: "Mon", score: 65, reps: 45 },
    { name: "Tue", score: 72, reps: 50 },
    { name: "Wed", score: 68, reps: 30 },
    { name: "Thu", score: 85, reps: 60 },
    { name: "Fri", score: 82, reps: 55 },
    { name: "Sat", score: 90, reps: 70 },
    { name: "Sun", score: 94, reps: 75 },
  ],
  recent_sessions: [
    {
      id: 1,
      title: "Knee Extension",
      date: "Today, 9:30 AM",
      score: 92,
      status: "Excellent",
    },
    {
      id: 2,
      title: "Shoulder Abduction",
      date: "Yesterday, 4:15 PM",
      score: 84,
      status: "Good",
    },
    {
      id: 3,
      title: "Squat Assessment",
      date: "Oct 24, 10:00 AM",
      score: 76,
      status: "Average",
    },
  ],
};

const Profile = () => {
  const { user } = useAuth(); // Keeps your auth logic
  const [stats, setStats] = useState(STATIC_DATA); // Initialize with static data immediately

  // COLORS
  const COLORS = {
    primary: "#69B341",
    primaryLight: "#E6F4EA",
    text: "#1A3C34",
    background: "#F9F7F3",
    orange: "#F59E0B",
    red: "#EF4444",
    blue: "#3B82F6",
  };

  // PIE CHART CONFIG
  const pieData = [
    { name: "Accuracy", value: stats.metrics.accuracy },
    { name: "Error", value: 100 - stats.metrics.accuracy },
  ];
  const PIE_COLORS = [COLORS.primary, "#E5E7EB"];

  // Safe Name Display
  const displayName = user?.name || stats.user.name;

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        {/* --- HEADER --- */}
        <div className="profile-header">
          <div className="header-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="welcome-text">
                Welcome back, <span className="highlight">{displayName}</span>
              </h1>
              <div className="user-phase-badge">
                <Activity size={16} />
                {stats.user.phase}
              </div>
            </motion.div>
          </div>
          <div className="header-right">
            <div className="date-pill">
              <Calendar size={18} />
              <span>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="stats-grid">
          <StatCard
            title="Total Sessions"
            value={stats.metrics.total_workouts}
            icon={Activity}
            color={COLORS.primary}
            subtext="+3 this week"
          />
          <StatCard
            title="Minutes Active"
            value={stats.metrics.total_minutes}
            icon={Clock}
            color={COLORS.orange}
            subtext="Avg 20m/session"
          />
          <StatCard
            title="Current Streak"
            value={`${stats.metrics.streak} Days`}
            icon={Flame}
            color={COLORS.red}
            subtext="Keep it up!"
          />
          <StatCard
            title="Total Reps"
            value={stats.metrics.total_reps}
            icon={Target}
            color={COLORS.blue}
            subtext="Target: 1000"
          />
        </div>

        {/* --- MAIN DASHBOARD CONTENT --- */}
        <div className="dashboard-grid">
          {/* LEFT: Activity Chart */}
          <motion.div
            className="card chart-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card-header">
              <h3>
                <TrendingUp size={20} /> Recovery Progress
              </h3>
              <div className="filter-tabs">
                <span className="active">Week</span>
                <span>Month</span>
              </div>
            </div>

            <div className="chart-area">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={stats.graph_data}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={COLORS.primary}
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor={COLORS.primary}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    cursor={{
                      stroke: COLORS.primary,
                      strokeWidth: 1,
                      strokeDasharray: "5 5",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* RIGHT: Accuracy & Recent Activity */}
          <div className="side-column">
            {/* Accuracy Card */}
            <motion.div
              className="card accuracy-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="card-header">
                <h3>
                  <Trophy size={20} /> Form Accuracy
                </h3>
              </div>
              <div className="donut-wrapper">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-label">
                  <span className="percentage">{stats.metrics.accuracy}%</span>
                  <span className="label">Excellent</span>
                </div>
              </div>
              <p className="insight-text">
                You are in the top <strong>15%</strong> of users this week.
              </p>
            </motion.div>

            {/* Recent Sessions List */}
            <motion.div
              className="card sessions-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="card-header">
                <h3>Recent Sessions</h3>
                <ChevronRight size={18} className="link-icon" />
              </div>
              <div className="session-list">
                {stats.recent_sessions.map((session) => (
                  <div key={session.id} className="session-item">
                    <div className="session-icon">
                      <Activity size={18} />
                    </div>
                    <div className="session-info">
                      <h4>{session.title}</h4>
                      <span>{session.date}</span>
                    </div>
                    <div
                      className={`session-score score-${session.status.toLowerCase()}`}
                    >
                      {session.score}%
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
  <motion.div className="stat-card" whileHover={{ y: -5 }}>
    <div className="stat-header">
      <div
        className="icon-box"
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        <Icon size={24} />
      </div>
    </div>
    <div className="stat-content">
      <h2 style={{ color: "#1A3C34" }}>{value}</h2>
      <p>{title}</p>
      {subtext && (
        <span className="stat-subtext" style={{ color: color }}>
          {subtext}
        </span>
      )}
    </div>
  </motion.div>
);

export default Profile;
