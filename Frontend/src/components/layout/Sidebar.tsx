import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  FileText,
  Search,
  Server,
  Cpu,
  BarChart3,
  Bell,
  Settings,
  CheckCircle2,
  LogOut,
  User as UserIcon,
  Pin,
  PinOff,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EVShieldLogo } from '../ui/EVShieldLogo';
import { UserRole } from '../../services/authService';
import { SidebarBody, SidebarLink, useSidebar, SidebarLinkItem } from '../ui/sidebar';
import { motion, AnimatePresence } from 'framer-motion';

const navItems: SidebarLinkItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Live Monitoring', href: '/monitoring', icon: Activity },
  { label: 'Attack Logs', href: '/logs', icon: FileText },
  { label: 'Attack Analysis', href: '/analysis', icon: Search },
  { label: 'Charging Network', href: '/charging-network', icon: Server },
  { label: 'ML Detection', href: '/ml-detection', icon: Cpu },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const ROLE_DISPLAY: Record<UserRole, { label: string; bg: string; text: string; border: string }> = {
  admin: {
    label: 'ADMIN',
    bg: 'rgba(251, 113, 133, 0.15)',
    text: '#FB7185',
    border: 'rgba(251, 113, 133, 0.35)',
  },
  security_analyst: {
    label: 'ANALYST',
    bg: 'rgba(155, 123, 255, 0.18)',
    text: '#C4B5FD',
    border: 'rgba(155, 123, 255, 0.4)',
  },
  soc_operator: {
    label: 'OPERATOR',
    bg: 'rgba(77, 217, 240, 0.15)',
    text: '#4DD9F0',
    border: 'rgba(77, 217, 240, 0.35)',
  },
  viewer: {
    label: 'VIEWER',
    bg: 'rgba(52, 211, 153, 0.15)',
    text: '#34D399',
    border: 'rgba(52, 211, 153, 0.35)',
  },
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { open, isPinned, togglePin, setMobileOpen, animate } = useSidebar();

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const userRole = user?.role || 'viewer';
  const roleMeta = ROLE_DISPLAY[userRole] || ROLE_DISPLAY.viewer;

  return (
    <SidebarBody>
      {/* 1. Header / Logo Section */}
      <div className="h-16 px-3.5 border-b border-[#C4B5FD]/16 flex items-center justify-between shrink-0">
        <NavLink
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center min-w-0 focus:outline-none"
          title="EVShield Dashboard"
        >
          {open ? (
            <motion.div
              key="full-logo"
              initial={animate ? { opacity: 0, x: -6 } : false}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center"
            >
              <EVShieldLogo variant="full" size="sm" />
            </motion.div>
          ) : (
            <motion.div
              key="mark-logo"
              initial={animate ? { opacity: 0, scale: 0.85 } : false}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.18 }}
              className="mx-auto flex items-center justify-center w-10 h-10 rounded-xl hover:bg-[#9B7BFF]/10 transition-colors"
            >
              <EVShieldLogo variant="mark" size="sm" />
            </motion.div>
          )}
        </NavLink>

        {/* Desktop Pin / Compact Toggle Button */}
        {open && (
          <button
            id="sidebar-pin-toggle"
            data-testid="sidebar-pin-toggle"
            type="button"
            onClick={togglePin}
            className={`hidden lg:flex items-center justify-center p-1.5 rounded-lg transition-all duration-200 ${
              isPinned
                ? 'text-[#9B7BFF] bg-[#9B7BFF]/20 border border-[#9B7BFF]/40 shadow-[0_0_8px_rgba(155,123,255,0.3)]'
                : 'text-[#9896B0] hover:text-[#F5F3FF] hover:bg-[#252542] border border-transparent'
            }`}
            title={isPinned ? 'Sidebar pinned open (click to unpin)' : 'Click to pin sidebar open'}
            aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            {isPinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Mobile Close Button (visible only in mobile drawer) */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="flex lg:hidden items-center justify-center p-1.5 rounded-lg text-[#9896B0] hover:text-[#F5F3FF] hover:bg-[#252542] transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Main Navigation Links */}
      <nav
        className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none"
        aria-label="Sidebar Navigation"
      >
        {navItems.map((item) => (
          <SidebarLink key={item.href} link={item} />
        ))}
      </nav>

      {/* 3. Footer / User Identity Section */}
      <div className="p-2.5 border-t border-[#C4B5FD]/16 shrink-0 bg-[#141425]/50 space-y-2">
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="user-expanded"
              initial={animate ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className="space-y-2.5"
            >
              {/* User profile card */}
              <div className="p-2.5 rounded-xl bg-[#252542] border border-[#C4B5FD]/16 flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8055F6]/30 to-[#9B7BFF]/30 border border-[#9B7BFF]/40 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-[#C4B5FD]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#F5F3FF] truncate">
                      {user?.name || 'Operator'}
                    </div>
                    <div className="text-[10px] font-mono text-[#9896B0] truncate">
                      {user?.email || 'operator@evshield.demo'}
                    </div>
                  </div>
                </div>

                <span
                  className="px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 tracking-wider"
                  style={{
                    backgroundColor: roleMeta.bg,
                    color: roleMeta.text,
                    borderColor: roleMeta.border,
                    borderWidth: '1px',
                  }}
                >
                  {roleMeta.label}
                </span>
              </div>

              {/* System status indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 text-[11px] font-mono text-[#34D399]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                <span className="truncate">Telemetry Online</span>
              </div>

              {/* Disconnect button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-semibold text-[#FB7185] hover:bg-[#FB7185]/15 border border-[#FB7185]/25 transition-all duration-200"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>DISCONNECT SESSION</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="user-collapsed"
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center gap-2 py-1"
            >
              {/* Compact user avatar with tooltip */}
              <div className="relative group/user">
                <div
                  className="w-10 h-10 rounded-xl bg-[#252542] border flex items-center justify-center cursor-default transition-transform group-hover/user:scale-105"
                  style={{ borderColor: roleMeta.border }}
                >
                  <UserIcon className="w-4 h-4 text-[#C4B5FD]" />
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#17172A]"
                    style={{ backgroundColor: roleMeta.text }}
                  />
                </div>

                {/* Collapsed user tooltip */}
                <div
                  role="tooltip"
                  className="absolute left-[calc(100%+14px)] bottom-0 px-2.5 py-1.5 rounded-lg bg-[#1D1D35] border border-[#C4B5FD]/20 text-xs shadow-xl shadow-black/80 pointer-events-none whitespace-nowrap opacity-0 group-hover/user:opacity-100 translate-x-[-4px] group-hover/user:translate-x-0 transition-all duration-150 z-50 hidden lg:block"
                >
                  <div className="font-bold text-[#F5F3FF]">{user?.name || 'Operator'}</div>
                  <div className="text-[10px] font-mono" style={{ color: roleMeta.text }}>
                    {roleMeta.label} • {user?.email}
                  </div>
                  <div className="absolute right-full bottom-3 border-4 border-transparent border-r-[#1D1D35]" />
                </div>
              </div>

              {/* Compact logout icon button with tooltip */}
              <div className="relative group/logout">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[#FB7185] hover:bg-[#FB7185]/15 border border-[#FB7185]/20 transition-all duration-200"
                  aria-label="Disconnect session"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                <div
                  role="tooltip"
                  className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-[#1D1D35] border border-[#FB7185]/30 text-xs font-semibold text-[#FB7185] shadow-xl shadow-black/80 pointer-events-none whitespace-nowrap opacity-0 group-hover/logout:opacity-100 translate-x-[-4px] group-hover/logout:translate-x-0 transition-all duration-150 z-50 hidden lg:block"
                >
                  Disconnect Session
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1D1D35]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidebarBody>
  );
};
