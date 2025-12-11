import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Icosahedron, MeshDistortMaterial } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Play } from 'lucide-react';

// --- 3D Floating Element ---
const FloatingShape = () => {
  const mesh = useRef();
  useFrame((state) => {
    if(mesh.current) {
        mesh.current.rotation.x = state.clock.getElapsedTime() * 0.2;
        mesh.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Icosahedron args={[1, 0]} ref={mesh} scale={2.5}>
        <MeshDistortMaterial color="#00bcd4" attach="material" distort={0.3} speed={2} wireframe />
      </Icosahedron>
    </Float>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();

  // Animation Variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { translateY: 50, opacity: 0 },
    show: { translateY: 0, opacity: 1, transition: { type: 'spring', stiffness: 50 } }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1c1c1c', position: 'relative', overflow: 'hidden' }}>
      
      {/* 3D Background Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Canvas>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <FloatingShape />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="dashboard-content" 
        style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}
      >
        
        <motion.h1 variants={item} style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '20px', textShadow: '0 0 20px rgba(0,255,255,0.5)' }}>
          PHYSIO<span style={{ color: '#00bcd4' }}>CHECK</span>
        </motion.h1>
        
        <motion.p variants={item} style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '40px' }}>
          AI-Powered Rehabilitation Recovery
        </motion.p>

        {/* Exercise Card */}
        <motion.div 
          variants={item}
          onClick={() => navigate('/tutorial')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            width: '400px'
          }}
        >
          <div style={{ background: '#00bcd4', padding: '15px', borderRadius: '50%' }}>
            <Activity size={32} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Bicep Curls</h3>
            <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>Bilateral Tracking & Form Correction</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Play size={24} color="#00bcd4" />
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default Dashboard;