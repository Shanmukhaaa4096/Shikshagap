'use client';

interface MotifProps {
  className?: string;
  size?: number;
  color?: string;
}

/** Flat 5-petal flower motif from the Sealed Stories brand board */
export function FlowerPetal({
  className = '',
  size = 24,
  color = '#F4C542',
  centerColor = '#F28C38',
}: MotifProps & { centerColor?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* 5 rounded petals */}
      <circle cx="12" cy="7.2" r="4.2" fill={color} />
      <circle cx="16.6" cy="10.5" r="4.2" fill={color} />
      <circle cx="14.8" cy="16" r="4.2" fill={color} />
      <circle cx="9.2" cy="16" r="4.2" fill={color} />
      <circle cx="7.4" cy="10.5" r="4.2" fill={color} />
      {/* Center core */}
      <circle cx="12" cy="12" r="3.2" fill={centerColor} />
    </svg>
  );
}

/** Soft illustrated botanical leaf */
export function BotanicalLeaf({
  className = '',
  size = 24,
  color = '#6CA24A',
}: MotifProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M 4 20 C 6 12 14 5 21 3 C 21 11 15 19 4 20 Z"
        fill={color}
      />
      <path
        d="M 6 18 Q 13 13 19 5"
        stroke="#FFF7E6"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Whimsical 4-point star sparkle */
export function WarmSparkle({
  className = '',
  size = 20,
  color = '#F4C542',
}: MotifProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M 12 2 C 12 8 8 12 2 12 C 8 12 12 16 12 22 C 12 16 16 12 22 12 C 16 12 12 8 12 2 Z"
        fill={color}
      />
    </svg>
  );
}

/** Tiny illustrated gift box motif */
export function GiftBoxMotif({
  className = '',
  size = 24,
  boxColor = '#6CA24A',
  ribbonColor = '#F4C542',
}: MotifProps & { boxColor?: string; ribbonColor?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Box bottom */}
      <rect x="4" y="9" width="16" height="11" rx="2.5" fill={boxColor} />
      {/* Box lid */}
      <rect x="3" y="6" width="18" height="4" rx="2" fill={boxColor} />
      {/* Ribbon vertical */}
      <rect x="10.5" y="6" width="3" height="14" fill={ribbonColor} />
      {/* Ribbon bow */}
      <ellipse cx="9" cy="4.5" rx="2.8" ry="1.8" fill={ribbonColor} transform="rotate(-25 9 4.5)" />
      <ellipse cx="15" cy="4.5" rx="2.8" ry="1.8" fill={ribbonColor} transform="rotate(25 15 4.5)" />
      <circle cx="12" cy="5.2" r="1.4" fill={ribbonColor} />
    </svg>
  );
}

/** Section divider with botanical vines and a center flower */
export function FloralSectionDivider({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center gap-3 py-6 opacity-80 ${className}`} aria-hidden="true">
      <div className="h-[1.5px] w-16 sm:w-28 bg-gradient-to-r from-transparent to-[#C7DDAE]" />
      <BotanicalLeaf size={18} color="#6CA24A" className="-rotate-45" />
      <FlowerPetal size={22} color="#F4C542" centerColor="#F28C38" />
      <BotanicalLeaf size={18} color="#6CA24A" className="rotate-45 scale-x-[-1]" />
      <div className="h-[1.5px] w-16 sm:w-28 bg-gradient-to-l from-transparent to-[#C7DDAE]" />
    </div>
  );
}
