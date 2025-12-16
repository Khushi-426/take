import React, { useRef, useEffect, useMemo } from "react";

// Enhanced color palette
const GHOST_COLORS = {
  // Red for high risk/bad form (Error, high energy/particle emission)
  RED: {
    primary: "rgba(255, 69, 58, 1.0)",
    glow: "rgba(255, 69, 58, 0.9)",
  },
  // Green for perfect form (Optimal, low energy/particle emission)
  GREEN: {
    primary: "rgba(52, 211, 153, 1.0)",
    glow: "rgba(52, 211, 153, 0.9)",
  },
  // Yellow for movement/transition
  YELLOW: {
    primary: "rgba(251, 191, 36, 1.0)",
    glow: "rgba(251, 191, 36, 0.9)",
  },
  GRAY: {
    primary: "rgba(156, 163, 175, 0.9)",
    glow: "rgba(156, 163, 175, 0.7)",
  },
};

// Define the peripheral path for the full-body outline (silhouette)
const BODY_OUTLINE_PATH = [
  16, // Right Wrist (R_W)
  14, // Right Elbow (R_E)
  12, // Right Shoulder (R_S)
  11, // Left Shoulder (L_S)
  13, // Left Elbow (L_E)
  15, // Left Wrist (L_W)
  23, // Left Hip (L_H)
  25, // Left Knee (L_K)
  27, // Left Ankle (L_A)
  28, // Right Ankle (R_A) - connect ankles
  26, // Right Knee (R_K)
  24, // Right Hip (R_H)
  12, // Close loop back to Right Shoulder (R_S)
];

// Define the standard connections for the full skeleton
const POSE_CONNECTIONS = [
  // Torso & Shoulders
  [12, 11], // Shoulders
  [11, 23], // Left Torso side
  [12, 24], // Right Torso side
  [23, 24], // Hips

  // Left Arm
  [11, 13],
  [13, 15],

  // Right Arm
  [12, 14],
  [14, 16],

  // Left Leg
  [23, 25],
  [25, 27],

  // Right Leg
  [24, 26],
  [26, 28],

  // Head/Face
  [0, 1],
  [0, 4],
];

// --- Constants for Motion Trail Data ---
const TRAIL_LENGTH = 8;
const SMOOTHING_FACTOR = 0.2; // Value for fluid motion

const GhostModelOverlay = ({ ghostPoseData }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const pulsePhaseRef = useRef(0);
  // Ref to hold the position of the ghost after smoothing
  const smoothedLandmarksRef = useRef(null);
  // FIX: Encapsulate trail data within the component instance using useRef
  const trailDataRef = useRef(
    new Array(TRAIL_LENGTH)
      .fill(null)
      .map(() => ({ landmarks: null, color: null, timestamp: 0 }))
  );

  // Memoize color scheme for drawing
  const colorScheme = useMemo(
    () =>
      GHOST_COLORS[ghostPoseData?.color?.toUpperCase()] || GHOST_COLORS.GRAY,
    [ghostPoseData?.color]
  );

  // --- UI Style Objects for improved readability ---

  const canvasStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 15,
    pointerEvents: "none",
    // Filter for the 'wow factor' bloom/glow
    filter: `
      blur(0.5px) 
      drop-shadow(0 0 10px ${colorScheme.glow}) 
      saturate(150%)
    `,
    backgroundColor: "transparent",
    mixBlendMode: "screen",
  };

  const legendContainerStyle = {
    position: "absolute",
    top: "20px",
    right: "20px",
    background:
      "linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95))",
    padding: "16px 20px",
    borderRadius: "14px",
    zIndex: 20,
    color: "white",
    fontSize: "0.85rem",
    fontWeight: "600",
    backdropFilter: "blur(15px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
  };

  const instructionBannerStyle = ghostPoseData?.instruction
    ? {
        position: "absolute",
        bottom: "100px",
        left: "50%",
        transform: "translateX(-50%)",
        background: colorScheme.primary,
        padding: "14px 32px",
        borderRadius: "40px",
        fontSize: "1.05rem",
        fontWeight: "800",
        color: "white",
        whiteSpace: "nowrap",
        boxShadow: `0 6px 24px ${colorScheme.glow}, 0 0 0 1px rgba(255, 255, 255, 0.2) inset`,
        backdropFilter: "blur(8px)",
        zIndex: 25,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        animation: "floatSmooth 2.5s ease-in-out infinite",
      }
    : {};

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    const trailData = trailDataRef.current; // Get the mutable ref content

    let containerWidth = container.clientWidth;
    let containerHeight = container.clientHeight;

    const setCanvasDimensions = () => {
      containerWidth = container.clientWidth;
      containerHeight = container.clientHeight;
      canvas.width = containerWidth;
      canvas.height = containerHeight;
    };

    setCanvasDimensions();

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });

    // Initialize smoothed landmarks on first run
    if (!smoothedLandmarksRef.current && ghostPoseData.landmarks) {
      smoothedLandmarksRef.current = { ...ghostPoseData.landmarks };
    }

    /**
     * Draws a path defined by a sequence of landmarks (used for the body outline/trail).
     */
    const drawPathSegment = (
      landmarks,
      color,
      alpha,
      lineWidth,
      blur,
      time
    ) => {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // SIMPLIFIED SHIMMER: Use a global shimmer magnitude
      const globalShimmer = Math.sin(time * 0.5) * 1.5;

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;

      ctx.beginPath();
      let firstPoint = true;

      BODY_OUTLINE_PATH.forEach((idx) => {
        const landmark = landmarks[String(idx)];
        if (!landmark) return;

        const x = landmark[0] * containerWidth + globalShimmer;
        const y = landmark[1] * containerHeight + globalShimmer;

        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      });

      if (!firstPoint) {
        // Close the loop to connect to the starting shoulder
        const startLandmark = landmarks[String(BODY_OUTLINE_PATH[2])]; // Right Shoulder (12)
        if (startLandmark) {
          ctx.lineTo(
            startLandmark[0] * containerWidth + globalShimmer,
            startLandmark[1] * containerHeight + globalShimmer
          );
        }
      }

      ctx.stroke();
      ctx.restore();
    };

    /**
     * OPTIMIZED: Draws the complete skeleton with uniform thickness.
     */
    const drawSkeletonSegment = (landmarks, color, alpha, lineWidth, blur) => {
      ctx.save();
      // Set all context properties ONCE
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;

      POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = landmarks[String(startIdx)];
        const end = landmarks[String(endIdx)];

        if (start && end) {
          ctx.beginPath();
          ctx.moveTo(start[0] * containerWidth, start[1] * containerHeight);
          ctx.lineTo(end[0] * containerWidth, end[1] * containerHeight);
          ctx.stroke();
        }
      });
      ctx.restore();
    };

    /**
     * OPTIMIZED: Draws the key landmark points using batched drawing for performance.
     */
    const drawLandmarkPoints = (
      landmarks,
      color,
      glowColor,
      pulseIntensity
    ) => {
      // Key joints for visual emphasis
      const keyJoints = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
      const pointSize = 7;

      ctx.save();
      ctx.globalAlpha = pulseIntensity * 0.95;

      // --- 1. Draw Outer Glow Layer (Batched drawing) ---
      ctx.fillStyle = glowColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();

      keyJoints.forEach((idx) => {
        const landmark = landmarks[String(idx)];
        if (landmark) {
          const x = landmark[0] * containerWidth;
          const y = landmark[1] * containerHeight;
          ctx.moveTo(x, y); // Move to center for next arc
          ctx.arc(x, y, pointSize + 1, 0, 2 * Math.PI);
        }
      });
      ctx.fill();

      // --- 2. Draw Inner Core Layer (Batched drawing) ---
      ctx.shadowBlur = 5; // Reduced blur for inner core
      ctx.fillStyle = color;
      ctx.beginPath();

      keyJoints.forEach((idx) => {
        const landmark = landmarks[String(idx)];
        if (landmark) {
          const x = landmark[0] * containerWidth;
          const y = landmark[1] * containerHeight;
          ctx.moveTo(x, y); // Move to center for next arc
          ctx.arc(x, y, pointSize * 0.5, 0, 2 * Math.PI);
        }
      });
      ctx.fill();

      ctx.restore();
    };

    /**
     * Handles the trail data and draws all trail segments.
     */
    const drawGhost = () => {
      // Use low opacity clear to create the volumetric trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      const { landmarks, color } = ghostPoseData;

      if (!landmarks || Object.keys(landmarks).length < 2) {
        return;
      }

      // --- Smoothing Logic for Current Frame ---
      let currentFrameLandmarks = landmarks;
      if (smoothedLandmarksRef.current) {
        const newSmoothedLandmarks = {};

        // Interpolate each landmark position
        Object.keys(landmarks).forEach((key) => {
          const newPos = landmarks[key];
          const oldPos = smoothedLandmarksRef.current[key];

          if (oldPos && newPos) {
            // Temporal interpolation
            newSmoothedLandmarks[key] = [
              oldPos[0] * (1 - SMOOTHING_FACTOR) + newPos[0] * SMOOTHING_FACTOR,
              oldPos[1] * (1 - SMOOTHING_FACTOR) + newPos[1] * SMOOTHING_FACTOR,
            ];
          } else {
            newSmoothedLandmarks[key] = newPos;
          }
        });

        smoothedLandmarksRef.current = newSmoothedLandmarks;
        currentFrameLandmarks = newSmoothedLandmarks; // USE SMOOTHED LANDMARKS
      } else {
        // First frame: just use the raw data
        smoothedLandmarksRef.current = { ...landmarks };
      }

      // --- Update Trail Buffer (Uses the raw, unsmoothed pose for the ghost echo) ---
      trailData.pop();
      trailData.unshift({
        landmarks: landmarks,
        color: color,
        timestamp: performance.now(),
      });

      pulsePhaseRef.current += 0.08;
      const time = performance.now() / 100;
      const pulseIntensity = Math.sin(pulsePhaseRef.current) * 0.15 + 0.85;

      const currentColorScheme =
        GHOST_COLORS[color.toUpperCase()] || GHOST_COLORS.GRAY;

      // --- Draw Trail Segments (Ethereal Echo - Uses the perimeter path) ---
      trailData.forEach((frame, index) => {
        if (!frame.landmarks) return;

        const baseAlpha = 0.05;
        const decayFactor = (TRAIL_LENGTH - index) / TRAIL_LENGTH;

        // Draw ONLY the outer glow layer for performance.
        drawPathSegment(
          frame.landmarks,
          GHOST_COLORS[frame.color.toUpperCase()].glow,
          baseAlpha * decayFactor * 3, // Trail fades out
          40, // Very wide for heavy bloom
          20 * decayFactor, // Blur decreases as it fades
          time
        );
      });

      // --- Draw Current Frame (Index 0 - Full Skeleton) ---

      // 1. Full Skeleton Glow (Wide, translucent)
      drawSkeletonSegment(
        currentFrameLandmarks, // Use smoothed landmarks
        currentColorScheme.glow,
        pulseIntensity * 0.5,
        10, // Base width
        30
      );

      // 2. Full Skeleton Core (Sharp, primary color)
      drawSkeletonSegment(
        currentFrameLandmarks, // Use smoothed landmarks
        currentColorScheme.primary,
        pulseIntensity * 0.95,
        5, // Constant line width for speed
        8
      );

      // 3. Draw Landmark Points (Optimized for performance)
      drawLandmarkPoints(
        currentFrameLandmarks, // Use smoothed landmarks
        currentColorScheme.primary,
        currentColorScheme.glow,
        pulseIntensity
      );
    };

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      drawGhost();
    };

    animate();

    const handleResize = () => {
      setCanvasDimensions();
      drawGhost();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [ghostPoseData, colorScheme]);

  return (
    <>
      <canvas ref={canvasRef} style={canvasStyle} />

      {/* Compact legend (Uses extracted styles) */}
      <div style={legendContainerStyle}>
        <div
          style={{
            marginBottom: "10px",
            fontSize: "0.65rem",
            opacity: 0.6,
            letterSpacing: "1.2px",
            fontWeight: "800",
          }}
        >
          FORM GUIDE (VOLUMETRIC ECHO)
        </div>

        {[
          { color: "GREEN", label: "Optimal Flow", icon: "✓" },
          { color: "YELLOW", label: "Transitioning", icon: "→" },
          { color: "RED", label: "Energy Disruption", icon: "!" },
        ].map(({ color, label, icon }) => (
          <div
            key={color}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: color !== "RED" ? "8px" : "0",
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: GHOST_COLORS[color].primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: "0.8rem",
                color: "white",
                boxShadow: `0 2px 8px ${GHOST_COLORS[color].glow}`,
              }}
            >
              {icon}
            </div>
            <span style={{ flex: 1, fontSize: "0.85rem" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Instruction banner (Uses extracted styles) */}
      {ghostPoseData?.instruction && (
        <div style={instructionBannerStyle}>{ghostPoseData.instruction}</div>
      )}

      <style>{`
        @keyframes floatSmooth {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-8px); }
        }
      `}</style>
    </>
  );
};

export default GhostModelOverlay;
