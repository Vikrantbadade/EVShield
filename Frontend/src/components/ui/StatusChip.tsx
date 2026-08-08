import React from 'react';

type ChipVariant = 'protected' | 'threat' | 'live' | 'demo' | 'critical' | 'normal';

interface StatusChipProps {
  label: string;
  variant?: ChipVariant;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  variant = 'normal',
  dot = false,
  pulse = false,
  icon,
  className = '',
}) => {
  return (
    <span className={`chip chip-${variant} ${className}`}>
      {dot && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${pulse ? 'animate-pulse' : ''} ${
          variant === 'protected' || variant === 'live' ? 'bg-[#19BFA3]'
          : variant === 'threat' || variant === 'critical' ? 'bg-[#E85C68]'
          : 'bg-[#7A7067]'
        }`} />
      )}
      {icon}
      {label}
    </span>
  );
};
