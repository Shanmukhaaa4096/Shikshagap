'use client';

import React from 'react';

export function ProblemIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full max-w-[240px] h-auto drop-shadow-xs ${className}`}
      role="img"
      aria-label="Illustration representing confused test marks and missing prerequisites"
    >
      {/* Slate Frame */}
      <rect x="20" y="20" width="240" height="155" rx="8" fill="#C6C7C4" stroke="#36151E" strokeWidth="5" />
      {/* Slate Dark Chalkboard */}
      <rect x="35" y="35" width="210" height="125" rx="4" fill="#250D15" stroke="#36151E" strokeWidth="3" />

      {/* Tangled 42% Mark in Red with broken circle */}
      <circle cx="95" cy="95" r="42" stroke="#F56276" strokeWidth="6" strokeDasharray="16 8" fill="none" />
      <text x="95" y="108" textAnchor="middle" fill="#F56276" fontFamily="var(--font-serif), serif" fontSize="36" fontWeight="bold">
        42%
      </text>

      {/* Tangled problem: 52 - 27 = 35 with a big question mark */}
      <g transform="translate(155, 55)">
        <rect x="0" y="0" width="80" height="32" rx="4" fill="#EEF0F2" stroke="#36151E" strokeWidth="3" />
        <text x="40" y="22" textAnchor="middle" fill="#36151E" fontFamily="ui-monospace, monospace" fontSize="13" fontWeight="bold">
          52 - 27
        </text>
      </g>

      <g transform="translate(155, 98)">
        <rect x="0" y="0" width="80" height="32" rx="4" fill="#EEF0F2" stroke="#F56276" strokeWidth="3" />
        <text x="40" y="22" textAnchor="middle" fill="#F56276" fontFamily="ui-monospace, monospace" fontSize="13" fontWeight="bold">
          = 35 (?)
        </text>
      </g>

      {/* Broken Chalk Pieces */}
      <rect x="80" y="172" width="22" height="8" rx="2" fill="#EEF0F2" stroke="#36151E" strokeWidth="2.5" />
      <rect x="110" y="172" width="14" height="8" rx="2" fill="#EEF0F2" stroke="#36151E" strokeWidth="2.5" />
      {/* Wooden Duster / Eraser */}
      <rect x="175" y="168" width="45" height="14" rx="3" fill="#A2999E" stroke="#36151E" strokeWidth="3" />
    </svg>
  );
}

export function SolutionIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full max-w-[240px] h-auto drop-shadow-xs ${className}`}
      role="img"
      aria-label="Illustration of concept graph diagnostics and 5-day action plan"
    >
      {/* Notebook Paper Sheet */}
      <rect x="25" y="18" width="230" height="160" rx="6" fill="#EEF0F2" stroke="#36151E" strokeWidth="5" />
      
      {/* Blue / Green header band on paper */}
      <rect x="25" y="18" width="230" height="28" rx="6" fill="#A2999E" stroke="#36151E" strokeWidth="3" />
      <circle cx="45" cy="32" r="5" fill="#EEF0F2" stroke="#36151E" strokeWidth="2" />
      <circle cx="62" cy="32" r="5" fill="#EEF0F2" stroke="#36151E" strokeWidth="2" />
      <circle cx="79" cy="32" r="5" fill="#EEF0F2" stroke="#36151E" strokeWidth="2" />

      {/* Illuminated Lightbulb (Glowing in Tan & Red) */}
      <g transform="translate(195, 60)">
        <path
          d="M 22 2 C 10 2 2 10 2 22 C 2 30 8 36 12 42 L 12 48 L 32 48 L 32 42 C 36 36 42 30 42 22 C 42 10 34 2 22 2 Z"
          fill="#C6C7C4"
          stroke="#36151E"
          strokeWidth="3.5"
        />
        {/* Filament */}
        <path d="M 16 26 Q 22 18 28 26" stroke="#F56276" strokeWidth="2.5" fill="none" />
        {/* Base screw */}
        <rect x="15" y="48" width="14" height="6" fill="#A2999E" stroke="#36151E" strokeWidth="2" />
        {/* Glow rays */}
        <line x1="22" y1="-6" x2="22" y2="-1" stroke="#F56276" strokeWidth="3" strokeLinecap="round" />
        <line x1="45" y1="10" x2="51" y2="6" stroke="#F56276" strokeWidth="3" strokeLinecap="round" />
        <line x1="-3" y1="10" x2="-9" y2="6" stroke="#F56276" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Concept Backtracking DAG Nodes */}
      <g transform="translate(45, 65)">
        {/* Node 1: Class 3 */}
        <circle cx="22" cy="35" r="18" fill="#EEF0F2" stroke="#36151E" strokeWidth="3.5" />
        <text x="22" y="40" textAnchor="middle" fill="#36151E" fontFamily="var(--font-serif), serif" fontSize="13" fontWeight="bold">
          C3
        </text>

        {/* Arrow to Node 2 */}
        <line x1="40" y1="35" x2="68" y2="35" stroke="#F56276" strokeWidth="3.5" strokeDasharray="4 3" />
        <polygon points="70,35 62,30 62,40" fill="#F56276" />

        {/* Node 2: Class 4 */}
        <circle cx="88" cy="35" r="18" fill="#C6C7C4" stroke="#36151E" strokeWidth="3.5" />
        <text x="88" y="40" textAnchor="middle" fill="#36151E" fontFamily="var(--font-serif), serif" fontSize="13" fontWeight="bold">
          C4
        </text>

        {/* Arrow to Node 3 */}
        <line x1="106" y1="35" x2="134" y2="35" stroke="#A2999E" strokeWidth="3.5" />
        <polygon points="136,35 128,30 128,40" fill="#A2999E" />

        {/* Node 3: Class 5 */}
        <circle cx="154" cy="35" r="18" fill="#A2999E" stroke="#36151E" strokeWidth="3.5" />
        <text x="154" y="40" textAnchor="middle" fill="#36151E" fontFamily="var(--font-serif), serif" fontSize="13" fontWeight="bold">
          C5
        </text>
      </g>

      {/* 5-Day Plan Checklist with checkmarks */}
      <g transform="translate(50, 125)">
        <rect x="0" y="0" width="16" height="16" rx="3" fill="#A2999E" stroke="#36151E" strokeWidth="2.5" />
        <path d="M 4 8 L 7 12 L 13 4" stroke="#EEF0F2" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <line x1="24" y1="8" x2="120" y2="8" stroke="#36151E" strokeWidth="3" strokeLinecap="round" />
        <line x1="24" y1="18" x2="95" y2="18" stroke="#36151E" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
