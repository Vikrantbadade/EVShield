import React from 'react';
import { SeverityLevel, IncidentStatus, ClassificationType } from '../../types/attack';

interface AttackBadgeProps {
  type: 'severity' | 'status' | 'classification';
  value: SeverityLevel | IncidentStatus | ClassificationType | string;
  className?: string;
}

export const AttackBadge: React.FC<AttackBadgeProps> = ({ type, value, className = '' }) => {
  let badgeStyle = 'bg-white/70 text-[#514940] border-white/90';

  if (type === 'severity') {
    switch (value.toString().toUpperCase()) {
      case 'CRITICAL':
        badgeStyle = 'bg-[#E85C68]/15 text-[#a82d38] border-[#E85C68]/35 font-bold';
        break;
      case 'HIGH':
        badgeStyle = 'bg-[#D99A32]/15 text-[#a8731d] border-[#D99A32]/35 font-bold';
        break;
      case 'MEDIUM':
        badgeStyle = 'bg-[#CEAB93]/25 text-[#514940] border-[#AD8B73]/30';
        break;
      case 'LOW':
      default:
        badgeStyle = 'bg-[#19BFA3]/15 text-[#0d7a67] border-[#19BFA3]/30';
        break;
    }
  } else if (type === 'status') {
    switch (value.toString().toUpperCase()) {
      case 'DETECTED':
      case 'ACTIVE':
        badgeStyle = 'bg-[#E85C68]/15 text-[#a82d38] border-[#E85C68]/35 font-bold animate-pulse';
        break;
      case 'INVESTIGATING':
        badgeStyle = 'bg-[#D99A32]/15 text-[#a8731d] border-[#D99A32]/35 font-semibold';
        break;
      case 'MITIGATED':
      case 'RESOLVED':
        badgeStyle = 'bg-[#62C073]/15 text-[#2b703b] border-[#62C073]/30 font-semibold';
        break;
      default:
        badgeStyle = 'bg-white/70 text-[#514940] border-white/90';
        break;
    }
  } else if (type === 'classification') {
    if (value.toString().toUpperCase() === 'ATTACK') {
      badgeStyle = 'bg-[#E85C68]/15 text-[#a82d38] border-[#E85C68]/35 font-extrabold';
    } else {
      badgeStyle = 'bg-[#62C073]/15 text-[#2b703b] border-[#62C073]/30 font-bold';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider border shadow-glass-sm ${badgeStyle} ${className}`}
    >
      {value}
    </span>
  );
};
