'use client';

import { motion, useReducedMotion } from 'motion/react';

export function MathFloatingShapes() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return null;
  }

  const shapes = [
    {
      id: 'flower-1',
      x: '10%',
      y: '16%',
      duration: 7,
      mobile: true,
      content: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <circle cx="18" cy="11" r="5.5" fill="#F4C542" />
          <circle cx="24.5" cy="15.5" r="5.5" fill="#F4C542" />
          <circle cx="22" cy="23.5" r="5.5" fill="#F4C542" />
          <circle cx="14" cy="23.5" r="5.5" fill="#F4C542" />
          <circle cx="11.5" cy="15.5" r="5.5" fill="#F4C542" />
          <circle cx="18" cy="18" r="4.2" fill="#F28C38" />
        </svg>
      ),
    },
    {
      id: 'sparkle-gold',
      x: '86%',
      y: '20%',
      duration: 8.5,
      mobile: false,
      content: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M 16 2 C 16 10 10 16 2 16 C 10 16 16 22 16 30 C 16 22 22 16 30 16 C 22 16 16 10 16 2 Z"
            fill="#F4C542"
            stroke="#2F4A1E"
            strokeWidth="1.8"
          />
        </svg>
      ),
    },
    {
      id: 'leaf-green',
      x: '84%',
      y: '68%',
      duration: 6.8,
      mobile: true,
      content: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path
            d="M 6 30 C 9 18 21 8 32 4 C 32 16 22 28 6 30 Z"
            fill="#6CA24A"
            stroke="#2F4A1E"
            strokeWidth="1.8"
          />
          <path
            d="M 9 27 Q 19 20 28 8"
            stroke="#FFF7E6"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: 'notebook-mini',
      x: '7%',
      y: '72%',
      duration: 9.2,
      mobile: false,
      content: (
        <svg width="38" height="42" viewBox="0 0 38 42" fill="none" aria-hidden="true">
          <rect x="5" y="4" width="28" height="34" rx="8" fill="#C7DDAE" stroke="#2F4A1E" strokeWidth="2.5" />
          <line x1="12" y1="13" x2="26" y2="13" stroke="#FFF7E6" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="20" x2="26" y2="20" stroke="#FFF7E6" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="27" x2="20" y2="27" stroke="#FFF7E6" strokeWidth="2.5" strokeLinecap="round" />
          {/* Flower on notebook cover */}
          <circle cx="25" cy="27" r="3" fill="#F4C542" />
        </svg>
      ),
    },
    {
      id: 'plus-sunshine',
      x: '24%',
      y: '48%',
      duration: 7.8,
      mobile: true,
      content: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="#FFF7E6" stroke="#6CA24A" strokeWidth="2.5" />
          <line x1="16" y1="8" x2="16" y2="24" stroke="#F28C38" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="8" y1="16" x2="24" y2="16" stroke="#F28C38" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'sparkle-blush',
      x: '74%',
      y: '44%',
      duration: 6.2,
      mobile: false,
      content: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path
            d="M 14 2 Q 14 14 2 14 Q 14 14 14 26 Q 14 14 26 14 Q 14 14 14 2 Z"
            fill="#F7B7C4"
            stroke="#2F4A1E"
            strokeWidth="1.8"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="hidden sm:block absolute inset-0 pointer-events-none overflow-hidden select-none z-10"
      aria-hidden="true"
    >
      {shapes.map((item) => (
        <motion.div
          key={item.id}
          className={`absolute ${item.mobile ? '' : 'hidden md:block'}`}
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [-10, 10, -10],
            rotate: [-4, 4, -4],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {item.content}
        </motion.div>
      ))}
    </div>
  );
}
