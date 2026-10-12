'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export function MathFloatingShapes() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return null;
  }

  const shapes = [
    {
      id: 'plus',
      x: '12%',
      y: '18%',
      duration: 7,
      content: (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <circle cx="17" cy="17" r="15" fill="#FAF8E8" stroke="#432623" strokeWidth="3" />
          <line x1="17" y1="9" x2="17" y2="25" stroke="#DE2A35" strokeWidth="4" strokeLinecap="round" />
          <line x1="9" y1="17" x2="25" y2="17" stroke="#DE2A35" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'star-1',
      x: '86%',
      y: '22%',
      duration: 8.5,
      content: (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <polygon
            points="15,2 18,10 26,11 20,17 22,25 15,20 8,25 10,17 4,11 12,10"
            fill="#DFA06E"
            stroke="#432623"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'divide',
      x: '82%',
      y: '68%',
      duration: 6.8,
      content: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="3" y="3" width="30" height="30" rx="8" fill="#F5F1BC" stroke="#432623" strokeWidth="3" />
          <line x1="10" y1="18" x2="26" y2="18" stroke="#432623" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="18" cy="11" r="2.5" fill="#DE2A35" />
          <circle cx="18" cy="25" r="2.5" fill="#DE2A35" />
        </svg>
      ),
    },
    {
      id: 'notebook-mini',
      x: '8%',
      y: '72%',
      duration: 9.2,
      content: (
        <svg width="38" height="42" viewBox="0 0 38 42" fill="none">
          <rect x="5" y="4" width="28" height="34" rx="4" fill="#8ABB93" stroke="#432623" strokeWidth="3" />
          <line x1="12" y1="12" x2="26" y2="12" stroke="#FAF8E8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="19" x2="26" y2="19" stroke="#FAF8E8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="26" x2="20" y2="26" stroke="#FAF8E8" strokeWidth="2.5" strokeLinecap="round" />
          {/* Spiral binding rings */}
          <circle cx="5" cy="10" r="2" fill="#432623" />
          <circle cx="5" cy="18" r="2" fill="#432623" />
          <circle cx="5" cy="26" r="2" fill="#432623" />
          <circle cx="5" cy="34" r="2" fill="#432623" />
        </svg>
      ),
    },
    {
      id: 'multiply',
      x: '24%',
      y: '48%',
      duration: 7.8,
      content: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <line x1="7" y1="7" x2="21" y2="21" stroke="#8ABB93" strokeWidth="4" strokeLinecap="round" />
          <line x1="21" y1="7" x2="7" y2="21" stroke="#8ABB93" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'sparkle',
      x: '74%',
      y: '44%',
      duration: 6.2,
      content: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M 12 2 Q 12 12 2 12 Q 12 12 12 22 Q 12 12 22 12 Q 12 12 12 2 Z"
            fill="#DE2A35"
            stroke="#432623"
            strokeWidth="2"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-15" aria-hidden="true">
      {shapes.map((s, index) => (
        <motion.div
          key={s.id}
          className="absolute opacity-80 hidden sm:block pointer-events-none select-none"
          style={{ left: s.x, top: s.y }}
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 0.8, scale: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.12 + index * 0.07,
            ease: 'easeOut',
          }}
        >
          {s.content}
        </motion.div>
      ))}
    </div>
  );
}
