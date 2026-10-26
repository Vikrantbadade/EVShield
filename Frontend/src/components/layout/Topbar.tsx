import React from 'react';
import { Menu, Bell, User, Play, Square, AlertTriangle, LogOut } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../services/authService';

interface TopbarProps {
  title: string;
  onOpenMobileSidebar: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  security_analyst: 'Security Analyst',
  soc_operator: 'SOC Operator',
  viewer: 'Viewer (Read-Only)',
};

export const Topbar: React.FC<TopbarProps> = ({ title, onOpenMobileSidebar }) => {
  const { isAttackMode, toggleDDoSAttack, notifications } = useSecurity();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const roleTitle = user?.role ? (ROLE_LABELS[user.role] || user.role) : 'SOC Operator';

  return (
    <header
      className="h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 border-b border-[#C4B5FD]/16 bg-[#11111F]/85 backdrop-blur-2xl"
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-[#9896B0] hover:bg-[#9B7BFF]/15 hover:text-[#F5F3FF] lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-[#F5F3FF] tracking-tight">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Simulation trigger */}
        <button
          onClick={toggleDDoSAttack}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide transition-all duration-300 border shadow-md ${
            isAttackMode
              ? 'bg-[#FB7185]/20 border-[#FB7185]/40 text-[#FB7185] shadow-[#FB7185]/20'
              : 'bg-[#4DD9F0]/15 border-[#4DD9F0]/35 text-[#4DD9F0] hover:bg-[#4DD9F0]/25'
          }`}
        >
          {isAttackMode ? (
            <><Square className="w-3 h-3 fill-current" />END SIMULATION</>
          ) : (
            <><Play className="w-3 h-3 fill-current" />SIMULATE DDOS</>
          )}
          <span className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] text-[#F5F3FF]">DEMO</span>
        </button>

        {/* Status pill */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold border transition-all duration-300 ${
          isAttackMode
            ? 'bg-[#FB7185]/15 border-[#FB7185]/35 text-[#FB7185]'
            : 'bg-[#34D399]/15 border-[#34D399]/30 text-[#34D399]'
        }`}>
          {isAttackMode
            ? <><AlertTriangle className="w-3 h-3" />ATTACK ACTIVE</>
            : <><span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />NORMAL MONITORING</>
          }
        </div>

        {/* Notification bell */}
        <div className="relative">
          <button className="p-2 rounded-xl bg-[#1D1D35] border border-[#C4B5FD]/16 text-[#C4C2D6] hover:text-[#F5F3FF] hover:border-[#9B7BFF]/40 transition-colors shadow-sm">
            <Bell className="w-4 h-4 text-[#C4B5FD]" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FB7185]" />
            )}
          </button>
        </div>

        {/* User profile with dynamic role */}
        <div className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-full bg-[#1D1D35] border border-[#C4B5FD]/18 shadow-sm">
          <div className="hidden md:flex flex-col text-right pr-1">
            <span className="text-xs font-semibold text-[#F5F3FF] leading-none">
              {user?.name || 'Operator'}
            </span>
            <span className="text-[10px] font-mono text-[#4DD9F0] leading-tight">
              {roleTitle}
            </span>
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#8055F6] to-[#9B7BFF] flex items-center justify-center shadow-sm">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1 rounded-full text-[#9896B0] hover:text-[#FB7185] hover:bg-[#FB7185]/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
