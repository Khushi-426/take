import React, { useRef, useEffect } from "react";

const CONNECTIONS = [
  [11, 12],
  [12, 14],
  [14, 16],
  [11, 13],
  [13, 15],
  [11, 23],
  [12, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [27, 28],
];

export default function EnclosingFigure({ landmarks, color }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!landmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 10;
    ctx.strokeStyle = color;
    ctx.shadowBlur = 30;
    ctx.shadowColor = color;

    CONNECTIONS.forEach(([a, b]) => {
      const p1 = landmarks[a];
      const p2 = landmarks[b];
      if (!p1 || !p2) return;

      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.stroke();
    });
  }, [landmarks, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 12,
      }}
    />
  );
}
