import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FLAME_COUNT = 12;
const PARTICLE_COUNT = 18;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  x: randomBetween(5, 95),
  y: randomBetween(10, 90),
  size: randomBetween(3, 8),
  delay: randomBetween(0, 2),
  duration: randomBetween(2, 4),
}));

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('enter'); // enter → hold → exit

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('exit'), 2800);
    const doneTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3400);
    return () => { clearTimeout(holdTimer); clearTimeout(doneTimer); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse at 50% 40%, #1a0a00 0%, #0d0d0d 60%, #000 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Ambient glow rings */}
          {[1, 2, 3].map(i => (
            <motion.div
              key={`ring-${i}`}
              style={{
                position: 'absolute',
                width: `${180 + i * 120}px`,
                height: `${180 + i * 120}px`,
                borderRadius: '50%',
                border: `1px solid rgba(255, 100, 20, ${0.15 / i})`,
                boxShadow: `0 0 ${30 * i}px rgba(255, 80, 0, ${0.06 / i})`,
              }}
              animate={{
                scale: [1, 1.06, 1],
                opacity: [0.4 / i, 0.8 / i, 0.4 / i],
              }}
              transition={{ repeat: Infinity, duration: 2.5 + i * 0.5, ease: 'easeInOut', delay: i * 0.3 }}
            />
          ))}

          {/* Floating spark particles */}
          {particles.map(p => (
            <motion.div
              key={`spark-${p.id}`}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: `radial-gradient(circle, #ffb347, #ff6600)`,
                boxShadow: '0 0 6px 2px rgba(255,100,0,0.5)',
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 0.9, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: p.duration,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Main logo container */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 18, duration: 0.9 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}
          >
            {/* Logo icon */}
            <div style={{ position: 'relative', width: 150, height: 150, marginBottom: 8 }}>
              {/* Outer glow */}
              <motion.div
                style={{
                  position: 'absolute', inset: -20,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,80,0,0.35) 0%, transparent 70%)',
                }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              />

              {/* Spinning ring accent */}
              <motion.div
                style={{
                  position: 'absolute', inset: -8,
                  borderRadius: '50%',
                  border: '2px dashed rgba(255, 120, 30, 0.4)',
                }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              />

              {/* The icon image */}
              <motion.img
                src={`${import.meta.env.BASE_URL}favicon.png`}
                alt="PizzaRush Logo"
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 24px rgba(255,80,0,0.7)) drop-shadow(0 4px 16px rgba(0,0,0,0.8))',
                  borderRadius: 28,
                }}
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              />
            </div>

            {/* Brand name */}
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                fontSize: 52,
                fontWeight: 900,
                fontFamily: "'Outfit', 'Inter', sans-serif",
                letterSpacing: '-1.5px',
                lineHeight: 1,
                userSelect: 'none',
              }}>
                <span style={{ color: '#ffffff' }}>Pizza</span>
                <span style={{
                  background: 'linear-gradient(135deg, #ff6a00 0%, #ffb347 50%, #ff4500 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>Rush</span>
              </div>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              style={{
                marginTop: 10,
                color: 'rgba(255,255,255,0.45)',
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Hot. Fresh. Lightning Fast.
            </motion.p>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              style={{ marginTop: 36, width: 180 }}
            >
              <div style={{
                width: '100%', height: 3,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 99, overflow: 'hidden',
              }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1.0, duration: 1.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #ff6a00, #ffb347)',
                    borderRadius: 99,
                    boxShadow: '0 0 10px rgba(255, 106, 0, 0.7)',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            style={{
              position: 'absolute', bottom: 40,
              color: 'rgba(255,255,255,0.18)',
              fontSize: 12,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.08em',
            }}
          >
            Delivering happiness, one slice at a time 🍕
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
