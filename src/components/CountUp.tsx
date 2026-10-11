'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

interface CountUpProps {
  end: number;
  duration?: number;
  padZero?: boolean;
  className?: string;
}

export function CountUp({
  end,
  duration = 1.2,
  padZero = false,
  className = '',
}: CountUpProps) {
  const shouldReduceMotion = useReducedMotion();
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (!hasStarted || shouldReduceMotion) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasStarted, end, duration, shouldReduceMotion]);

  const currentVal = shouldReduceMotion ? end : count;
  const formatted = padZero && currentVal < 10 ? `0${currentVal}` : `${currentVal}`;

  return (
    <span ref={ref} className={className}>
      {formatted}
    </span>
  );
}
