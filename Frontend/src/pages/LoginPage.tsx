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
import { authService, DemoAccount, UserRole, DEMO_PASSWORD } from '../services/authService';
import { BackgroundPaths } from '../components/ui/BackgroundPaths';
import { EVShieldLogo } from '../components/ui/EVShieldLogo';

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

export const LoginPage: React.FC = () => {
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Form fields (controlled React state)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collapsible demo accounts panel
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [selectedDemoRole, setSelectedDemoRole] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Handle prefilled email & password from demo persona switch
  useEffect(() => {
    const prefill = (location.state as { prefillEmail?: string })?.prefillEmail;
    if (prefill) {
      setEmail(prefill);
      setPassword(DEMO_PASSWORD);
      setSelectedDemoRole(
        prefill.includes('admin')
          ? 'admin'
          : prefill.includes('analyst')
          ? 'security_analyst'
          : prefill.includes('operator')
          ? 'soc_operator'
          : prefill.includes('viewer')
          ? 'viewer'
          : null
      );
      setSuccessMsg(`Populated ${prefill} credentials. Click Authenticate.`);
    }
  }, [location.state]);

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
            description: 'Incident investigation and ML analysis',
          },
          {
            email: 'operator@evshield.demo',
            name: 'SOC Operator',
            role: 'soc_operator',
            description: 'Live monitoring and response actions',
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
    setSuccessMsg(`Populated ${account.name} credentials. Click Authenticate.`);
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
    <div className="min-h-screen bg-[#0D0D18] text-[#F5F3FF] font-sans selection:bg-[#9B7BFF]/30 selection:text-[#F5F3FF] relative flex flex-col">
      {/* ── Kokonut UI Background Paths (Mounted ONLY on auth pages) ── */}
      <BackgroundPaths
        lineColor="#9B7BFF"
        count={50}
        spread={1.2}
        speed={1.0}
        angle={-8}
        className="bg-[#0D0D18] flex-1 flex flex-col justify-between py-6"
      >
        {/* Top Header */}
        <header className="w-full max-w-5xl mx-auto px-6 flex items-center justify-between z-20">
          <Link to="/" className="transition-opacity hover:opacity-90 flex items-center">
            <EVShieldLogo size="sm" />
          </Link>

          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#17172B]/40 hover:bg-[#17172B]/70 border border-[#C4B5FD]/16 text-xs text-[#C4C2D6] hover:text-[#F5F3FF] transition-all backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>
        </header>

        {/* Center: Genuine Liquid-Glass Authentication Card */}
        <main className="w-full max-w-[460px] mx-auto px-4 py-8 flex flex-col justify-center z-20 my-auto">
          <div
            className="rounded-3xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300"
            style={{
              background: 'rgba(23, 23, 43, 0.30)',
              backdropFilter: 'blur(16px) saturate(140%)',
              WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              border: '1px solid rgba(196, 181, 253, 0.22)',
              boxShadow:
                '0 24px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 0 24px rgba(128, 85, 246, 0.05)',
            }}
          >
            {/* Top specular edge reflection */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C4B5FD]/40 to-transparent pointer-events-none" />

            {/* Header: Title & Switch */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl font-bold text-[#F5F3FF] tracking-tight">
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </h1>
                <p className="text-xs text-[#9896B0] mt-0.5">
                  {mode === 'login' ? 'EVShield Operations Console' : 'Register Operator Profile'}
                </p>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex p-0.5 rounded-xl bg-[#121224]/50 backdrop-blur-md border border-[#C4B5FD]/16">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'login'
                      ? 'bg-[#8055F6] text-white shadow-sm shadow-[#8055F6]/40'
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
                      ? 'bg-[#8055F6] text-white shadow-sm shadow-[#8055F6]/40'
                      : 'text-[#9896B0] hover:text-[#F5F3FF]'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Feedback Banners */}
            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-xs text-[#FB7185] flex items-start gap-2 animate-fade-in backdrop-blur-md">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-[#34D399]/15 border border-[#34D399]/30 text-xs text-[#34D399] flex items-start gap-2 animate-fade-in backdrop-blur-md">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{successMsg}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-[#C4C2D6] mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9896B0]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Security Officer"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#121226]/50 border border-[#C4B5FD]/18 text-sm text-[#F5F3FF] placeholder-[#9896B0]/50 focus:outline-none focus:border-[#9B7BFF] focus:bg-[#121226]/70 focus:ring-1 focus:ring-[#9B7BFF]/40 transition-all backdrop-blur-md"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#C4C2D6] mb-1">Operator Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9896B0]">
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
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#121226]/50 border border-[#C4B5FD]/18 text-sm text-[#F5F3FF] placeholder-[#9896B0]/50 focus:outline-none focus:border-[#9B7BFF] focus:bg-[#121226]/70 focus:ring-1 focus:ring-[#9B7BFF]/40 transition-all backdrop-blur-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C4C2D6] mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9896B0]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#121226]/50 border border-[#C4B5FD]/18 text-sm text-[#F5F3FF] placeholder-[#9896B0]/50 focus:outline-none focus:border-[#9B7BFF] focus:bg-[#121226]/70 focus:ring-1 focus:ring-[#9B7BFF]/40 transition-all backdrop-blur-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9896B0] hover:text-[#F5F3FF] transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <p className="text-[11px] text-[#9896B0]">
                  New registrations automatically assign least-privileged <span className="text-[#34D399]">Viewer</span> access.
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#8055F6] to-[#9B7BFF] hover:from-[#9B7BFF] hover:to-[#8055F6] text-white shadow-lg shadow-[#8055F6]/25 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Authenticate' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Compact Collapsible Demo Accounts Section */}
            <div className="mt-4 pt-3.5 border-t border-[#C4B5FD]/14">
              <button
                type="button"
                onClick={() => setDemoOpen(!demoOpen)}
                className="w-full flex items-center justify-between text-xs text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#4DD9F0]" />
                  <span className="font-semibold text-[#F5F3FF]">Demo accounts</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#8055F6]/20 text-[10px] text-[#C4B5FD]">4 roles</span>
                </div>
                {demoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {demoOpen && (
                <div className="mt-2.5 space-y-1.5 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    {demoAccounts.map((account) => {
                      const badge = ROLE_BADGES[account.role] || ROLE_BADGES.viewer;
                      const isSelected = selectedDemoRole === account.role;

                      return (
                        <button
                          key={account.email}
                          type="button"
                          onClick={() => handleSelectDemo(account)}
                          className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between backdrop-blur-md ${
                            isSelected
                              ? 'bg-[#8055F6]/20 border-[#9B7BFF] shadow-sm ring-1 ring-[#9B7BFF]/40'
                              : 'bg-[#121226]/40 border-[#C4B5FD]/16 hover:border-[#9B7BFF]/40 hover:bg-[#121226]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-xs font-bold text-[#F5F3FF] truncate">{account.name}</span>
                            <span
                              className="px-1 py-0.2 rounded text-[8px] font-mono font-bold"
                              style={{
                                backgroundColor: badge.bg,
                                color: badge.color,
                                borderColor: badge.border,
                                borderWidth: '1px',
                              }}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[#9896B0] truncate">{account.email}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </BackgroundPaths>
    </div>
  );
};
