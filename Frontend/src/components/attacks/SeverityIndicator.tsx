import React from 'react';
import { SeverityLevel } from '../../types/attack';

interface SeverityIndicatorProps {
  severity: SeverityLevel;
}

const levels: SeverityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const SeverityIndicator: React.FC<SeverityIndicatorProps> = ({ severity }) => {
  const currentIndex = levels.indexOf(severity);

  const getBarColor = (index: number) => {
    if (index > currentIndex) return 'bg-[#AD8B73]/15 border-transparent';
    switch (index) {
      case 0: return 'bg-[#19BFA3] border-[#19BFA3]';
      case 1: return 'bg-[#CEAB93] border-[#CEAB93]';
      case 2: return 'bg-[#D99A32] border-[#D99A32]';
      case 3: return 'bg-[#E85C68] border-[#E85C68]';
      default: return 'bg-[#19BFA3]';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-[#7A7067]">Attack Severity Meter</span>
        <span className="font-extrabold text-[#3F3832]">{severity}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {levels.map((lvl, i) => (
          <div key={lvl} className="space-y-1">
            <div
              className={`h-2.5 rounded-full border transition-all duration-500 ${getBarColor(i)} ${
                i === currentIndex ? 'shadow-glass-sm animate-pulse' : ''
              }`}
            />
            <div className="text-[9px] font-mono text-center text-[#7A7067] font-semibold">{lvl}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
