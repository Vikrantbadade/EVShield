import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Pin,
  PinOff,
  X,
} from 'lucide-react';
import { EVShieldLogo } from '../ui/EVShieldLogo';
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

export const Sidebar: React.FC = () => {
  const { open, isPinned, togglePin, setMobileOpen, animate } = useSidebar();

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

      {/* 3. Clean Footer / System Telemetry Status (No duplicate account card) */}
      <div className="p-2.5 border-t border-[#C4B5FD]/16 shrink-0 bg-[#141425]/50">
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="status-expanded"
              initial={animate ? { opacity: 0, y: 4 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 text-[11px] font-mono text-[#34D399]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                <span className="truncate font-semibold">Telemetry Online</span>
              </div>
              <span className="text-[9px] font-mono text-[#9896B0] shrink-0">v1.0 SOC</span>
            </motion.div>
          ) : (
            <motion.div
              key="status-collapsed"
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative group/status flex justify-center py-1"
            >
              <div className="w-9 h-9 rounded-xl bg-[#34D399]/10 border border-[#34D399]/25 flex items-center justify-center cursor-default transition-transform group-hover/status:scale-105">
                <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
              </div>

              {/* Collapsed Tooltip */}
              <div
                role="tooltip"
                className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-[#1D1D35] border border-[#34D399]/30 text-xs font-mono text-[#34D399] shadow-xl shadow-black/80 pointer-events-none whitespace-nowrap opacity-0 group-hover/status:opacity-100 translate-x-[-4px] group-hover/status:translate-x-0 transition-all duration-150 z-50 hidden lg:block"
              >
                Telemetry Online • System Nominal
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1D1D35]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidebarBody>
  );
};
