'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface BlinkingDotsProps {
  color?: string;
  activeColor?: string;
  size?: number;
  count?: number;
  className?: string;
}

export function BlinkingDots({
  color,
  activeColor = '#DE2A35',
  size = 6,
  count = 3,
  className = '',
}: BlinkingDotsProps) {
  const effectiveColor = color || activeColor;
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            style={{
              width: size,
              height: size,
              backgroundColor: effectiveColor,
              borderRadius: '50%',
              display: 'inline-block',
              opacity: i === 0 ? 1 : 0.4,
            }}
          />
        ))}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          animate={{
            opacity: [0.35, 1, 0.35],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
          style={{
            width: size,
            height: size,
            backgroundColor: effectiveColor,
            borderRadius: '50%',
            display: 'inline-block',
          }}
        />
      ))}
    </span>
  );
}
