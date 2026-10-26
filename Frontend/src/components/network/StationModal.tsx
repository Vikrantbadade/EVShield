import React, { useEffect } from 'react';
import { DemoStation } from '../../types/station';
import { StationFlickCard } from './StationFlickCard';
import { X, Sparkles } from 'lucide-react';

interface StationModalProps {
  station: DemoStation;
  onClose: () => void;
}

export const StationModal: React.FC<StationModalProps> = ({ station, onClose }) => {
  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${station.name} Station Details`}
    >
      {/* Dark translucent backdrop */}
      <div
        className="absolute inset-0 bg-[#06060F]/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative z-10 flex flex-col items-center gap-3 animate-fade-up max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Top Controls Bar (outside the rotating card) */}
        <div className="w-full max-w-[370px] flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#C4B5FD]">
            <Sparkles className="w-3.5 h-3.5 text-[#9B7BFF] animate-pulse" />
            <span className="font-semibold text-[#F5F3FF]">{station.id}</span>
            <span className="text-[10px] text-[#9896B0]">Interactive 3D</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            data-no-flip
            className="p-1.5 px-3 rounded-xl bg-[#17172E]/90 hover:bg-[#252548] border border-[#C4B5FD]/25 text-[#C4C2D6] hover:text-[#F5F3FF] transition-all shadow-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            aria-label="Close station details"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>

        {/* Kokonut Flick Card */}
        <StationFlickCard station={station} />
      </div>
    </div>
  );
};
