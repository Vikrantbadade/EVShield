import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheck, Zap, LayoutDashboard, Activity, FileText,
  Search, Server, Cpu, BarChart3, Bell, Settings, CheckCircle2, X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navItems = [
  { name: 'Overview',          path: '/dashboard',        icon: LayoutDashboard },
  { name: 'Live Monitoring',   path: '/monitoring',       icon: Activity        },
  { name: 'Attack Logs',       path: '/logs',             icon: FileText        },
  { name: 'Attack Analysis',   path: '/analysis',         icon: Search          },
  { name: 'Charging Network',  path: '/charging-network', icon: Server          },
  { name: 'ML Detection',      path: '/ml-detection',     icon: Cpu             },
  { name: 'Analytics',         path: '/analytics',        icon: BarChart3       },
  { name: 'Alerts',            path: '/alerts',           icon: Bell            },
  { name: 'Settings',          path: '/settings',         icon: Settings        },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#3F3832]/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 glass-sidebar ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#AD8B73]/15">
          <NavLink to="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="relative w-9 h-9 rounded-xl bg-[#AD8B73]/15 border border-[#AD8B73]/30 flex items-center justify-center shrink-0 shadow-glass-sm">
              <ShieldCheck className="w-4.5 h-4.5 text-[#19BFA3]" />
              <Zap className="w-2.5 h-2.5 text-[#CEAB93] absolute bottom-0.5 right-0.5" />
            </div>
            <div>
              <div className="font-extrabold text-[15px] tracking-tight text-[#3F3832]">EVShield</div>
              <div className="text-[10px] font-mono text-[#7A7067] tracking-wider uppercase">SOC Platform</div>
            </div>
          </NavLink>
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#7A7067] hover:bg-[#AD8B73]/10 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#CEAB93]/28 text-[#3F3832] border border-[#CEAB93]/45 shadow-glass-sm font-semibold'
                    : 'text-[#514940] hover:text-[#3F3832] hover:bg-white/40'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-[#AD8B73]" />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#AD8B73]/15 space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#62C073]/12 border border-[#62C073]/25 text-xs font-mono text-[#2b703b]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#62C073]" />
            <span>● All systems operational</span>
          </div>
          <div className="flex items-center justify-between px-1 text-[10px] font-mono text-[#7A7067]">
            <span>EVShield SOC</span>
            <span className="px-2 py-0.5 rounded-full bg-[#AD8B73]/12 text-[#514940] border border-[#AD8B73]/20">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
