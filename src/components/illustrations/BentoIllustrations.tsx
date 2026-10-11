'use client';

import React from 'react';

export function DagBentoIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="DAG concept hierarchy">
      <circle cx="25" cy="40" r="16" fill="#F5F1BC" stroke="#432623" strokeWidth="3" />
      <text x="25" y="45" textAnchor="middle" fill="#432623" fontFamily="var(--font-serif), serif" fontSize="11" fontWeight="bold">C3</text>

      <line x1="41" y1="40" x2="68" y2="40" stroke="#DE2A35" strokeWidth="3" strokeDasharray="4 2" />
      <polygon points="70,40 62,36 62,44" fill="#DE2A35" />

      <circle cx="85" cy="40" r="16" fill="#DFA06E" stroke="#432623" strokeWidth="3" />
      <text x="85" y="45" textAnchor="middle" fill="#432623" fontFamily="var(--font-serif), serif" fontSize="11" fontWeight="bold">C4</text>

      <line x1="101" y1="40" x2="128" y2="40" stroke="#8ABB93" strokeWidth="3" />
      <polygon points="130,40 122,36 122,44" fill="#8ABB93" />

      <circle cx="145" cy="40" r="16" fill="#8ABB93" stroke="#432623" strokeWidth="3" />
      <text x="145" y="45" textAnchor="middle" fill="#432623" fontFamily="var(--font-serif), serif" fontSize="11" fontWeight="bold">C5</text>
    </svg>
  );
}

export function LanguagesBentoIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Regional language blocks">
      {/* English Block */}
      <rect x="10" y="20" width="34" height="34" rx="5" fill="#FAF8E8" stroke="#432623" strokeWidth="3" />
      <text x="27" y="43" textAnchor="middle" fill="#432623" fontFamily="var(--font-serif), serif" fontSize="16" fontWeight="bold">A</text>

      {/* Hindi Block */}
      <rect x="53" y="12" width="34" height="34" rx="5" fill="#DE2A35" stroke="#432623" strokeWidth="3" />
      <text x="70" y="36" textAnchor="middle" fill="#FAF8E8" fontFamily="var(--font-serif), serif" fontSize="16" fontWeight="bold">अ</text>

      {/* Telugu Block */}
      <rect x="96" y="22" width="34" height="34" rx="5" fill="#8ABB93" stroke="#432623" strokeWidth="3" />
      <text x="113" y="45" textAnchor="middle" fill="#432623" fontFamily="var(--font-serif), serif" fontSize="16" fontWeight="bold">అ</text>
    </svg>
  );
}

export function WorksheetBentoIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="A4 paper worksheet stack">
      <rect x="25" y="12" width="65" height="50" rx="3" fill="#DFA06E" stroke="#432623" strokeWidth="2.5" />
      <rect x="20" y="8" width="65" height="50" rx="3" fill="#F5F1BC" stroke="#432623" strokeWidth="2.5" />
      <rect x="15" y="4" width="65" height="50" rx="3" fill="#FAF8E8" stroke="#432623" strokeWidth="3" />

      {/* Printed task lines */}
      <line x1="24" y1="14" x2="55" y2="14" stroke="#DE2A35" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="22" x2="68" y2="22" stroke="#432623" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="29" x2="60" y2="29" stroke="#432623" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="36" x2="64" y2="36" stroke="#432623" strokeWidth="2" strokeLinecap="round" />

      {/* Binder Clip */}
      <rect x="42" y="2" width="12" height="6" rx="1.5" fill="#DE2A35" stroke="#432623" strokeWidth="1.5" />
    </svg>
  );
}

export function PrivacyBentoIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Privacy shield and lock">
      {/* Shield */}
      <path
        d="M 60 8 L 88 18 C 88 42, 74 58, 60 64 C 46 58, 32 42, 32 18 Z"
        fill="#8ABB93"
        stroke="#432623"
        strokeWidth="3.5"
      />
      {/* Keyhole / Padlock */}
      <circle cx="60" cy="32" r="5" fill="#FAF8E8" stroke="#432623" strokeWidth="2" />
      <polygon points="57,34 63,34 65,44 55,44" fill="#FAF8E8" stroke="#432623" strokeWidth="1.5" />
    </svg>
  );
}
