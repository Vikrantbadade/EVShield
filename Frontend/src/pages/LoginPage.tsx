import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Terminal,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService, DemoAccount, UserRole } from '../services/authService';
import { BackgroundPaths } from '../components/ui/BackgroundPaths';
import { EVShieldLogo } from '../components/ui/EVShieldLogo';

const DEMO_PASSWORD = 'EVShieldDemo@2026';

const ROLE_BADGES: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
  admin: {
    label: 'ADMINISTRATOR',
    color: '#FB7185',
    bg: 'rgba(251, 113, 133, 0.15)',
    border: 'rgba(251, 113, 133, 0.35)',
  },
  security_analyst: {
    label: 'SECURITY ANALYST',
    color: '#9B7BFF',
    bg: 'rgba(155, 123, 255, 0.16)',
    border: 'rgba(155, 123, 255, 0.35)',
  },
  soc_operator: {
    label: 'SOC OPERATOR',
    color: '#4DD9F0',
    bg: 'rgba(77, 217, 240, 0.15)',
    border: 'rgba(77, 217, 240, 0.35)',
  },
  viewer: {
    label: 'VIEWER (READ-ONLY)',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.35)',
  },
};

export const LoginPage: React.FC = () => {
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collapsible demo accounts panel
  const [demoOpen, setDemoOpen] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [selectedDemoRole, setSelectedDemoRole] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Load demo accounts from backend
  useEffect(() => {
    authService
      .getDemoAccounts()
      .then((accounts) => setDemoAccounts(accounts))
      .catch(() => {
        setDemoAccounts([
          {
            email: 'admin@evshield.demo',
            name: 'Admin',
            role: 'admin',
            description: 'Full administration and system management',
          },
          {
            email: 'analyst@evshield.demo',
            name: 'Security Analyst',
            role: 'security_analyst',
            description: 'Incident investigation, logs, telemetry, and ML analysis',
          },
          {
            email: 'operator@evshield.demo',
            name: 'SOC Operator',
            role: 'soc_operator',
            description: 'Live monitoring, alert acknowledgement, and response actions',
          },
          {
            email: 'viewer@evshield.demo',
            name: 'Viewer',
            role: 'viewer',
            description: 'Read-only monitoring and reporting',
          },
        ]);
      });
  }, []);

  const handleSelectDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setSelectedDemoRole(account.role);
    setErrorMsg(null);
    setSuccessMsg(`Autofilled ${account.name} credentials. Click "Sign In" to authenticate.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both email and password.');
        }
        await login(email.trim(), password);
      } else {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error('Please fill in all registration fields.');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        await signup(name.trim(), email.trim(), password);
      }
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#11111F] text-[#F5F3FF] font-sans selection:bg-[#9B7BFF]/30 selection:text-[#F5F3FF] relative">
      {/* ── Kokonut UI Background Paths (Mounted ONLY on this page) ── */}
      <BackgroundPaths
        lineColor="#9B7BFF"
        count={52}
        spread={1.2}
        speed={1.0}
        angle={-8}
        className="bg-[#11111F]"
      >
        {/* Top Header */}
        <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-20">
          <Link to="/" className="transition-opacity hover:opacity-85">
            <EVShieldLogo size="md" />
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1D1D35]/80 hover:bg-[#252542] border border-[#C4B5FD]/16 text-xs font-mono text-[#C4C2D6] hover:text-[#F5F3FF] transition-all shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </Link>
        </header>

        {/* Center: Clean, Compact Authentication Card */}
        <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 sm:py-8 flex flex-col justify-center z-20">
          <div className="rounded-3xl bg-[#1D1D35]/90 border border-[#C4B5FD]/20 shadow-2xl shadow-black/60 backdrop-blur-xl p-6 sm:p-7 relative transition-all">
            {/* Header inside card */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#F5F3FF] tracking-tight">
                  {mode === 'login' ? 'Operator Sign In' : 'Create Account'}
                </h1>
                <p className="text-xs font-mono text-[#9896B0] mt-1">
                  {mode === 'login' ? 'Authenticate into SOC Console' : 'Register operator account'}
                </p>
              </div>

              {/* Mode Tabs */}
              <div className="flex p-1 rounded-xl bg-[#11111F] border border-[#C4B5FD]/16">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'login'
                      ? 'bg-[#8055F6] text-white shadow-md shadow-[#8055F6]/30'
                      : 'text-[#9896B0] hover:text-[#F5F3FF]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'signup'
                      ? 'bg-[#8055F6] text-white shadow-md shadow-[#8055F6]/30'
                      : 'text-[#9896B0] hover:text-[#F5F3FF]'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Alert Feedback */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-xs font-mono text-[#FB7185] flex items-start gap-2.5 animate-fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error:</span> {errorMsg}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-[#34D399]/15 border border-[#34D399]/30 text-xs font-mono text-[#34D399] flex items-start gap-2.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{successMsg}</div>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-mono font-medium text-[#C4C2D6] mb-1 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9896B0]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#11111F]/90 border border-[#C4B5FD]/20 text-sm text-[#F5F3FF] placeholder-[#9896B0]/60 focus:outline-none focus:border-[#9B7BFF] focus:ring-1 focus:ring-[#9B7BFF] transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono font-medium text-[#C4C2D6] mb-1 uppercase tracking-wider">
                  Operator Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9896B0]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSelectedDemoRole(null);
                    }}
                    placeholder="operator@evshield.demo"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#11111F]/90 border border-[#C4B5FD]/20 text-sm text-[#F5F3FF] placeholder-[#9896B0]/60 focus:outline-none focus:border-[#9B7BFF] focus:ring-1 focus:ring-[#9B7BFF] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono font-medium text-[#C4C2D6] uppercase tracking-wider">
                    Password
                  </label>
                  {mode === 'login' && (
                    <span className="text-[11px] font-mono text-[#9B7BFF]">EVShield Demo Key</span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9896B0]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#11111F]/90 border border-[#C4B5FD]/20 text-sm text-[#F5F3FF] placeholder-[#9896B0]/60 focus:outline-none focus:border-[#9B7BFF] focus:ring-1 focus:ring-[#9B7BFF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9896B0] hover:text-[#F5F3FF] transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div className="p-2.5 rounded-xl bg-[#252542]/70 border border-[#C4B5FD]/16 text-[11px] font-mono text-[#C4C2D6]">
                  <span className="text-[#9B7BFF] font-bold">Policy:</span> New public registrations receive least-privileged <span className="text-[#34D399] font-semibold">Viewer</span> access.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#8055F6] to-[#9B7BFF] hover:from-[#9B7BFF] hover:to-[#8055F6] text-white shadow-lg shadow-[#8055F6]/25 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'ENTER SOC CONSOLE' : 'CREATE ACCOUNT'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Collapsible Demo Accounts Panel */}
            <div className="mt-5 pt-4 border-t border-[#C4B5FD]/16">
              <button
                type="button"
                onClick={() => setDemoOpen(!demoOpen)}
                className="w-full flex items-center justify-between text-xs font-mono text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#4DD9F0]" />
                  <span className="font-bold text-[#F5F3FF]">DEMO LAB ACCOUNTS</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#8055F6]/20 text-[10px] text-[#C4B5FD]">4 ROLES</span>
                </div>
                {demoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {demoOpen && (
                <div className="mt-2.5 space-y-1.5 animate-fade-in">
                  <p className="text-[10px] text-[#9896B0] font-mono">
                    Select an identity to autofill credentials (<span className="text-[#C4B5FD]">requires manual sign in</span>):
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {demoAccounts.map((account) => {
                      const badge = ROLE_BADGES[account.role] || ROLE_BADGES.viewer;
                      const isSelected = selectedDemoRole === account.role;

                      return (
                        <button
                          key={account.email}
                          type="button"
                          onClick={() => handleSelectDemo(account)}
                          className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#252542] border-[#9B7BFF] shadow-md shadow-[#9B7BFF]/20'
                              : 'bg-[#11111F]/70 border-[#C4B5FD]/12 hover:border-[#9B7BFF]/40 hover:bg-[#252542]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-xs font-bold text-[#F5F3FF] truncate">{account.name}</span>
                            <span
                              className="px-1.5 py-0.2 rounded text-[8px] font-mono font-semibold"
                              style={{
                                backgroundColor: badge.bg,
                                color: badge.color,
                                borderColor: badge.border,
                                borderWidth: '1px',
                              }}
                            >
                              {badge.label.split(' ')[0]}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[#9896B0] truncate">
                            {account.email}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#9896B0] border-t border-[#C4B5FD]/12 gap-2 z-20">
          <div className="flex items-center gap-2">
            <span>EVShield SOC Platform</span>
            <span>•</span>
            <span className="text-[#9B7BFF]">v1.0 Production Lab</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <Link to="/" className="hover:text-[#F5F3FF] transition-colors">
              Platform Overview
            </Link>
            <span>•</span>
            <span className="text-[#4DD9F0]">Telemetry Stream Active</span>
          </div>
        </footer>
      </BackgroundPaths>
    </div>
  );
};
