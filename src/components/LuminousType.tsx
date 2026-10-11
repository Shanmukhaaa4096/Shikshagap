'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface LuminousTypeProps {
  text: string;
  className?: string;
  italicIndices?: number[];
  italicClass?: string;
  delay?: number;
}

export function LuminousType({
  text,
  className = '',
  italicIndices = [],
  italicClass = 'italic font-normal font-serif',
  delay = 0,
}: LuminousTypeProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(' ');

  if (shouldReduceMotion) {
    return (
      <span className={className}>
        {words.map((word, i) => {
          const isItalic = italicIndices.includes(i);
          return (
            <React.Fragment key={i}>
              <span className={isItalic ? italicClass : undefined}>{word}</span>
              {i < words.length - 1 ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </span>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: delay,
      },
    },
  };

  const childVariants = {
    hidden: {
      opacity: 0,
      y: 18,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.span
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'inline' }}
    >
      {words.map((word, i) => {
        const isItalic = italicIndices.includes(i);
        return (
          <React.Fragment key={i}>
            <motion.span
              variants={childVariants}
              className={`inline-block ${isItalic ? italicClass : ''}`}
            >
              {word}
            </motion.span>
            {i < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </motion.span>
  );
}
