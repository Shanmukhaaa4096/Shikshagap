'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface MascotHeroProps {
  className?: string;
  width?: number;
  height?: number;
}

export function MascotHero({
  className = '',
  width = 460,
  height = 560,
}: MascotHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isWinking, setIsWinking] = useState(false);

  const handleInteraction = () => {
    setIsWinking(true);
    setTimeout(() => setIsWinking(false), 600);
  };

  return (
    <motion.div
      className={`relative inline-block cursor-pointer select-none ${className}`}
      onClick={handleInteraction}
      onMouseEnter={handleInteraction}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.015, y: -2 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      title="Click or hover Gappu the Diagnostic Owl!"
    >
      <svg
        viewBox="0 0 460 560"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-h-full drop-shadow-md"
        role="img"
        aria-label="Illustration of ShikshaGap owl mascot with books, pencil, and magnifying glass"
      >
        {/* Soft Ground Shadow */}
        <ellipse cx="230" cy="535" rx="140" ry="16" fill="#432623" fillOpacity="0.12" />

        {/* ----------------- STACK OF 3 MATH BOOKS ----------------- */}
        {/* Book 3 (Bottom - Sage Green) */}
        <g id="book-bottom">
          <rect x="100" y="475" width="260" height="42" rx="6" fill="#8ABB93" stroke="#432623" strokeWidth="5" />
          <rect x="120" y="485" width="230" height="22" rx="3" fill="#FAF8E8" stroke="#432623" strokeWidth="3" />
          {/* Page lines */}
          <line x1="140" y1="492" x2="330" y2="492" stroke="#432623" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="140" y1="500" x2="310" y2="500" stroke="#432623" strokeWidth="2.5" strokeLinecap="round" />
          {/* Spine ribs */}
          <line x1="112" y1="478" x2="112" y2="514" stroke="#432623" strokeWidth="3" />
        </g>

        {/* Book 2 (Middle - Tan Orange / Clay) */}
        <g id="book-middle">
          <rect x="115" y="435" width="230" height="42" rx="6" fill="#DFA06E" stroke="#432623" strokeWidth="5" />
          <rect x="135" y="445" width="200" height="22" rx="3" fill="#FAF8E8" stroke="#432623" strokeWidth="3" />
          <line x1="150" y1="452" x2="315" y2="452" stroke="#432623" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="150" y1="460" x2="295" y2="460" stroke="#432623" strokeWidth="2.5" strokeLinecap="round" />
          {/* Ribbon bookmark hanging down */}
          <path d="M 285 465 L 285 505 L 293 497 L 301 505 L 301 465 Z" fill="#DE2A35" stroke="#432623" strokeWidth="2.5" />
        </g>

        {/* Book 1 (Top - Editorial Red) */}
        <g id="book-top">
          <rect x="130" y="395" width="200" height="42" rx="6" fill="#DE2A35" stroke="#432623" strokeWidth="5" />
          <rect x="145" y="405" width="175" height="22" rx="3" fill="#FAF8E8" stroke="#432623" strokeWidth="3" />
          <line x1="160" y1="412" x2="305" y2="412" stroke="#432623" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="160" y1="420" x2="280" y2="420" stroke="#432623" strokeWidth="2.5" strokeLinecap="round" />
          {/* Cover emblem: golden divide / plus mark */}
          <circle cx="145" cy="416" r="6" fill="#DFA06E" stroke="#432623" strokeWidth="2" />
        </g>

        {/* ----------------- MASCOT FEET / TALONS ----------------- */}
        <g id="owl-feet">
          {/* Left foot */}
          <rect x="180" y="380" width="12" height="20" rx="6" fill="#DFA06E" stroke="#432623" strokeWidth="4" />
          <rect x="194" y="380" width="12" height="20" rx="6" fill="#DFA06E" stroke="#432623" strokeWidth="4" />
          <rect x="208" y="380" width="12" height="20" rx="6" fill="#DFA06E" stroke="#432623" strokeWidth="4" />

          {/* Right foot */}
          <rect x="240" y="380" width="12" height="20" rx="6" fill="#DFA06E" stroke="#432623" strokeWidth="4" />
          <rect x="254" y="380" width="12" height="20" rx="6" fill="#DFA06E" stroke="#432623" strokeWidth="4" />
          <rect x="268" y="380" width="12" height="20" rx="6" fill="#DFA06E" stroke="#432623" strokeWidth="4" />
        </g>

        {/* ----------------- OWL BODY ----------------- */}
        {/* Main Body (Egg-shaped friendly torso) */}
        <path
          d="M 140 250 C 140 160, 320 160, 320 250 C 320 350, 310 395, 230 395 C 150 395, 140 350, 140 250 Z"
          fill="#FAF8E8"
          stroke="#432623"
          strokeWidth="6"
        />

        {/* Ear tufts */}
        <path d="M 152 178 L 132 118 L 195 152 Z" fill="#DFA06E" stroke="#432623" strokeWidth="5" strokeLinejoin="round" />
        <path d="M 308 178 L 328 118 L 265 152 Z" fill="#DFA06E" stroke="#432623" strokeWidth="5" strokeLinejoin="round" />

        {/* Sage Green Belly / Vest */}
        <path
          d="M 175 255 C 175 220, 285 220, 285 255 C 285 345, 275 385, 230 385 C 185 385, 175 345, 175 255 Z"
          fill="#8ABB93"
          stroke="#432623"
          strokeWidth="4"
        />

        {/* Belly feather marks (delicate cute crescents) */}
        <path d="M 215 270 Q 230 282 245 270" stroke="#432623" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 200 295 Q 215 307 230 295" stroke="#432623" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 230 295 Q 245 307 260 295" stroke="#432623" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 215 320 Q 230 332 245 320" stroke="#432623" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 200 345 Q 215 357 230 345" stroke="#432623" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 230 345 Q 245 357 260 345" stroke="#432623" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Small Red Bowtie */}
        <g id="bowtie">
          <polygon points="214,240 230,246 214,252" fill="#DE2A35" stroke="#432623" strokeWidth="2.5" />
          <polygon points="246,240 230,246 246,252" fill="#DE2A35" stroke="#432623" strokeWidth="2.5" />
          <circle cx="230" cy="246" r="4.5" fill="#DE2A35" stroke="#432623" strokeWidth="2.5" />
        </g>

        {/* ----------------- EYES & GLASSES ----------------- */}
        {/* Left eye circle */}
        <circle cx="190" cy="200" r="34" fill="#FAF8E8" stroke="#432623" strokeWidth="5" />
        {/* Right eye circle */}
        <circle cx="270" cy="200" r="34" fill="#FAF8E8" stroke="#432623" strokeWidth="5" />

        {/* Spectacles Frame (Dark Brown with bridge) */}
        <circle cx="190" cy="200" r="38" fill="none" stroke="#432623" strokeWidth="4.5" />
        <circle cx="270" cy="200" r="38" fill="none" stroke="#432623" strokeWidth="4.5" />
        <path d="M 228 200 Q 230 193 232 200" stroke="#432623" strokeWidth="4.5" strokeLinecap="round" fill="none" />

        {/* Left Pupil */}
        <circle cx="194" cy="202" r="14" fill="#432623" />
        <circle cx="198" cy="197" r="4.5" fill="#FAF8E8" />

        {/* Right Pupil (Blinks when clicked / hovered) */}
        {isWinking ? (
          <path d="M 258 202 Q 270 214 282 202" stroke="#432623" strokeWidth="5" strokeLinecap="round" fill="none" />
        ) : (
          <>
            <circle cx="266" cy="202" r="14" fill="#432623" />
            <circle cx="270" cy="197" r="4.5" fill="#FAF8E8" />
          </>
        )}

        {/* Orange Beak */}
        <polygon points="230,210 240,228 220,228" fill="#DFA06E" stroke="#432623" strokeWidth="4" strokeLinejoin="round" />

        {/* ----------------- SCHOLAR CAP (Graduation Hat) ----------------- */}
        <g id="scholar-cap">
          <ellipse cx="230" cy="142" rx="38" ry="12" fill="#311E1B" stroke="#432623" strokeWidth="4" />
          <polygon points="230,95 315,122 230,146 145,122" fill="#432623" stroke="#432623" strokeWidth="4" strokeLinejoin="round" />
          {/* Button on top */}
          <circle cx="230" cy="120" r="5" fill="#DFA06E" stroke="#432623" strokeWidth="2" />
          {/* Red Tassel dangling */}
          <path d="M 230 120 Q 275 130 290 155" stroke="#DE2A35" strokeWidth="3.5" fill="none" />
          <rect x="286" y="155" width="8" height="14" rx="2" fill="#DE2A35" stroke="#432623" strokeWidth="2" />
        </g>

        {/* ----------------- LEFT WING HOLDING A PENCIL ----------------- */}
        <g id="left-wing-pencil">
          {/* Wing fold */}
          <path
            d="M 145 240 C 115 270, 110 335, 150 350 C 160 354, 175 330, 168 285 Z"
            fill="#DFA06E"
            stroke="#432623"
            strokeWidth="5"
          />
          {/* Big yellow/tan wooden pencil held under wing */}
          <g transform="rotate(-35 125 330)">
            {/* Pencil body */}
            <rect x="90" y="270" width="22" height="90" rx="3" fill="#F5F1BC" stroke="#432623" strokeWidth="3.5" />
            {/* Red stripes */}
            <rect x="90" y="295" width="22" height="14" fill="#DE2A35" stroke="#432623" strokeWidth="2" />
            {/* Metal ferrule and pink eraser */}
            <rect x="90" y="360" width="22" height="10" fill="#8ABB93" stroke="#432623" strokeWidth="2" />
            <rect x="90" y="370" width="22" height="12" rx="4" fill="#DFA06E" stroke="#432623" strokeWidth="2.5" />
            {/* Sharpened wood tip and graphite */}
            <polygon points="90,270 112,270 101,240" fill="#DFA06E" stroke="#432623" strokeWidth="3" strokeLinejoin="round" />
            <polygon points="97,250 105,250 101,240" fill="#432623" />
          </g>
        </g>

        {/* ----------------- RIGHT WING HOLDING MAGNIFYING GLASS ----------------- */}
        <g id="right-wing-magnifier">
          {/* Wing fold */}
          <path
            d="M 315 240 C 345 270, 350 335, 310 350 C 300 354, 285 330, 292 285 Z"
            fill="#DFA06E"
            stroke="#432623"
            strokeWidth="5"
          />

          {/* Magnifying Glass held outwards */}
          <g transform="rotate(18 360 280)">
            {/* Wooden Handle */}
            <rect x="352" y="300" width="16" height="65" rx="4" fill="#DFA06E" stroke="#432623" strokeWidth="3.5" />
            <line x1="360" y1="310" x2="360" y2="355" stroke="#432623" strokeWidth="2.5" />
            {/* Glass Rim in Red */}
            <circle cx="360" cy="270" r="36" fill="#FAF8E8" stroke="#DE2A35" strokeWidth="7" />
            <circle cx="360" cy="270" r="36" fill="none" stroke="#432623" strokeWidth="4" />
            {/* Glass Lens reflection */}
            <path
              d="M 338 258 C 345 245, 368 245, 380 254"
              stroke="#8ABB93"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Little Math Plus Symbol revealed through lens */}
            <line x1="360" y1="262" x2="360" y2="278" stroke="#432623" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="352" y1="270" x2="368" y2="270" stroke="#432623" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    </motion.div>
  );
}
