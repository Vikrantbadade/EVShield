import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity, Cpu, ShieldAlert, Server,
  ArrowRight, Globe, ChevronRight, CheckCircle2, X, Menu, Car, BatteryCharging, User
} from 'lucide-react';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { CountUp } from '../components/ui/CountUp';
import { EVShieldLogo } from '../components/ui/EVShieldLogo';

/* ── Types ── */
interface NavLink { label: string; href: string; }
const navLinks: NavLink[] = [
  { label: 'Platform',       href: '#features'   },
  { label: 'Protection',     href: '#protection' },
  { label: 'ML Detection',   href: '#ml'         },
  { label: 'Infrastructure', href: '#infra'      },
];

/* ── Floating Glass Navbar ── */
const LandingNav: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 px-4 sm:px-6 ${
        scrolled ? 'pt-3' : 'pt-5'
      }`}
    >
      <nav
        className={`glass-nav rounded-2xl w-full max-w-6xl flex items-center justify-between px-5 py-3 transition-all duration-300 ${
          scrolled ? 'shadow-glass' : ''
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <EVShieldLogo size="sm" />
        </Link>

        {/* Center links — desktop only */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <a
              key={l.label}
              href={l.href}
              className="px-4 py-1.5 rounded-xl text-sm font-medium text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542]/70 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <StatusChip label="SYSTEM OPERATIONAL" variant="live" dot pulse />
          <Link
            to="/login"
            title="Account / Sign In"
            className="p-2 rounded-xl bg-[#252542] hover:bg-[#303052] border border-[#C4B5FD]/16 text-[#C4C2D6] hover:text-[#F5F3FF] transition-all shadow-sm"
          >
            <User className="w-4 h-4" />
          </Link>
          <button
            onClick={onEnter}
            className="btn-primary py-2 px-5 text-xs rounded-xl"
          >
            ACCESS SOC CONSOLE <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-[#C4C2D6] hover:bg-[#252542]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="glass-cream absolute top-full mt-2 left-4 right-4 rounded-2xl p-5 md:hidden z-50 animate-slide-in-down shadow-glass border border-[#C4B5FD]/20">
          <div className="flex flex-col gap-1 mb-5">
            {navLinks.map(l => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#F5F3FF] hover:bg-[#252542] transition-colors"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#9B7BFF] hover:bg-[#252542] transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" /> Sign In to Console
            </Link>
          </div>
          <button onClick={() => { setMenuOpen(false); onEnter(); }} className="btn-primary w-full justify-center text-sm rounded-xl py-3">
            ACCESS SOC CONSOLE <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};

/* ── EV Ecosystem Visualization ── */
const EVNetworkViz: React.FC = () => (
  <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] max-w-2xl mx-auto select-none">
    {/* Multi-colored background glow blobs */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-64 h-64 rounded-full bg-[#8055F6]/15 blur-[80px] animate-pulse-slow" />
      <div className="absolute w-52 h-52 rounded-full bg-[#9B7BFF]/15 blur-[60px] animate-float-blob-1" />
      <div className="absolute w-48 h-48 rounded-full bg-[#4DD9F0]/10 blur-[70px] animate-float-blob-2" />
    </div>

    {/* Connection lines */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 375">
      {[
        { x1:90,  y1:95,  x2:210, y2:185 },
        { x1:410, y1:95,  x2:290, y2:185 },
        { x1:90,  y1:280, x2:210, y2:195 },
        { x1:410, y1:280, x2:290, y2:195 },
        { x1:250, y1:50,  x2:250, y2:170 },
      ].map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="url(#warmLineGrad)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity="0.65"
          style={{ animation: `drawLine 1.5s ${i * 0.2}s ease-out forwards`, strokeDashoffset: 300 }}
        />
      ))}
      <defs>
        <linearGradient id="warmLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8055F6" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#9B7BFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#4DD9F0" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </svg>

    {/* Central EV Charging Centerpiece */}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <div className="glass-cream rounded-3xl px-6 py-5 flex flex-col items-center gap-2 shadow-glow-violet border border-[#C4B5FD]/20">
        <div className="p-3.5 rounded-2xl bg-[#8055F6]/15 border border-[#8055F6]/30">
          <BatteryCharging className="w-8 h-8 text-[#9B7BFF]" />
        </div>
        <span className="font-mono text-[11px] font-bold text-[#F5F3FF] tracking-wider">EVSHIELD CORE</span>
        <StatusChip label="PROTECTED" variant="protected" dot pulse />
      </div>
    </div>

    {/* Outer Translucent Nodes */}
    {[
      { label: 'CS Gateway',     icon: Server,          x: 'left-4',   y: 'top-6',    variant: 'glass-sand',  color: 'text-[#9B7BFF]' },
      { label: 'Auth Layer',     icon: ShieldAlert,     x: 'right-4', y: 'top-6',   variant: 'glass-peach', color: 'text-[#C4B5FD]' },
      { label: 'EV Fleet',       icon: Car,              x: 'left-4',  y: 'bottom-6', variant: 'glass-cream', color: 'text-[#4DD9F0]' },
      { label: 'Secure Network', icon: Globe,            x: 'right-4', y: 'bottom-6', variant: 'glass-blue',  color: 'text-[#38BDF8]' },
      { label: 'ML Detection',   icon: Cpu,              x: 'left-1/2 -translate-x-1/2', y: 'top-1', variant: 'glass-taupe', color: 'text-[#9B7BFF]' },
    ].map(({ label, icon: Icon, x, y, variant, color }) => (
      <div
        key={label}
        className={`absolute ${x} ${y} ${variant} rounded-2xl px-3.5 py-2.5 flex flex-col items-center gap-1 shadow-glass-sm animate-node-pulse border border-[#C4B5FD]/16`}
      >
        <div className="p-1.5 rounded-lg bg-[#252542] border border-[#C4B5FD]/16">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="font-mono text-[9px] font-bold text-[#C4C2D6] whitespace-nowrap">{label}</span>
      </div>
    ))}
  </div>
);

/* ── Bento-Style Feature Cards ── */
const features = [
  {
    n: '01',
    title: 'Continuous Monitoring',
    body: 'Monitor EV charging authentication activity in real time across gateway nodes.',
    Icon: Activity,
    variant: 'cream' as const,
    accent: '#9B7BFF',
  },
  {
    n: '02',
    title: 'ML-Powered Detection',
    body: 'Identify abnormal traffic patterns using the EVShield ML detection engine.',
    Icon: Cpu,
    variant: 'peach' as const,
    accent: '#C4B5FD',
  },
  {
    n: '03',
    title: 'Rapid Threat Visibility',
    body: 'Surface warnings, incidents, affected infrastructure and security events instantly.',
    Icon: ShieldAlert,
    variant: 'sand' as const,
    accent: '#4DD9F0',
  },
  {
    n: '04',
    title: 'Infrastructure Awareness',
    body: 'Understand how security events affect your EV charging ecosystem.',
    Icon: Server,
    variant: 'taupe' as const,
    accent: '#8055F6',
  },
];

/* ── Pipeline Steps ── */
const pipeline = [
  { label: 'Authentication Traffic', sub: 'EV charging gateway telemetry' },
  { label: 'ML Analysis',            sub: 'Feature extraction & classification' },
  { label: 'Threat Classification',  sub: 'Normal / Attack determination' },
  { label: 'Security Alert',         sub: 'Dashboard notification & toast' },
  { label: 'Incident Analysis',      sub: 'Affected nodes & timeline sequence' },
];

/* ── Infrastructure City Nodes ── */
const cities = [
  { name: 'Mumbai',    nodes: 312, x: '20%', y: '60%', bg: 'glass-peach', color: '#9B7BFF' },
  { name: 'Delhi',     nodes: 284, x: '38%', y: '18%', bg: 'glass-sand',  color: '#C4B5FD' },
  { name: 'Bengaluru', nodes: 256, x: '35%', y: '75%', bg: 'glass-cyan',  color: '#4DD9F0' },
  { name: 'Pune',      nodes: 178, x: '28%', y: '58%', bg: 'glass-blue',  color: '#38BDF8' },
  { name: 'Hyderabad', nodes: 218, x: '42%', y: '55%', bg: 'glass-taupe', color: '#8055F6' },
];

/* ── Event Scenario Cards ── */
const events = [
  { tag: 'NORMAL ACTIVITY',     variant: 'live' as const,     glassVariant: 'cream' as const, time: '09:42', text: 'Authentication traffic stable across all regional charging gateways.' },
  { tag: 'SUSPICIOUS ACTIVITY', variant: 'threat' as const,   glassVariant: 'sand' as const,  time: '11:17', text: 'Traffic deviation & handshake retry rate spike detected at CS-0421.' },
  { tag: 'DDOS DETECTED',       variant: 'critical' as const, glassVariant: 'peach' as const, time: '12:04', text: 'ML inference engine classified high-density authentication payload flood.' },
  { tag: 'THREAT MITIGATED',    variant: 'protected' as const, glassVariant: 'taupe' as const, time: '12:07', text: 'Automated IP rate limiting enforced. Traffic returned to expected range.' },
];

/* ── Main Landing Page ── */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const enter = () => navigate('/login');

  return (
    <div className="min-h-screen warm-bg-canvas font-sans text-[#F5F3FF]">
      <LandingNav onEnter={enter} />

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: Copy */}
            <div className="space-y-8 animate-slide-in-up">
              <div className="flex items-center gap-3">
                <StatusChip label="EV INFRASTRUCTURE SECURITY" variant="live" dot pulse />
              </div>

              <div className="space-y-5">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-[#F5F3FF]">
                  Protect every<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9B7BFF] via-[#8055F6] to-[#4DD9F0]">
                    charge.
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-[#C4C2D6] leading-relaxed max-w-lg font-normal">
                  EVShield monitors EV charging authentication traffic and uses machine-learning-powered detection to identify abnormal and DDoS-related activity.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <button onClick={enter} className="btn-primary rounded-xl text-sm py-3.5 px-7">
                  ACCESS SOC CONSOLE
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-secondary rounded-xl text-sm py-3.5 px-6"
                >
                  EXPLORE EVSHIELD
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Stat row with CountUp */}
              <div className="flex flex-wrap gap-8 pt-4 border-t border-[#C4B5FD]/16">
                <div>
                  <div className="text-2xl font-extrabold font-mono text-[#F5F3FF]">
                    <CountUp end={1250} suffix="+" />
                  </div>
                  <div className="text-xs text-[#9896B0] mt-0.5">Charging Stations</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold font-mono text-[#4DD9F0]">
                    <CountUp end={96.8} decimals={1} suffix="%" />
                  </div>
                  <div className="text-xs text-[#9896B0] mt-0.5">ML Accuracy (DEMO)</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold font-mono text-[#9B7BFF]">
                    <CountUp end={18450} suffix=" req/s" />
                  </div>
                  <div className="text-xs text-[#9896B0] mt-0.5">Peak throughput monitored</div>
                </div>
              </div>
            </div>

            {/* Right: EV Network Visualization */}
            <div className="hidden lg:block animate-fade-in">
              <div className="glass-cream rounded-[40px] p-8 shadow-glass border border-[#C4B5FD]/20">
                <EVNetworkViz />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES (Bento Grid with Glass Variations) ───────── */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <ScrollReveal>
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="font-mono text-xs font-semibold tracking-widest text-[#9B7BFF] uppercase">Capabilities</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F5F3FF]">
                Defense built for EV grids.
              </h2>
              <p className="text-[#C4C2D6]">
                Modern EV charging infrastructure combines cloud systems with field hardware. EVShield gives operators full visibility into that surface.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ n, title, body, Icon, variant, accent }, i) => (
              <ScrollReveal key={n} delay={i * 80}>
                <div className={`glass-${variant} rounded-3xl p-7 flex flex-col justify-between h-full space-y-6 shadow-glass-sm hover:-translate-y-1.5 transition-all duration-300 border border-[#C4B5FD]/16`}>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#252542] border border-[#C4B5FD]/20 flex items-center justify-center">
                      <Icon className="w-5 h-5" style={{ color: accent }} />
                    </div>
                    <span className="font-mono text-xs font-bold text-[#9896B0]">{n}</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-[#F5F3FF] tracking-tight">{title}</h3>
                    <p className="text-sm text-[#C4C2D6] leading-relaxed">{body}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW PROTECTION WORKS (Pipeline) ───────────────────── */}
      <section id="protection" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <ScrollReveal>
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="font-mono text-xs font-semibold tracking-widest text-[#9B7BFF] uppercase">Pipeline</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F5F3FF]">
                How EVShield detects threats.
              </h2>
              <p className="text-[#C4C2D6]">From raw charging station authentication traffic to actionable security alerts in seconds.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {pipeline.map((p, i) => (
                <div
                  key={p.label}
                  className="glass-card rounded-2xl p-5 space-y-3 shadow-glass-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#9B7BFF]">STEP 0{i + 1}</span>
                    <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-[#F5F3FF]">{p.label}</div>
                    <div className="text-xs text-[#9896B0] leading-relaxed">{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── INFRASTRUCTURE MAP (Conceptual) ──────────────────── */}
      <section id="infra" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <ScrollReveal>
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="font-mono text-xs font-semibold tracking-widest text-[#9B7BFF] uppercase">Infrastructure</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F5F3FF]">
                Protected EV charging hubs.
              </h2>
              <p className="text-[#C4C2D6]">Simulated regional charging hub nodes actively reporting authentication traffic telemetry.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="glass-card rounded-[36px] p-8 sm:p-12 shadow-glass border border-[#C4B5FD]/16">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {cities.map(c => (
                  <div key={c.name} className={`${c.bg} rounded-2xl p-4 text-center space-y-1 border border-[#C4B5FD]/16`}>
                    <div className="font-bold text-sm text-[#F5F3FF]">{c.name}</div>
                    <div className="font-mono text-xs text-[#4DD9F0]">{c.nodes} stations</div>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-[#34D399]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                      Active
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-[#9896B0] mt-6 font-mono">Conceptual visualization — synthetic infrastructure telemetry</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── SECURITY EVENTS ────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F5F3FF]">
                  See threats as they happen.
                </h2>
                <p className="text-[#C4C2D6]">Historical security scenario timeline — demo records.</p>
              </div>
              <StatusChip label="DEMO SCENARIO LOG" variant="demo" />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">
              {events.map(({ tag, variant, glassVariant, time, text }) => (
                <div
                  key={tag}
                  className={`glass-${glassVariant} rounded-3xl p-7 shrink-0 w-72 sm:w-80 snap-start space-y-4 shadow-glass-sm hover:-translate-y-1 transition-all duration-300 border border-[#C4B5FD]/16`}
                >
                  <div className="flex items-center justify-between">
                    <StatusChip label={tag} variant={variant} />
                    <span className="font-mono text-xs text-[#C4B5FD] font-bold">{time}</span>
                  </div>
                  <p className="text-sm text-[#C4C2D6] leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="glass-cream rounded-[40px] p-12 sm:p-16 text-center space-y-8 relative overflow-hidden shadow-glass border border-[#C4B5FD]/20">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#8055F6]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 left-1/4 w-48 h-48 bg-[#9B7BFF]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F5F3FF]">
                  Ready to secure the electric future?
                </h2>
                <p className="text-lg text-[#C4C2D6] max-w-xl mx-auto leading-relaxed">
                  Enter the EVShield security console and explore the charging infrastructure protection layer.
                </p>
                <button onClick={enter} className="btn-primary rounded-xl text-sm py-3.5 px-8 mx-auto">
                  ACCESS SOC CONSOLE
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-[#C4B5FD]/12 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div className="space-y-2">
            <EVShieldLogo size="sm" />
            <p className="text-xs text-[#9896B0]">Intelligent security for EV infrastructure.</p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-[#C4C2D6]">
            {['Platform', 'Security', 'ML Detection', 'Infrastructure'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-[#F5F3FF] transition-colors">{l}</a>
            ))}
            <Link to="/login" className="hover:text-[#9B7BFF] transition-colors font-semibold">
              SOC Login
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <StatusChip label="SYSTEM OPERATIONAL" variant="live" dot pulse />
            <StatusChip label="DEMO ENV" variant="demo" />
          </div>
        </div>
      </footer>
    </div>
  );
};
