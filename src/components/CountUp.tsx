'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

interface CountUpProps {
  end: number;
  duration?: number;
  padZero?: boolean;
  className?: string;
}

export function CountUp({
  end,
  duration = 0.6,
  padZero = false,
  className = '',
}: CountUpProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const element = ref.current;
    if (!element) return;

    let animationFrameId: number;
    let startTime: number | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();

          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const val = Math.round(eased * end);
            const formatted = padZero && val < 10 ? `0${val}` : `${val}`;
            if (element) {
              element.textContent = formatted;
            }

            if (progress < 1) {
              animationFrameId = requestAnimationFrame(animate);
            }
          };

          // Start progressive count-up from 0
          element.textContent = padZero && 0 < 10 ? '00' : '0';
          animationFrameId = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration, padZero, shouldReduceMotion]);

  const initialVal = padZero && end < 10 ? `0${end}` : `${end}`;

  return (
    <span ref={ref} className={className}>
      {initialVal}
    </span>
  );
}
