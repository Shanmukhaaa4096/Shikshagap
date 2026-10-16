'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { useGappu, type GappuState } from '@/lib/hooks/useGappu';

export interface GappuProps {
  className?: string;
  width?: number;
  height?: number;
  state?: GappuState;
  showSpeechBubble?: boolean;
  speechText?: string;
  enableEyeTracking?: boolean;
  enableClickReactions?: boolean;
  showGiftBox?: boolean;
  draggable?: boolean;
  onGappuClick?: () => void;
}

export function Gappu({
  className = '',
  width = 460,
  height = 560,
  state: controlledState,
  showSpeechBubble: controlledShowBubble,
  speechText: controlledSpeechText,
  enableEyeTracking = true,
  enableClickReactions = true,
  showGiftBox = false,
  draggable = false,
  onGappuClick,
}: GappuProps) {
  const shouldReduceMotion = useReducedMotion();
  const contextGappu = useGappu();
  const activeState: GappuState = controlledState || contextGappu.state || 'idle';

  // Component refs
  const svgRef = useRef<SVGSVGElement | null>(null);
  const clickCountRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0);
  const rAFRef = useRef<number | null>(null);

  // Local interaction states
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [reactionIndex, setReactionIndex] = useState(0);
  const [isEasterEggSpinning, setIsEasterEggSpinning] = useState(false);
  const [petalsBurst, setPetalsBurst] = useState<Array<{ id: number; x: number; y: number; r: number; color: string }>>([]);
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(null);

  // Throttled Eye Tracking: clamped offset in SVG coordinates (-10 to 10)
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  // Time of Day check: Nightcap between 8PM (20:00) and 6AM (06:00)
  const isNightTime = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hour = new Date().getHours();
    return hour >= 20 || hour < 6;
  }, []);

  // -------------------------------------------------------------
  // 1. Random Natural Blinking (every 2.5 to 5.5s)
  // -------------------------------------------------------------
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    let cancelBlink: NodeJS.Timeout;

    const scheduleNextBlink = () => {
      const delay = 2500 + Math.random() * 3000;
      blinkTimeout = setTimeout(() => {
        if (activeState !== 'sleepy') {
          setIsBlinking(true);
          cancelBlink = setTimeout(() => {
            setIsBlinking(false);
            scheduleNextBlink();
          }, 180);
        } else {
          scheduleNextBlink();
        }
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(cancelBlink);
    };
  }, [activeState]);

  // -------------------------------------------------------------
  // 2. Throttled Eye Tracking (Cursor & Mobile Touch)
  // -------------------------------------------------------------
  const updatePupilPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current || !enableEyeTracking || shouldReduceMotion) return;

      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.36; // around eyes center

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);
      const maxDistance = 350;

      const normalizedDist = Math.min(distance / maxDistance, 1);
      const angle = Math.atan2(deltaY, deltaX);

      // Max eye travel distance in SVG coordinate space = 9px
      const maxEyeTravel = 9;
      const travelX = Math.cos(angle) * (normalizedDist * maxEyeTravel);
      const travelY = Math.sin(angle) * (normalizedDist * maxEyeTravel);

      setPupilOffset({ x: travelX, y: travelY });
    },
    [enableEyeTracking, shouldReduceMotion]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !enableEyeTracking) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (document.hidden || activeState === 'sleepy') return;

      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      rAFRef.current = requestAnimationFrame(() => {
        const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY;
        if (clientX !== undefined && clientY !== undefined) {
          updatePupilPosition(clientX, clientY);
        }
      });
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    };
  }, [enableEyeTracking, activeState, updatePupilPosition]);

  // -------------------------------------------------------------
  // 3. Click / Tap Reactions + Easter Egg (5 Quick Clicks = Spin)
  // -------------------------------------------------------------
  const handleClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onGappuClick?.();

    const now = Date.now();
    if (now - lastClickTimeRef.current < 600) {
      clickCountRef.current += 1;
    } else {
      clickCountRef.current = 1;
    }
    lastClickTimeRef.current = now;

    // Trigger Easter Egg on 5 fast clicks
    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      setIsEasterEggSpinning(true);
      triggerConfettiBurst(24);
      setSpeechBubbleText('Wheee! Learning is pure magic!');
      setTimeout(() => {
        setIsEasterEggSpinning(false);
        setSpeechBubbleText(null);
      }, 1600);
      return;
    }

    if (!enableClickReactions) return;

    // Pick from 4 random delightful reactions
    const nextReaction = (reactionIndex + 1) % 4;
    setReactionIndex(nextReaction);

    // Burst petals and sparkles
    triggerConfettiBurst(8);

    const speechGreetings = [
      'Hoo hoo! Ready for the next problem?',
      'You are doing wonderfully!',
      'Unwrapping the answer together!',
      'Hoo\'s smart? You are!',
    ];
    setSpeechBubbleText(speechGreetings[nextReaction]);
    setTimeout(() => {
      setSpeechBubbleText(null);
    }, 2200);

    contextGappu.triggerReaction();
  };

  const triggerConfettiBurst = (count: number) => {
    const burstColors = ['#6CA24A', '#F4C542', '#F28C38', '#F7B7C4', '#C7DDAE'];
    const newPetals = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 230 + (Math.random() - 0.5) * 220,
      y: 240 + (Math.random() - 0.5) * 160,
      r: 6 + Math.random() * 8,
      color: burstColors[i % burstColors.length],
    }));
    setPetalsBurst(newPetals);
    setTimeout(() => setPetalsBurst([]), 1200);
  };

  // -------------------------------------------------------------
  // 4. Motion Variants for Gappu States
  // -------------------------------------------------------------
  const isSleeping = activeState === 'sleepy';
  const isThinking = activeState === 'thinking';
  const isListening = activeState === 'listening';
  const isAnswering = activeState === 'answering';
  const isSuccess = activeState === 'success';
  const isError = activeState === 'error';

  // Overall container motion
  const containerMotion = shouldReduceMotion
    ? {}
    : isEasterEggSpinning
    ? { rotate: 360, scale: [1, 1.1, 1], y: [0, -25, 0] }
    : isSuccess
    ? { y: [0, -18, 0, -10, 0], scale: [1, 1.05, 1], rotate: [-2, 2, 0] }
    : isError
    ? { rotate: [-3, 3, -2, 0], y: [0, 4, 0] }
    : isThinking
    ? { y: [-2, -8, -2], rotate: [-1.5, 1.5, -1.5] }
    : isListening
    ? { y: -4, scale: 1.02 }
    : isSleeping
    ? { y: [0, 6, 0], scale: [1, 0.98, 1] }
    : isHovered
    ? { y: -6, scale: 1.02, rotate: 1.5 }
    : { y: [0, -5, 0], scale: [1, 1.01, 1] }; // Idle gentle breathing/bobbing

  // Wing flapping motion
  const leftWingMotion = shouldReduceMotion
    ? {}
    : isSuccess || isEasterEggSpinning
    ? { rotate: [-25, 20, -25], transition: { repeat: Infinity, duration: 0.35 } }
    : isAnswering
    ? { rotate: [-8, 6, -8], transition: { repeat: Infinity, duration: 0.6 } }
    : isHovered
    ? { rotate: -15, transition: { duration: 0.3 } }
    : {};

  const rightWingMotion = shouldReduceMotion
    ? {}
    : isSuccess || isEasterEggSpinning
    ? { rotate: [25, -20, 25], transition: { repeat: Infinity, duration: 0.35 } }
    : isHovered
    ? { rotate: [0, 18, -4, 14, 0], transition: { duration: 0.7 } } // cute wing wave
    : isThinking
    ? { rotate: -12, transition: { duration: 0.4 } }
    : {};

  // Ear tufts perk up during listening / thinking
  const earTuftAngle = isListening || isThinking ? 8 : isSleeping ? -6 : 0;

  // Speech bubble display
  const activeBubbleText =
    controlledSpeechText ||
    speechBubbleText ||
    (isHovered && !isSleeping ? "Hoo's there? Ready to learn!" : null);

  return (
    <motion.div
      className={`relative inline-block select-none ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${className}`}
      onClick={handleClick}
      onMouseEnter={() => {
        setIsHovered(true);
        if (isSleeping) contextGappu.wakeUp();
      }}
      onMouseLeave={() => setIsHovered(false)}
      drag={draggable && !shouldReduceMotion}
      dragConstraints={{ left: -50, right: 50, top: -40, bottom: 40 }}
      dragElastic={0.2}
      animate={containerMotion}
      transition={{
        duration: isEasterEggSpinning ? 0.9 : isSuccess ? 0.7 : isThinking ? 2.2 : isSleeping ? 3.5 : isHovered ? 0.3 : 3.8,
        repeat: isThinking || isSleeping || (!isHovered && !isSuccess && !isEasterEggSpinning) ? Infinity : 0,
        ease: 'easeInOut',
      }}
      role="img"
      aria-label="Gappu the owl - ShikshaGap diagnostic AI mascot"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* ----------------- SPEECH BUBBLE OVER HEAD ----------------- */}
      <AnimatePresence>
        {(controlledShowBubble || activeBubbleText) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none whitespace-nowrap"
          >
            <div className="relative px-4 py-2 rounded-full bg-[#FFFDF8] border-2 border-[#6CA24A] text-[#2F4A1E] font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5">
              <span>{controlledSpeechText || activeBubbleText}</span>
              {/* Cute flower pin on speech bubble tail */}
              <div
                className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#6CA24A]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------- FLOATING "Z"s FOR SLEEPY MODE ----------------- */}
      {isSleeping && !shouldReduceMotion && (
        <div className="absolute top-8 right-16 z-20 pointer-events-none" aria-hidden="true">
          {[0, 1, 2].map((idx) => (
            <motion.span
              key={idx}
              className="absolute font-heading font-black text-xl text-[#F28C38] select-none"
              initial={{ opacity: 0, y: 0, x: 0, scale: 0.6 }}
              animate={{
                opacity: [0, 0.9, 0],
                y: -45 - idx * 18,
                x: 18 + idx * 14,
                scale: [0.6, 1.2, 1.4],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: idx * 0.7,
                ease: 'easeOut',
              }}
            >
              z
            </motion.span>
          ))}
        </div>
      )}

      {/* ----------------- ORBITING SPARKLES FOR THINKING STATE ----------------- */}
      {isThinking && !shouldReduceMotion && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-48 h-20" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute"
              animate={{
                x: [Math.cos((i * 2 * Math.PI) / 3) * 60, Math.cos((i * 2 * Math.PI) / 3 + Math.PI) * 60, Math.cos((i * 2 * Math.PI) / 3 + 2 * Math.PI) * 60],
                y: [Math.sin((i * 2 * Math.PI) / 3) * 22, Math.sin((i * 2 * Math.PI) / 3 + Math.PI) * 22, Math.sin((i * 2 * Math.PI) / 3 + 2 * Math.PI) * 22],
                scale: [0.8, 1.3, 0.8],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#F4C542">
                <path d="M 12 2 C 12 8 8 12 2 12 C 8 12 12 16 12 22 C 12 16 16 12 22 12 C 16 12 12 8 12 2 Z" />
              </svg>
            </motion.div>
          ))}
        </div>
      )}

      {/* ----------------- SWEAT DROP FOR ERROR STATE ----------------- */}
      {isError && !shouldReduceMotion && (
        <motion.div
          className="absolute top-24 right-24 z-20 pointer-events-none"
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: [0, 8, 14], opacity: [0, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeIn' }}
          aria-hidden="true"
        >
          <svg width="22" height="28" viewBox="0 0 22 28" fill="#F7B7C4">
            <path
              d="M 11 2 C 11 2 2 14 2 19 C 2 24 6 27 11 27 C 16 27 20 24 20 19 C 20 14 11 2 11 2 Z"
              stroke="#2F4A1E"
              strokeWidth="2"
            />
          </svg>
        </motion.div>
      )}

      {/* ----------------- BURST PETALS ON CLICK / CELEBRATION ----------------- */}
      {petalsBurst.map((p) => (
        <motion.div
          key={p.id}
          className="absolute pointer-events-none z-30"
          style={{ left: p.x, top: p.y }}
          initial={{ opacity: 1, scale: 0.3, y: 0 }}
          animate={{
            opacity: 0,
            scale: 1.2,
            y: (Math.random() - 0.5) * 80 - 40,
            x: (Math.random() - 0.5) * 80,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          aria-hidden="true"
        >
          <svg width={p.r * 2} height={p.r * 2} viewBox="0 0 20 20" fill={p.color}>
            <circle cx="10" cy="6" r="3.5" />
            <circle cx="14" cy="9" r="3.5" />
            <circle cx="12" cy="14" r="3.5" />
            <circle cx="8" cy="14" r="3.5" />
            <circle cx="6" cy="9" r="3.5" />
            <circle cx="10" cy="10" r="2.5" fill="#F28C38" />
          </svg>
        </motion.div>
      ))}

      {/* ============================================================== */}
      {/* MAIN LAYERED GAPPU SVG CANVAS (460 x 560)                      */}
      {/* ============================================================== */}
      <svg
        ref={svgRef}
        viewBox="0 0 460 560"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-h-full drop-shadow-sm transition-transform"
        aria-hidden="true"
      >
        {/* Soft Warm Ground Shadow */}
        <ellipse cx="230" cy="535" rx="140" ry="16" fill="#2F4A1E" fillOpacity="0.09" />

        {/* ----------------- STACK OF 3 MATH BOOKS ----------------- */}
        {/* Book 3 (Bottom - Sage Green) */}
        <g id="gappu-book-bottom">
          <rect x="100" y="475" width="260" height="42" rx="12" fill="#C7DDAE" stroke="#2F4A1E" strokeWidth="4.5" />
          <rect x="120" y="485" width="230" height="22" rx="6" fill="#FFF7E6" stroke="#2F4A1E" strokeWidth="2.5" />
          {/* Page lines */}
          <line x1="140" y1="492" x2="330" y2="492" stroke="#2F4A1E" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="140" y1="500" x2="310" y2="500" stroke="#2F4A1E" strokeWidth="2.2" strokeLinecap="round" />
          {/* Spine ribs */}
          <line x1="112" y1="478" x2="112" y2="514" stroke="#2F4A1E" strokeWidth="3" />
        </g>

        {/* Book 2 (Middle - Sunshine Yellow) */}
        <g id="gappu-book-middle">
          <rect x="115" y="435" width="230" height="42" rx="12" fill="#F4C542" stroke="#2F4A1E" strokeWidth="4.5" />
          <rect x="135" y="445" width="200" height="22" rx="6" fill="#FFF7E6" stroke="#2F4A1E" strokeWidth="2.5" />
          <line x1="150" y1="452" x2="315" y2="452" stroke="#2F4A1E" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="150" y1="460" x2="295" y2="460" stroke="#2F4A1E" strokeWidth="2.2" strokeLinecap="round" />
          {/* Marigold Ribbon Bookmark hanging down */}
          <path d="M 285 465 L 285 505 L 293 497 L 301 505 L 301 465 Z" fill="#F28C38" stroke="#2F4A1E" strokeWidth="2.5" />
        </g>

        {/* Book 1 (Top - Leaf Green) */}
        <g id="gappu-book-top">
          <rect x="130" y="395" width="200" height="42" rx="12" fill="#6CA24A" stroke="#2F4A1E" strokeWidth="4.5" />
          <rect x="145" y="405" width="175" height="22" rx="6" fill="#FFF7E6" stroke="#2F4A1E" strokeWidth="2.5" />
          <line x1="160" y1="412" x2="305" y2="412" stroke="#2F4A1E" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="160" y1="420" x2="280" y2="420" stroke="#2F4A1E" strokeWidth="2.2" strokeLinecap="round" />
          {/* Cover emblem: golden flower / gift star */}
          <circle cx="145" cy="416" r="6" fill="#F4C542" stroke="#2F4A1E" strokeWidth="2" />
        </g>

        {/* ----------------- MASCOT FEET / TALONS ----------------- */}
        <g id="gappu-feet">
          {/* Left foot */}
          <rect x="180" y="380" width="12" height="20" rx="6" fill="#F4C542" stroke="#2F4A1E" strokeWidth="3.5" />
          <rect x="194" y="380" width="12" height="20" rx="6" fill="#F4C542" stroke="#2F4A1E" strokeWidth="3.5" />
          <rect x="208" y="380" width="12" height="20" rx="6" fill="#F4C542" stroke="#2F4A1E" strokeWidth="3.5" />

          {/* Right foot */}
          <rect x="240" y="380" width="12" height="20" rx="6" fill="#F4C542" stroke="#2F4A1E" strokeWidth="3.5" />
          <rect x="254" y="380" width="12" height="20" rx="6" fill="#F4C542" stroke="#2F4A1E" strokeWidth="3.5" />
          <rect x="268" y="380" width="12" height="20" rx="6" fill="#F4C542" stroke="#2F4A1E" strokeWidth="3.5" />
        </g>

        {/* ----------------- TAIL FEATHERS (BEHIND BODY) ----------------- */}
        <g id="gappu-tail-feathers">
          <path d="M 205 385 L 210 415 L 220 388 Z" fill="#6CA24A" stroke="#2F4A1E" strokeWidth="3" />
          <path d="M 222 388 L 230 422 L 238 388 Z" fill="#6CA24A" stroke="#2F4A1E" strokeWidth="3" />
          <path d="M 240 388 L 250 415 L 255 385 Z" fill="#6CA24A" stroke="#2F4A1E" strokeWidth="3" />
        </g>

        {/* ----------------- MAIN BODY & HEAD ----------------- */}
        {/* Main Egg-shaped Friendly Torso in Leaf Green */}
        <g id="gappu-body">
          <path
            d="M 140 250 C 140 160, 320 160, 320 250 C 320 350, 310 395, 230 395 C 150 395, 140 350, 140 250 Z"
            fill="#6CA24A"
            stroke="#2F4A1E"
            strokeWidth="5.5"
          />
        </g>

        {/* Ear tufts (Sunshine Yellow tipped with Leaf Green) */}
        <g id="gappu-ear-left" style={{ transformOrigin: '160px 160px', transform: `rotate(${-earTuftAngle}deg)` }}>
          <path d="M 152 178 L 132 118 L 195 152 Z" fill="#F4C542" stroke="#2F4A1E" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M 146 160 L 132 118 L 168 142 Z" fill="#6CA24A" stroke="#2F4A1E" strokeWidth="3" strokeLinejoin="round" />
        </g>
        <g id="gappu-ear-right" style={{ transformOrigin: '300px 160px', transform: `rotate(${earTuftAngle}deg)` }}>
          <path d="M 308 178 L 328 118 L 265 152 Z" fill="#F4C542" stroke="#2F4A1E" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M 314 160 L 328 118 L 292 142 Z" fill="#6CA24A" stroke="#2F4A1E" strokeWidth="3" strokeLinejoin="round" />
        </g>

        {/* Warm Cream Belly / Vest */}
        <g id="gappu-belly">
          <path
            d="M 175 255 C 175 220, 285 220, 285 255 C 285 345, 275 385, 230 385 C 185 385, 175 345, 175 255 Z"
            fill="#FFF7E6"
            stroke="#2F4A1E"
            strokeWidth="4"
          />

          {/* Delicate cute chest feather crescents */}
          <path d="M 215 270 Q 230 282 245 270" stroke="#2F4A1E" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M 200 295 Q 215 307 230 295" stroke="#2F4A1E" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M 230 295 Q 245 307 260 295" stroke="#2F4A1E" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M 215 320 Q 230 332 245 320" stroke="#2F4A1E" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M 200 345 Q 215 357 230 345" stroke="#2F4A1E" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M 230 345 Q 245 357 260 345" stroke="#2F4A1E" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        </g>

        {/* Soft Blush Cheeks */}
        <g id="gappu-cheeks">
          <ellipse cx="160" cy="225" rx="15" ry="9" fill="#F7B7C4" fillOpacity="0.85" />
          <ellipse cx="300" cy="225" rx="15" ry="9" fill="#F7B7C4" fillOpacity="0.85" />
        </g>

        {/* Marigold Bowtie with round center */}
        <g id="gappu-bowtie">
          <polygon points="214,240 230,246 214,252" fill="#F28C38" stroke="#2F4A1E" strokeWidth="2.5" />
          <polygon points="246,240 230,246 246,252" fill="#F28C38" stroke="#2F4A1E" strokeWidth="2.5" />
          <circle cx="230" cy="246" r="4.5" fill="#F4C542" stroke="#2F4A1E" strokeWidth="2.5" />
        </g>

        {/* ----------------- EYES, SPECTACLES & TRACKING PUPILS ----------------- */}
        <g id="gappu-eyes-group">
          {/* Left Eye White */}
          <circle cx="190" cy="200" r="34" fill="#FFFDF8" stroke="#2F4A1E" strokeWidth="4.5" />
          {/* Right Eye White */}
          <circle cx="270" cy="200" r="34" fill="#FFFDF8" stroke="#2F4A1E" strokeWidth="4.5" />

          {/* Dynamic Eyeball / Pupils */}
          {isSleeping ? (
            /* Sleepy closed happy crescent eyes */
            <>
              <path d="M 172 205 Q 190 218 208 205" stroke="#2F4A1E" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M 252 205 Q 270 218 288 205" stroke="#2F4A1E" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            </>
          ) : isBlinking ? (
            /* Gentle wink / blink lines */
            <>
              <path d="M 174 200 Q 190 212 206 200" stroke="#2F4A1E" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M 254 200 Q 270 212 286 200" stroke="#2F4A1E" strokeWidth="5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            /* Open lively pupils tracking cursor */
            <>
              {/* Left Pupil */}
              <g
                id="gappu-pupil-left"
                style={{
                  transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
                  transition: 'transform 0.08s ease-out',
                }}
              >
                <circle cx="194" cy="202" r="14" fill="#2F4A1E" />
                <circle cx="198" cy="197" r="4.8" fill="#FFFDF8" />
                <circle cx="191" cy="207" r="2.2" fill="#F4C542" />
              </g>

              {/* Right Pupil */}
              <g
                id="gappu-pupil-right"
                style={{
                  transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
                  transition: 'transform 0.08s ease-out',
                }}
              >
                <circle cx="266" cy="202" r="14" fill="#2F4A1E" />
                <circle cx="270" cy="197" r="4.8" fill="#FFFDF8" />
                <circle cx="263" cy="207" r="2.2" fill="#F4C542" />
              </g>
            </>
          )}

          {/* Spectacles Frame (Deep Brown with bridge) */}
          <circle cx="190" cy="200" r="38" fill="none" stroke="#2F4A1E" strokeWidth="4.5" />
          <circle cx="270" cy="200" r="38" fill="none" stroke="#2F4A1E" strokeWidth="4.5" />
          <path d="M 228 200 Q 230 192 232 200" stroke="#2F4A1E" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </g>

        {/* ----------------- BEAK (UPPER AND LOWER) ----------------- */}
        <g id="gappu-beak-upper">
          <polygon points="230,210 240,224 220,224" fill="#F4C542" stroke="#2F4A1E" strokeWidth="3.5" strokeLinejoin="round" />
        </g>
        <motion.g
          id="gappu-beak-lower"
          animate={
            isAnswering && !shouldReduceMotion
              ? { y: [0, 6, 0] }
              : {}
          }
          transition={{ duration: 0.28, repeat: Infinity }}
        >
          <polygon points="230,228 238,222 222,222" fill="#F28C38" stroke="#2F4A1E" strokeWidth="3" strokeLinejoin="round" />
        </motion.g>

        {/* ----------------- HAT: NIGHTCAP OR SCHOLAR CAP ----------------- */}
        {isNightTime || isSleeping ? (
          /* Cozy Nightcap with Pom-pom for Night & Sleep */
          <g id="gappu-nightcap">
            <path
              d="M 180 148 Q 230 115 280 148 Q 295 105 250 80 Q 220 70 200 95 Z"
              fill="#F7B7C4"
              stroke="#2F4A1E"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Nightcap white trim */}
            <rect x="175" y="142" width="110" height="14" rx="7" fill="#FFF7E6" stroke="#2F4A1E" strokeWidth="3" />
            {/* Fluffy Pom-pom */}
            <circle cx="196" cy="95" r="10" fill="#F4C542" stroke="#2F4A1E" strokeWidth="3" />
          </g>
        ) : (
          /* Classic Graduation Scholar Cap with Marigold Tassel */
          <g id="gappu-scholar-cap">
            <ellipse cx="230" cy="142" rx="38" ry="12" fill="#1C2D14" stroke="#2F4A1E" strokeWidth="4" />
            <polygon points="230,95 315,122 230,146 145,122" fill="#2F4A1E" stroke="#2F4A1E" strokeWidth="4" strokeLinejoin="round" />
            {/* Button on top */}
            <circle cx="230" cy="120" r="5" fill="#F4C542" stroke="#2F4A1E" strokeWidth="2" />
            {/* Marigold Tassel dangling */}
            <path d="M 230 120 Q 275 130 290 155" stroke="#F28C38" strokeWidth="3.5" fill="none" />
            <rect x="286" y="155" width="8" height="14" rx="2" fill="#F28C38" stroke="#2F4A1E" strokeWidth="2" />
          </g>
        )}

        {/* ----------------- LEFT WING (HOLDING PENCIL) ----------------- */}
        <motion.g
          id="gappu-wing-left"
          style={{ transformOrigin: '145px 240px' }}
          animate={leftWingMotion}
        >
          {/* Wing fold */}
          <path
            d="M 145 240 C 115 270, 110 335, 150 350 C 160 354, 175 330, 168 285 Z"
            fill="#6CA24A"
            stroke="#2F4A1E"
            strokeWidth="4.5"
          />
          {/* Cute yellow wooden pencil held under wing */}
          <g transform="rotate(-35 125 330)">
            <rect x="90" y="270" width="22" height="90" rx="3" fill="#FFF7E6" stroke="#2F4A1E" strokeWidth="3.2" />
            <rect x="90" y="295" width="22" height="14" fill="#F28C38" stroke="#2F4A1E" strokeWidth="2" />
            <rect x="90" y="360" width="22" height="10" fill="#C7DDAE" stroke="#2F4A1E" strokeWidth="2" />
            <rect x="90" y="370" width="22" height="12" rx="4" fill="#F7B7C4" stroke="#2F4A1E" strokeWidth="2.5" />
            <polygon points="90,270 112,270 101,240" fill="#F4C542" stroke="#2F4A1E" strokeWidth="3" strokeLinejoin="round" />
            <polygon points="97,250 105,250 101,240" fill="#2F4A1E" />
          </g>
        </motion.g>

        {/* ----------------- RIGHT WING (HOLDING MAGNIFIER OR GIFT BOX) ----------------- */}
        <motion.g
          id="gappu-wing-right"
          style={{ transformOrigin: '315px 240px' }}
          animate={rightWingMotion}
        >
          {/* Wing fold */}
          <path
            d="M 315 240 C 345 270, 350 335, 310 350 C 300 354, 285 330, 292 285 Z"
            fill="#6CA24A"
            stroke="#2F4A1E"
            strokeWidth="4.5"
          />

          {showGiftBox || isThinking ? (
            /* Tiny Illustrated Gift Box with Bow Ribbon */
            <g transform="translate(325, 260) scale(1.6)">
              <rect x="0" y="6" width="26" height="20" rx="4" fill="#6CA24A" stroke="#2F4A1E" strokeWidth="2.2" />
              <rect x="-2" y="3" width="30" height="6" rx="3" fill="#6CA24A" stroke="#2F4A1E" strokeWidth="2.2" />
              <rect x="10" y="3" width="6" height="23" fill="#F4C542" />
              {/* Bow */}
              <ellipse cx="8" cy="1.5" rx="3.5" ry="2" fill="#F4C542" stroke="#2F4A1E" strokeWidth="1.5" transform="rotate(-20 8 1.5)" />
              <ellipse cx="18" cy="1.5" rx="3.5" ry="2" fill="#F4C542" stroke="#2F4A1E" strokeWidth="1.5" transform="rotate(20 18 1.5)" />
              <circle cx="13" cy="2" r="2" fill="#F28C38" />
            </g>
          ) : (
            /* Magnifying Glass held outwards */
            <g transform="rotate(18 360 280)">
              {/* Wooden Handle */}
              <rect x="352" y="300" width="16" height="65" rx="4" fill="#F4C542" stroke="#2F4A1E" strokeWidth="3.2" />
              <line x1="360" y1="310" x2="360" y2="355" stroke="#2F4A1E" strokeWidth="2.2" />
              {/* Glass Rim in Marigold */}
              <circle cx="360" cy="270" r="36" fill="#FFF7E6" stroke="#F28C38" strokeWidth="6.5" />
              <circle cx="360" cy="270" r="36" fill="none" stroke="#2F4A1E" strokeWidth="3.5" />
              {/* Lens Reflection */}
              <path
                d="M 338 258 C 345 245, 368 245, 380 254"
                stroke="#C7DDAE"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Little Math Plus symbol revealed through lens */}
              <line x1="360" y1="262" x2="360" y2="278" stroke="#2F4A1E" strokeWidth="3.2" strokeLinecap="round" />
              <line x1="352" y1="270" x2="368" y2="270" stroke="#2F4A1E" strokeWidth="3.2" strokeLinecap="round" />
            </g>
          )}
        </motion.g>
      </svg>
    </motion.div>
  );
}
