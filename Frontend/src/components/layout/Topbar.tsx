import React from 'react';
import { Menu, Bell, User, Play, Square, AlertTriangle } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

interface TopbarProps {
  title: string;
  onOpenMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ title, onOpenMobileSidebar }) => {
  const { isAttackMode, toggleDDoSAttack, notifications } = useSecurity();

  return (
    <header
      className="h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 border-b border-[#AD8B73]/15"
      style={{
        background: 'rgba(255, 251, 233, 0.68)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-[#7A7067] hover:bg-[#AD8B73]/10 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-[#3F3832] tracking-tight">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Simulation trigger */}
        <button
          onClick={toggleDDoSAttack}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide transition-all duration-300 border shadow-glass-sm ${
            isAttackMode
              ? 'bg-[#E85C68]/15 border-[#E85C68]/35 text-[#a82d38]'
              : 'bg-[#19BFA3]/12 border-[#19BFA3]/28 text-[#0d7a67] hover:bg-[#19BFA3]/20'
          }`}
        >
          {isAttackMode ? (
            <><Square className="w-3 h-3 fill-current" />END SIMULATION</>
          ) : (
            <><Play className="w-3 h-3 fill-current" />SIMULATE DDOS</>
          )}
          <span className="chip chip-demo py-0 px-1.5 text-[9px]">DEMO</span>
        </button>

        {/* Status pill */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold border transition-all duration-300 ${
          isAttackMode
            ? 'bg-[#E85C68]/12 border-[#E85C68]/30 text-[#a82d38]'
            : 'bg-[#62C073]/12 border-[#62C073]/28 text-[#2b703b]'
        }`}>
          {isAttackMode
            ? <><AlertTriangle className="w-3 h-3" />ATTACK ACTIVE</>
            : <><span className="w-1.5 h-1.5 rounded-full bg-[#62C073] animate-pulse" />OPERATIONAL</>
          }
        </div>

        {/* Notification bell */}
        <div className="relative">
          <button className="p-2 rounded-xl bg-white/60 border border-white/80 text-[#514940] hover:text-[#3F3832] hover:bg-white/80 transition-colors shadow-glass-sm">
            <Bell className="w-4 h-4 text-[#AD8B73]" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E85C68] border border-white" />
            )}
          </button>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-white/65 border border-white/80 shadow-glass-sm">
          <span className="hidden sm:block text-xs font-medium text-[#3F3832] pl-1">SOC Operator</span>
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#AD8B73] to-[#CEAB93] flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};
