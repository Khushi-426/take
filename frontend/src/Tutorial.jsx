import * as THREE from "three";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ArrowRight, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ======================================================
// HUMAN RIG – NO COLOR GLOW, FULL BICEP CURL ANIMATION
// ======================================================
const HumanRig = () => {
  const { scene } = useGLTF("/models/humanRig.glb");

  // Helper
  const get = (name) =>
    scene.getObjectByName(name) ||
    scene.getObjectByName(name.replace("mixamorig:", "mixamorig"));

  // Bones
  const LUpper = get("mixamorig:LeftArm");
  const LFore = get("mixamorig:LeftForeArm");
  const LHand = get("mixamorig:LeftHand");

  const RUpper = get("mixamorig:RightArm");
  const RFore = get("mixamorig:RightForeArm");
  const RHand = get("mixamorig:RightHand");

  const Head = get("mixamorig:Head");

  // Remove glow entirely
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = new THREE.MeshStandardMaterial({
          color: "#d0d0d0",
          roughness: 0.5,
          metalness: 0.2,
        });
      }
    });
  }, [scene]);

  // Finger logic
  const setFingerCurl = (p) => {
    const curl = THREE.MathUtils.lerp(0, -1.2, p);
    const fingers = ["Index", "Middle", "Ring", "Pinky"];

    fingers.forEach((f) => {
      for (let i = 1; i <= 4; i++) {
        const LB = get(`mixamorig:LeftHand${f}${i}`);
        const RB = get(`mixamorig:RightHand${f}${i}`);
        if (LB) LB.rotation.x = curl;
        if (RB) RB.rotation.x = curl;
      }
    });

    // Thumb
    const thumbX = THREE.MathUtils.lerp(0, -1.0, p);
    const thumbZ = THREE.MathUtils.lerp(0, 0.9, p);
    const thumbY = THREE.MathUtils.lerp(0, 0.3, p);

    for (let i = 1; i <= 4; i++) {
      const LT = get(`mixamorig:LeftHandThumb${i}`);
      const RT = get(`mixamorig:RightHandThumb${i}`);

      if (LT) {
        LT.rotation.x = thumbX;
        LT.rotation.z = thumbZ;
        LT.rotation.y = thumbY;
      }

      if (RT) {
        RT.rotation.x = thumbX;
        RT.rotation.z = -thumbZ;
        RT.rotation.y = -thumbY;
      }
    }
  };

  // Animation
  const tmpHead = new THREE.Vector3();
  const tmpHand = new THREE.Vector3();
  const mat = new THREE.Matrix4();
  const worldQ = new THREE.Quaternion();
  const parentQ = new THREE.Quaternion();
  const localQ = new THREE.Quaternion();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const p = (Math.sin(t * 1.6) + 1) / 2;

    setFingerCurl(p);

    // Reset at bottom
    if (p < 0.1) {
      if (LFore) LFore.rotation.set(0, 0, 0);
      if (RFore) RFore.rotation.set(0, 0, 0);

      if (LUpper) LUpper.rotation.set(0, 0, 0);
      if (RUpper) RUpper.rotation.set(0, 0, 0);

      if (LHand) LHand.rotation.set(0, 0, 0);
      if (RHand) RHand.rotation.set(0, 0, 0);

      return;
    }

    // Forearm motion
    const curlQ = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-1.7 * p, 0, 0)
    );
    if (LFore) LFore.quaternion.slerp(curlQ, 0.6);
    if (RFore) RFore.quaternion.slerp(curlQ, 0.6);

    // Shoulder stabilization
    if (LUpper) LUpper.rotation.x = THREE.MathUtils.lerp(0.1, -0.15, p);
    if (RUpper) RUpper.rotation.x = THREE.MathUtils.lerp(0.1, -0.15, p);

    // Aim hands toward head at peak
    if (p > 0.35 && Head) {
      Head.getWorldPosition(tmpHead);

      const aimHand = (handBone) => {
        if (!handBone) return;

        handBone.getWorldPosition(tmpHand);

        mat.lookAt(tmpHand, tmpHead, new THREE.Vector3(0, 1, 0));
        worldQ.setFromRotationMatrix(mat);

        handBone.parent.getWorldQuaternion(parentQ);
        localQ.copy(parentQ).invert().multiply(worldQ);

        handBone.quaternion.slerp(localQ, 0.55);
      };

      aimHand(LHand);
      aimHand(RHand);
    }
  });

  return <primitive object={scene} scale={1.6} position={[0, -1.6, 0]} />;
};

useGLTF.preload("/models/humanRig.glb");

// ======================================================
// UI + CANVAS — WITH IMPROVED LEFT PANEL
// ======================================================
const Tutorial = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#080808",
        color: "#fff",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* LEFT PANEL (IMPROVED) */}
      <div
        style={{
          width: "420px",
          padding: "55px 50px",
          background: "linear-gradient(180deg, #000 0%, #0b0b0b 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "4px 0 25px rgba(0,0,0,0.6)",
        }}
      >
        {/* PRO TAG */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(0,188,212,0.12)",
            padding: "8px 14px",
            borderRadius: "40px",
            border: "1px solid rgba(0,188,212,0.25)",
            width: "fit-content",
            marginBottom: "30px",
            backdropFilter: "blur(4px)",
          }}
        >
          <Video color="#00bcd4" size={20} />
          <span
            style={{
              color: "#00bcd4",
              letterSpacing: "2px",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            PRO TUTORIAL
          </span>
        </div>

        {/* TITLE */}
        <h1
          style={{
            fontSize: "3.6rem",
            marginBottom: "25px",
            fontWeight: "900",
            lineHeight: "1.05",
            letterSpacing: "-1px",
          }}
        >
          PERFECT <br />
          <span
            style={{
              color: "transparent",
              WebkitTextStroke: "2px #fff",
              WebkitTextFillColor: "transparent",
            }}
          >
            BICEP CURL
          </span>
        </h1>

        {/* CHECKLIST */}
        <div style={{ marginBottom: "40px" }}>
          <h3
            style={{
              color: "#fff",
              fontSize: "17px",
              marginBottom: "18px",
              fontWeight: "700",
              letterSpacing: "0.5px",
            }}
          >
            FORM CHECKLIST
          </h3>

          <div
            style={{
              color: "#bbb",
              fontSize: "15px",
              lineHeight: "1.85",
              paddingLeft: "5px",
            }}
          >
            ✓ Elbows pinned to sides <br />
            ✓ Controlled curl motion <br />
            ✓ Squeeze at peak contraction <br />
            ✓ Full extension at bottom <br />
            ✓ No swinging or momentum
          </div>

          {/* INFO BOX */}
          <div
            style={{
              padding: "15px 18px",
              background: "rgba(255, 68, 68, 0.12)",
              borderLeft: "3px solid #ff4444",
              marginTop: "28px",
              borderRadius: "4px",
            }}
          >
            <p
              style={{
                color: "#ff4444",
                fontSize: "14px",
                margin: 0,
                fontWeight: "600",
                letterSpacing: "0.3px",
              }}
            >
              🔴 Muscle activation indicator
            </p>
            <p
              style={{
                color: "#ff8888",
                fontSize: "13px",
                margin: "6px 0 0 0",
              }}
            >
              Biceps + Forearms engagement
            </p>
          </div>
        </div>

        {/* CTA BUTTON */}
        <button
          onClick={() => navigate("/track")}
          style={{
            padding: "18px 26px",
            background: "#ffffff",
            border: "none",
            borderRadius: "8px",
            color: "#000",
            fontWeight: "900",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            fontSize: "16px",
            transition: "all 0.25s ease",
            boxShadow: "0 4px 14px rgba(255,255,255,0.15)",
            letterSpacing: "0.5px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#00bcd4";
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,188,212,0.45)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(255,255,255,0.15)";
            e.currentTarget.style.color = "#000";
          }}
        >
          START TRACKING <ArrowRight size={20} />
        </button>
      </div>

      {/* RIGHT — 3D MODEL */}
      <div style={{ flex: 1, background: "#000" }}>
        <Canvas camera={{ position: [2, 1.5, 4], fov: 45 }} shadows>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 2]} intensity={1.4} />
          <directionalLight position={[-3, 2, -3]} intensity={1.0} />

          <Suspense fallback={null}>
            <HumanRig />
          </Suspense>

          <OrbitControls autoRotate autoRotateSpeed={0.6} enableZoom />
        </Canvas>
      </div>
    </div>
  );
};

export default Tutorial;
