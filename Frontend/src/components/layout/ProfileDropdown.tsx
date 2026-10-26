import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronsUpDown,
  Settings,
  Activity,
  LogOut,
  CheckCircle2,
  Users,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../services/authService';

const ROLE_BADGES: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
  admin: {
    label: 'ADMIN',
    color: '#FB7185',
    bg: 'rgba(251, 113, 133, 0.15)',
    border: 'rgba(251, 113, 133, 0.35)',
  },
  security_analyst: {
    label: 'ANALYST',
    color: '#9B7BFF',
    bg: 'rgba(155, 123, 255, 0.16)',
    border: 'rgba(155, 123, 255, 0.35)',
  },
  soc_operator: {
    label: 'OPERATOR',
    color: '#4DD9F0',
    bg: 'rgba(77, 217, 240, 0.15)',
    border: 'rgba(77, 217, 240, 0.35)',
  },
  viewer: {
    label: 'VIEWER',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.35)',
  },
};

const DEMO_PERSONAS = [
  { name: 'Admin', email: 'admin@evshield.demo', role: 'admin' as UserRole },
  { name: 'Security Analyst', email: 'analyst@evshield.demo', role: 'security_analyst' as UserRole },
  { name: 'SOC Operator', email: 'operator@evshield.demo', role: 'soc_operator' as UserRole },
  { name: 'Viewer', email: 'viewer@evshield.demo', role: 'viewer' as UserRole },
];

export const ProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userRole = user?.role || 'viewer';
  const roleMeta = ROLE_BADGES[userRole] || ROLE_BADGES.viewer;

  // Initials for avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'OP';

  // Outside click dismissal
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSwitchMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setShowSwitchMenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSwitchAccount = async (targetEmail: string) => {
    if (user?.email === targetEmail) {
      setShowSwitchMenu(false);
      return;
    }
    setIsSwitching(true);
    try {
      setIsOpen(false);
      setShowSwitchMenu(false);
      // Invalidate current session on server/client
      await logout();
      // Navigate to login with target persona pre-selected for re-authentication
      navigate('/login', { state: { prefillEmail: targetEmail }, replace: true });
    } catch {
      navigate('/login', { state: { prefillEmail: targetEmail }, replace: true });
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="relative isolate inline-block" ref={dropdownRef}>
      {/* ── Kokonut Trigger Button ── */}
      <button
        type="button"
        id="profile-dropdown-trigger"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowSwitchMenu(false);
        }}
        className={`h-9 flex items-center gap-2 px-2.5 rounded-xl border transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9B7BFF]/40 backdrop-blur-md ${
          isOpen
            ? 'bg-[#252542] border-[#9B7BFF] shadow-md shadow-[#9B7BFF]/20'
            : 'bg-[#17172B]/50 hover:bg-[#17172B]/80 border-[#C4B5FD]/16 hover:border-[#C4B5FD]/30'
        }`}
      >
        {/* Avatar with Status Dot */}
        <div className="relative">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${roleMeta.color}88, #8055F6)`,
            }}
          >
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#34D399] ring-1 ring-[#17172B]" />
        </div>

        {/* User Info (Hidden on very small screens) */}
        <div className="hidden md:flex flex-col text-left leading-tight">
          <span className="text-xs font-semibold text-[#F5F3FF] truncate max-w-[110px]">
            {user?.name || 'Operator'}
          </span>
          <span
            className="text-[9px] font-mono font-bold uppercase tracking-wider"
            style={{ color: roleMeta.color }}
          >
            {roleMeta.label}
          </span>
        </div>

        {/* Chevron Menu Indicator */}
        <ChevronsUpDown
          className={`w-3.5 h-3.5 text-[#9896B0] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#F5F3FF]' : ''
          }`}
        />
      </button>

      {/* ── Morphing Kokonut Dropdown Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] w-72 rounded-2xl bg-[#17172B]/95 backdrop-blur-2xl border border-[#C4B5FD]/20 shadow-2xl shadow-black/80 overflow-hidden z-50 text-[#F5F3FF] select-none"
            role="menu"
            aria-label="User Account Menu"
          >
            {/* Top Specular Edge Highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C4B5FD]/30 to-transparent pointer-events-none" />

            {/* 1. Identity Header */}
            <div className="p-3.5 bg-[#121224]/80 border-b border-[#C4B5FD]/12">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-md shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${roleMeta.color}99, #8055F6)`,
                  }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-bold text-[#F5F3FF] truncate">
                      {user?.name || 'Operator'}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider shrink-0"
                      style={{
                        backgroundColor: roleMeta.bg,
                        color: roleMeta.color,
                        borderColor: roleMeta.border,
                        borderWidth: '1px',
                      }}
                    >
                      {roleMeta.label}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#9896B0] truncate mt-0.5">
                    {user?.email || 'operator@evshield.demo'}
                  </div>
                </div>
              </div>

              {/* Real System/Session Status */}
              <div className="mt-2.5 pt-2 border-t border-[#C4B5FD]/10 flex items-center justify-between text-[10px] font-mono text-[#34D399]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
                  <span>Telemetry Online</span>
                </div>
                <span className="text-[#9896B0]">v1.0 SOC</span>
              </div>
            </div>

            {/* 2. Menu Navigation Entries */}
            <div className="p-1.5 space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542] transition-colors"
                role="menuitem"
              >
                <Settings className="w-4 h-4 text-[#9B7BFF]" />
                <span className="flex-1 text-left">Platform Settings</span>
                <span className="text-[10px] font-mono text-[#9896B0]">/settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/monitoring');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542] transition-colors"
                role="menuitem"
              >
                <Activity className="w-4 h-4 text-[#4DD9F0]" />
                <span className="flex-1 text-left">Live Monitoring</span>
                <span className="text-[10px] font-mono text-[#9896B0]">/monitoring</span>
              </button>

              {/* 3. Switch Demo Account Accordion */}
              <div className="pt-1 border-t border-[#C4B5FD]/10">
                <button
                  type="button"
                  onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542] transition-colors"
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#C4B5FD]" />
                    <span>Switch Demo Persona</span>
                  </div>
                  {showSwitchMenu ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#9896B0]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#9896B0]" />
                  )}
                </button>

                {showSwitchMenu && (
                  <div className="mt-1 mb-1 px-1.5 py-1.5 rounded-xl bg-[#11111F]/70 border border-[#C4B5FD]/12 space-y-1 animate-fade-in">
                    {DEMO_PERSONAS.map((persona) => {
                      const isCurrent = user?.email === persona.email;
                      const badge = ROLE_BADGES[persona.role];
                      return (
                        <button
                          key={persona.email}
                          type="button"
                          disabled={isSwitching || isCurrent}
                          onClick={() => handleSwitchAccount(persona.email)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                            isCurrent
                              ? 'bg-[#252542] text-[#F5F3FF] font-semibold border border-[#9B7BFF]/40'
                              : 'text-[#9896B0] hover:text-[#F5F3FF] hover:bg-[#202038]'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="text-[11px] font-bold truncate text-[#F5F3FF]">
                              {persona.name} {isCurrent && '✓'}
                            </div>
                            <div className="text-[9px] font-mono text-[#9896B0] truncate">
                              {persona.email}
                            </div>
                          </div>
                          <span
                            className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase shrink-0"
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color,
                              borderColor: badge.border,
                              borderWidth: '1px',
                            }}
                          >
                            {badge.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Sign Out */}
              <div className="pt-1 border-t border-[#C4B5FD]/10">
                <button
                  type="button"
                  id="profile-dropdown-logout"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#FB7185] hover:bg-[#FB7185]/15 border border-transparent hover:border-[#FB7185]/20 transition-all"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">Disconnect Session</span>
                  <span className="text-[10px] font-mono text-[#FB7185]/70">Sign out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
