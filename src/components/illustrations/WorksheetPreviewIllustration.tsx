'use client';


export function WorksheetPreviewIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full max-w-[200px] h-auto drop-shadow-xs ${className}`}
      role="img"
      aria-label="Illustration of magnifying glass over a math worksheet with pencil"
    >
      {/* Worksheet Sheet Background */}
      <rect x="25" y="15" width="150" height="150" rx="6" fill="#EEF0F2" stroke="#36151E" strokeWidth="4" />
      
      {/* Top Header Strip */}
      <rect x="25" y="15" width="150" height="24" rx="4" fill="#EEF0F2" stroke="#36151E" strokeWidth="2.5" />
      <circle cx="42" cy="27" r="4" fill="#A2999E" stroke="#36151E" strokeWidth="1.5" />
      <line x1="56" y1="27" x2="110" y2="27" stroke="#36151E" strokeWidth="2.5" strokeLinecap="round" />

      {/* Maths grid lines and sums on sheet */}
      <line x1="40" y1="52" x2="145" y2="52" stroke="#36151E" strokeWidth="2" strokeDasharray="3 3" />
      <text x="42" y="68" fill="#36151E" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="bold">
        52 - 27 = ?
      </text>

      <line x1="40" y1="82" x2="145" y2="82" stroke="#36151E" strokeWidth="2" strokeDasharray="3 3" />
      <text x="42" y="98" fill="#36151E" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="bold">
        64 - 38 = ?
      </text>

      <line x1="40" y1="112" x2="145" y2="112" stroke="#36151E" strokeWidth="2" strokeDasharray="3 3" />
      <text x="42" y="128" fill="#A2999E" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="bold">
        83 - 49 = ?
      </text>

      <line x1="40" y1="142" x2="145" y2="142" stroke="#36151E" strokeWidth="2" strokeDasharray="3 3" />

      {/* Magnifying Glass Over the Sum */}
      <g transform="translate(100, 50)">
        {/* Shadow */}
        <circle cx="42" cy="42" r="34" fill="#36151E" fillOpacity="0.1" />
        {/* Glass Outer Rim */}
        <circle cx="40" cy="40" r="32" fill="#EEF0F2" fillOpacity="0.85" stroke="#36151E" strokeWidth="5" />
        {/* Inner Highlight Ring */}
        <circle cx="40" cy="40" r="26" stroke="#A2999E" strokeWidth="3" fill="none" />
        {/* Magnified Equation Inside Lens */}
        <text x="40" y="45" textAnchor="middle" fill="#F56276" fontFamily="ui-monospace, monospace" fontSize="16" fontWeight="bold">
          25 !
        </text>
        {/* Glass handle */}
        <path d="M 64 64 L 98 98" stroke="#C6C7C4" strokeWidth="12" strokeLinecap="round" />
        <path d="M 64 64 L 98 98" stroke="#36151E" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* Friendly Cartoon Pencil on the Left */}
      <g transform="translate(12, 60) rotate(-22)">
        {/* Pencil Body (Tan Orange) */}
        <rect x="0" y="0" width="12" height="60" rx="2" fill="#C6C7C4" stroke="#36151E" strokeWidth="2.5" />
        {/* Eraser on top */}
        <rect x="0" y="-12" width="12" height="12" rx="3" fill="#F56276" stroke="#36151E" strokeWidth="2" />
        {/* Ferrule band */}
        <rect x="0" y="-3" width="12" height="5" fill="#EEF0F2" stroke="#36151E" strokeWidth="1.5" />
        {/* Sharpened wooden cone */}
        <polygon points="0,60 12,60 6,74" fill="#EEF0F2" stroke="#36151E" strokeWidth="2" />
        {/* Graphite tip */}
        <polygon points="4,69 8,69 6,74" fill="#36151E" />
      </g>
    </svg>
  );
}
