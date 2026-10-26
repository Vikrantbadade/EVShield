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
      <svg viewBox="0 0 40 40" className="w-4/5 h-4/5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoShield" x1="5" y1="2" x2="35" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
          <linearGradient id="logoBolt" x1="20" y1="8" x2="20" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>

        {/* Shield Contour */}
        <path
          d="M20 4L7 9V19C7 28.5 12.5 35.8 20 39C27.5 35.8 33 28.5 33 19V9L20 4Z"
          stroke="url(#logoShield)"
          strokeWidth="2.2"
          strokeLinejoin="round"
          fill="rgba(23, 23, 43, 0.6)"
        />

        {/* Central Electric Charging Bolt */}
        <path
          d="M22 9L13 21H19.5L17 31L27 18H20.5L22 9Z"
          fill="url(#logoBolt)"
        />

        {/* Orbit Node */}
        <circle cx="20" cy="5" r="1.5" fill="#22D3EE" />
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
