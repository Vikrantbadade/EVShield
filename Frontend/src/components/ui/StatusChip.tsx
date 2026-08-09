import React from 'react';

type ChipVariant =
  | 'protected'
  | 'threat'
  | 'live'
  | 'demo'
  | 'critical'
  | 'normal'
  | 'attack'
  | 'degraded'
  | 'warning'
  | 'offline'
  | 'monitoring'
  | 'replay';

interface StatusChipProps {
  label: string;
  variant?: ChipVariant;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

/** Infer a ChipVariant from a raw station/alert status string */
export function inferVariant(status: string): ChipVariant {
  const s = status.toUpperCase().trim();
  if (s === 'PROTECTED' || s === 'NORMAL')     return 'protected';
  if (s === 'UNDER ATTACK' || s === 'ATTACK')  return 'attack';
  if (s === 'DEGRADED')                         return 'degraded';
  if (s === 'OFFLINE')                          return 'offline';
  if (s === 'CRITICAL')                         return 'critical';
  if (s === 'HIGH')                             return 'threat';
  if (s === 'MEDIUM' || s === 'WARNING')        return 'warning';
  if (s === 'LOW')                              return 'normal';
  if (s === 'MONITORING')                       return 'monitoring';
  if (s === 'REPLAY' || s.includes('REPLAY'))   return 'replay';
  if (s === 'LIVE' || s.includes('LIVE'))       return 'live';
  if (s === 'DEMO' || s.includes('DEMO'))       return 'demo';
  return 'normal';
}

const dotColorMap: Record<ChipVariant, string> = {
  protected:  'bg-[#62C073]',
  live:       'bg-[#19BFA3]',
  threat:     'bg-[#E85C68]',
  critical:   'bg-[#E85C68]',
  attack:     'bg-[#E85C68]',
  degraded:   'bg-[#D99A32]',
  warning:    'bg-[#D99A32]',
  offline:    'bg-[#7A7067]',
  monitoring: 'bg-[#52A8FF]',
  demo:       'bg-[#AD8B73]',
  replay:     'bg-[#AD8B73]',
  normal:     'bg-[#7A7067]',
};

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
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            pulse ? 'animate-pulse' : ''
          } ${dotColorMap[variant] ?? 'bg-[#7A7067]'}`}
        />
      )}
      {icon}
      {label}
    </span>
  );
};
