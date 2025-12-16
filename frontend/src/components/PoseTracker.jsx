import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { useEffect, useRef } from "react";

export default function PoseTracker({ onPose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    pose.onResults((results) => {
      if (results.poseLandmarks) {
        onPose(results.poseLandmarks);
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await pose.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();
  }, [onPose]);

  return <video ref={videoRef} style={{ display: "none" }} playsInline />;
}
