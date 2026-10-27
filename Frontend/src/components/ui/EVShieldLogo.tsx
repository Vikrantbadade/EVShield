import React from 'react';

interface EVShieldLogoProps {
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const EVShieldLogo: React.FC<EVShieldLogoProps> = ({
  variant = 'full',
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  const IconMark = (
    <div
      className={`relative ${currentSize.icon} rounded-xl bg-gradient-to-br from-[#17172B] to-[#202039] border border-[#8B5CF6]/40 flex items-center justify-center shrink-0 shadow-lg shadow-[#8B5CF6]/15 group transition-all duration-300`}
    >
      <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="evshield-logo-mask">
            <rect width="100" height="100" fill="white" />
            <circle cx="51" cy="14" r="2.0" fill="black" />
            <circle cx="33" cy="17" r="2.0" fill="black" />
            <circle cx="15" cy="24" r="2.0" fill="black" />
            <circle cx="18" cy="42" r="2.0" fill="black" />
            <circle cx="21" cy="60" r="2.0" fill="black" />
            <circle cx="30" cy="77" r="2.0" fill="black" />
            <circle cx="50" cy="89" r="2.2" fill="black" />
            <circle cx="39" cy="32" r="2.0" fill="black" />
            <circle cx="45" cy="46" r="2.0" fill="black" />
            <circle cx="33" cy="49" r="2.0" fill="black" />
            <circle cx="44" cy="69" r="2.0" fill="black" />
          </mask>
        </defs>

        {/* Right Shield Rim (Curved Solid Band) */}
        <path
          d="M 60 14 C 73 18 84 24 84 28 C 84 50 75 73 57 88 L 51 81 C 67 67 74 48 74 29 C 74 26 66 22 58 20 Z"
          fill="#FFFFFF"
        />

        {/* Top Connecting Collar */}
        <path
          d="M 50 11.5 L 61 14.5 L 59 21.5 L 48 18.5 Z"
          fill="#FFFFFF"
        />

        {/* Bottom Connecting Collar */}
        <path
          d="M 48 85.5 L 57 80.5 L 60 86.5 L 51 91.5 Z"
          fill="#FFFFFF"
        />

        {/* Circuit Network with Masked Transparent Cutouts */}
        <g mask="url(#evshield-logo-mask)">
          {/* Circuit Network Traces */}
          <g stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="33" y1="17" x2="51" y2="14" />
            <line x1="15" y1="24" x2="33" y2="17" />
            <line x1="15" y1="24" x2="18" y2="42" />
            <line x1="18" y1="42" x2="21" y2="60" />
            <line x1="21" y1="60" x2="30" y2="77" />
            <line x1="30" y1="77" x2="50" y2="89" />

            <line x1="15" y1="24" x2="39" y2="32" />
            <line x1="33" y1="17" x2="39" y2="32" />
            <line x1="51" y1="14" x2="39" y2="32" />
            <line x1="39" y1="32" x2="45" y2="46" />
            <line x1="18" y1="42" x2="33" y2="49" />
            <line x1="39" y1="32" x2="33" y2="49" />
            <line x1="33" y1="49" x2="45" y2="46" />
            <line x1="33" y1="49" x2="21" y2="60" />
            <line x1="45" y1="46" x2="44" y2="69" />
            <line x1="21" y1="60" x2="44" y2="69" />
            <line x1="30" y1="77" x2="44" y2="69" />
            <line x1="44" y1="69" x2="50" y2="89" />
          </g>

          {/* Circuit Network Nodes */}
          <g fill="#FFFFFF">
            <circle cx="51" cy="14" r="4.2" />
            <circle cx="33" cy="17" r="4.2" />
            <circle cx="15" cy="24" r="4.2" />
            <circle cx="18" cy="42" r="4.2" />
            <circle cx="21" cy="60" r="4.2" />
            <circle cx="30" cy="77" r="4.2" />
            <circle cx="50" cy="89" r="4.5" />
            <circle cx="39" cy="32" r="4.2" />
            <circle cx="45" cy="46" r="4.2" />
            <circle cx="33" cy="49" r="4.2" />
            <circle cx="44" cy="69" r="4.2" />
          </g>
        </g>
      </svg>
    </div>
  );

  if (variant === 'mark') {
    return <div className={`inline-flex items-center ${className}`}>{IconMark}</div>;
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {IconMark}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-black ${currentSize.text} tracking-tight text-[#F8FAFC]`}>
            EV<span className="text-[#8B5CF6]">Shield</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
        </div>
        {showSubtitle && (
          <span className={`font-mono ${currentSize.sub} font-semibold text-[#A1A1B5] tracking-widest uppercase`}>
            SOC Platform
          </span>
        )}
      </div>
    </div>
  );
};
