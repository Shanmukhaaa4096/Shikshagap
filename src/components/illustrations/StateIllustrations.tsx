'use client';

import React from 'react';

export function NotFoundIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Owl mascot looking through magnifying glass for 404 page">
      {/* 4 0 4 big block shapes */}
      <g transform="translate(20, 20)">
        <text x="30" y="70" fill="#F56276" fontFamily="var(--font-serif), serif" fontSize="64" fontWeight="bold">4</text>
        <circle cx="100" cy="48" r="28" fill="#EEF0F2" stroke="#36151E" strokeWidth="5" />
        <circle cx="100" cy="48" r="14" fill="#A2999E" stroke="#36151E" strokeWidth="3" />
        <text x="170" y="70" fill="#F56276" fontFamily="var(--font-serif), serif" fontSize="64" fontWeight="bold">4</text>
      </g>

      {/* Mini Owl Mascot Searching with Magnifier */}
      <g transform="translate(75, 75)">
        <ellipse cx="45" cy="55" rx="30" ry="24" fill="#EEF0F2" stroke="#36151E" strokeWidth="4" />
        <circle cx="34" cy="48" r="9" fill="#EEF0F2" stroke="#36151E" strokeWidth="2.5" />
        <circle cx="56" cy="48" r="9" fill="#EEF0F2" stroke="#36151E" strokeWidth="2.5" />
        <circle cx="36" cy="48" r="3.5" fill="#36151E" />
        <circle cx="58" cy="48" r="3.5" fill="#36151E" />
        <polygon points="45,52 48,58 42,58" fill="#C6C7C4" stroke="#36151E" strokeWidth="1.5" />
        {/* Scholar Hat */}
        <polygon points="45,20 65,27 45,34 25,27" fill="#36151E" stroke="#36151E" strokeWidth="2" />
        <path d="M 45,27 Q 60,30 64,38" stroke="#F56276" strokeWidth="2" fill="none" />
        {/* Big Magnifying Glass held searching downwards */}
        <circle cx="78" cy="62" r="18" fill="#EEF0F2" stroke="#F56276" strokeWidth="3.5" />
        <line x1="88" y1="74" x2="104" y2="92" stroke="#C6C7C4" strokeWidth="5" strokeLinecap="round" />
        <line x1="88" y1="74" x2="104" y2="92" stroke="#36151E" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function SuccessIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Pilot confirmed celebration star">
      {/* Certificate / Badge */}
      <circle cx="80" cy="55" r="38" fill="#A2999E" stroke="#36151E" strokeWidth="4" />
      <polygon
        points="80,30 87,46 104,46 90,56 95,72 80,62 65,72 70,56 56,46 73,46"
        fill="#EEF0F2"
        stroke="#36151E"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Ribbons */}
      <polygon points="68,85 58,112 72,104 80,112 78,85" fill="#F56276" stroke="#36151E" strokeWidth="2.5" />
      <polygon points="92,85 102,112 88,104 80,112 82,85" fill="#F56276" stroke="#36151E" strokeWidth="2.5" />
    </svg>
  );
}

export function EmptyStateIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Empty notebook ready for test items">
      <rect x="35" y="20" width="90" height="75" rx="5" fill="#EEF0F2" stroke="#36151E" strokeWidth="3.5" />
      <line x1="48" y1="40" x2="112" y2="40" stroke="#36151E" strokeWidth="2" strokeDasharray="3 3" />
      <line x1="48" y1="55" x2="112" y2="55" stroke="#36151E" strokeWidth="2" strokeDasharray="3 3" />
      <line x1="48" y1="70" x2="90" y2="70" stroke="#36151E" strokeWidth="2" strokeDasharray="3 3" />
      {/* Bookmark ribbon */}
      <path d="M 98 16 L 98 42 L 105 36 L 112 42 L 112 16 Z" fill="#F56276" stroke="#36151E" strokeWidth="1.5" />
      {/* Plus and minus symbols */}
      <text x="44" y="90" fill="#A2999E" fontFamily="ui-monospace, monospace" fontSize="14" fontWeight="bold">+</text>
      <text x="112" y="90" fill="#C6C7C4" fontFamily="ui-monospace, monospace" fontSize="14" fontWeight="bold">-</text>
    </svg>
  );
}

export function LoadingStateIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Animated diagnostic in progress">
      <circle cx="60" cy="60" r="45" stroke="#36151E" strokeWidth="4" strokeDasharray="16 10" fill="none" />
      <circle cx="60" cy="60" r="28" fill="#EEF0F2" stroke="#F56276" strokeWidth="3.5" />
      <circle cx="60" cy="60" r="14" fill="#A2999E" stroke="#36151E" strokeWidth="2.5" />
      <polygon points="60,40 64,52 76,52 66,60 70,72 60,64 50,72 54,60 44,52 56,52" fill="#F56276" />
    </svg>
  );
}
