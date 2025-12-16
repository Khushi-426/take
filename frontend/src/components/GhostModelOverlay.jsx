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
// Indices based on MediaPipe Pose landmarks
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

// --- Ring Buffer for Motion Trail Data ---
const TRAIL_LENGTH = 10; // Number of previous frames to draw as a trail
const TRAIL_DATA = new Array(TRAIL_LENGTH)
  .fill(null)
  .map(() => ({ landmarks: null, color: null }));

const GhostModelOverlay = ({ ghostPoseData }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const pulsePhaseRef = useRef(0);
  const lastLandmarksRef = useRef(null); // Keep track of last frame for trail offset

  // Memoize color scheme for drawing
  const colorScheme = useMemo(
    () =>
      GHOST_COLORS[ghostPoseData?.color?.toUpperCase()] || GHOST_COLORS.GRAY,
    [ghostPoseData?.color]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;

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

    /**
     * Draws a single body outline path.
     * @param {*} landmarks - Landmark data for the frame.
     * @param {*} color - Hex color string.
     * @param {*} alpha - Global alpha transparency for this trail segment.
     * @param {*} lineWidth - Thickness of the line.
     * @param {*} blur - Shadow blur for the glow.
     * @param {*} time - Time for shimmer calculation.
     */
    const drawOutlineSegment = (
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

      const shimmerMagnitude = 1.5; // Slight shimmer on all segments
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;

      ctx.beginPath();
      let firstPoint = true;

      BODY_OUTLINE_PATH.forEach((idx, i) => {
        const landmark = landmarks[String(idx)];
        if (!landmark) return;

        const x = landmark[0] * containerWidth;
        const y = landmark[1] * containerHeight;

        // Apply Shimmer effect using sine wave based on time and index
        const offsetX = Math.sin(time * 0.5 + i * 0.5) * shimmerMagnitude;
        const offsetY = Math.cos(time * 0.5 + i * 0.5) * shimmerMagnitude;

        const shimmeryX = x + offsetX;
        const shimmeryY = y + offsetY;

        if (firstPoint) {
          ctx.moveTo(shimmeryX, shimmeryY);
          firstPoint = false;
        } else {
          ctx.lineTo(shimmeryX, shimmeryY);
        }
      });

      if (!firstPoint) {
        // Close the loop (connect last point to the first shoulder for a closed form)
        const startLandmark = landmarks[String(BODY_OUTLINE_PATH[3])]; // Left Shoulder
        if (startLandmark) {
          ctx.lineTo(
            startLandmark[0] * containerWidth,
            startLandmark[1] * containerHeight
          );
        }
      }

      ctx.stroke();
      ctx.restore();
    };

    /**
     * Handles the trail data and draws all trail segments.
     */
    const drawGhost = () => {
      // Use low opacity clear to create the trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      const { landmarks, color } = ghostPoseData;

      if (!landmarks || Object.keys(landmarks).length < 2) {
        return;
      }

      // --- Update Trail Buffer ---
      TRAIL_DATA.pop();
      TRAIL_DATA.unshift({
        landmarks: landmarks,
        color: color,
        timestamp: performance.now(),
      });

      pulsePhaseRef.current += 0.08;
      const time = performance.now() / 100;
      const pulseIntensity = Math.sin(pulsePhaseRef.current) * 0.1 + 0.9;

      // --- Draw Trail Segments (Ethereal Echo) ---
      TRAIL_DATA.forEach((frame, index) => {
        if (!frame.landmarks) return;

        const baseAlpha = 0.05;
        const decayFactor = (TRAIL_LENGTH - index) / TRAIL_LENGTH;

        // Outer Glow Layer (Diffused and Translucent)
        drawOutlineSegment(
          frame.landmarks,
          GHOST_COLORS[frame.color.toUpperCase()].glow,
          baseAlpha * decayFactor * 3, // Trail fades out
          40, // Very wide for heavy bloom
          20 * decayFactor, // Blur decreases as it fades
          time
        );

        // Inner Core Line (Sharper, brighter)
        if (index === 0) {
          // Only draw the current frame's inner core
          drawOutlineSegment(
            frame.landmarks,
            GHOST_COLORS[frame.color.toUpperCase()].primary,
            pulseIntensity, // Core pulses with full brightness
            10,
            30,
            time
          );
        }
      });
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
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 15,
          pointerEvents: "none",
          // *** THE HACKATHON WOW FACTOR: WebGL-like Bloom/Glow ***
          filter: `
            blur(0.5px) 
            drop-shadow(0 0 10px ${colorScheme.glow}) 
            saturate(150%)
          `,
          backgroundColor: "transparent", // Ensure it's transparent for the video feed underneath
          mixBlendMode: "screen", // Optional: Makes colors additive for an even brighter look
        }}
      />

      {/* Compact legend (Updated for the new Ethereal theme) */}
      <div
        style={{
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
        }}
      >
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

      {/* Instruction banner */}
      {ghostPoseData?.instruction && (
        <div
          style={{
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
          }}
        >
          {ghostPoseData.instruction}
        </div>
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
