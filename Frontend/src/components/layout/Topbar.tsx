import React from 'react';
import { Menu, Bell, Play, Square } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { ProfileDropdown } from './ProfileDropdown';

interface TopbarProps {
  title: string;
  onOpenMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ title, onOpenMobileSidebar }) => {
  const {
    toggleDDoSAttack,
    notifications,
    detectionStatus,
    simulationLifecycle,
    simulationMode,
  } = useSecurity();

  const isStopped = simulationLifecycle === 'STOPPED';
  const isAnomalous = detectionStatus === 'ANOMALY_ACTIVE';
  const isRecovering = detectionStatus === 'RECOVERING';

  return (
    <header className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 border-b border-[#C4B5FD]/16 bg-[#131326]/60 backdrop-blur-xl">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 rounded-lg text-[#9896B0] hover:bg-[#9B7BFF]/15 hover:text-[#F5F3FF] lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm sm:text-base font-semibold text-[#F5F3FF] tracking-tight">{title}</h1>
      </div>

      {/* Right: Aligned Liquid Glass Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* DDoS Simulation Action */}
        <button
          onClick={toggleDDoSAttack}
          className={`h-9 px-3 rounded-xl flex items-center gap-2 text-xs font-mono font-medium transition-all duration-200 border backdrop-blur-md ${
            isAnomalous
              ? 'bg-[#FB7185]/15 border-[#FB7185]/35 text-[#FB7185] hover:bg-[#FB7185]/25'
              : 'bg-[#8055F6]/15 hover:bg-[#8055F6]/25 border-[#8055F6]/30 text-[#C4B5FD]'
          }`}
          title={isAnomalous ? 'Halt active simulation' : 'Launch controlled simulation'}
        >
          {isAnomalous ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isAnomalous ? 'End Simulation' : 'Simulate DDoS'}</span>
        </button>

        {/* Compact Status Pill - Synchronized with Issue 3 dimensions */}
        <div
          className={`hidden sm:flex h-9 px-3 rounded-xl items-center gap-2 text-xs font-mono border backdrop-blur-md ${
            isStopped
              ? 'bg-[#252542]/50 border-[#C4B5FD]/16 text-[#9896B0]'
              : isAnomalous
              ? 'bg-[#FB7185]/10 border-[#FB7185]/30 text-[#FB7185]'
              : isRecovering
              ? 'bg-[#FBBF24]/10 border-[#FBBF24]/30 text-[#FBBF24]'
              : 'bg-[#17172B]/50 border-[#C4B5FD]/16 text-[#34D399]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isStopped
                ? 'bg-[#9896B0]'
                : isAnomalous
                ? 'bg-[#FB7185] animate-ping'
                : isRecovering
                ? 'bg-[#FBBF24] animate-pulse'
                : 'bg-[#34D399]'
            }`}
          />
          <span className="font-semibold">
            {isStopped
              ? 'Monitoring Stopped'
              : isAnomalous
              ? `Attack Active: ${simulationMode}`
              : isRecovering
              ? 'Recovering to Baseline'
              : 'Normal Monitoring'}
          </span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            className="h-9 w-9 rounded-xl flex items-center justify-center bg-[#17172B]/50 hover:bg-[#17172B]/80 border border-[#C4B5FD]/16 hover:border-[#C4B5FD]/30 text-[#C4C2D6] hover:text-[#F5F3FF] transition-all backdrop-blur-md"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-[#C4B5FD]" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#FB7185]" />
            )}
          </button>
        </div>

        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
};