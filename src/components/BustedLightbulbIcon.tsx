import React from 'react';

interface BustedLightbulbIconProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const BustedLightbulbIcon: React.FC<BustedLightbulbIconProps> = ({
  className = '',
  size = 28,
  glow = true
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-110"
      >
        <defs>
          <linearGradient id="neonCyanBlue" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00f0ff" />
            <stop offset="1" stopColor="#0066ff" />
          </linearGradient>
          {glow && (
            <filter id="bulbGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Bulb Glass Body with Fractures */}
        <path
          d="M18 30C15 27 13 22 13 18C13 11.9 17.9 7 24 7C30.1 7 35 11.9 35 18C35 22 33 27 30 30"
          stroke="url(#neonCyanBlue)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter={glow ? 'url(#bulbGlow)' : undefined}
        />

        {/* Shattered Glass Lightning Crack Lines */}
        <path
          d="M20 9L24 16L22 21L27 24L25 29"
          stroke="#00f0ff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 16L29 14L32 17"
          stroke="#00e5ff"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M22 21L16 23L14 20"
          stroke="#00e5ff"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* High Voltage Arc Sparks inside */}
        <circle cx="23" cy="20" r="1.8" fill="#ffffff" filter={glow ? 'url(#bulbGlow)' : undefined} />
        <path
          d="M25 15L23 18L26 21"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Screw Base (Tattoo Machine Coil Style) */}
        <rect x="18" y="31" width="12" height="2.5" rx="1" fill="#0d1b33" stroke="#00f0ff" strokeWidth="1.2" />
        <rect x="19" y="34.5" width="10" height="2.5" rx="1" fill="#0d1b33" stroke="#0066ff" strokeWidth="1.2" />
        <rect x="20" y="38" width="8" height="2" rx="1" fill="#0d1b33" stroke="#00f0ff" strokeWidth="1.2" />
        <path d="M22 41Q24 43 26 41" stroke="#00f0ff" strokeWidth="1.5" fill="none" />

        {/* Outer Voltage Sparks */}
        <path d="M8 18L10 19L9 21" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M40 18L38 19L39 21" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {/* Subtle pulsing electric dot */}
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-75" />
    </div>
  );
};
