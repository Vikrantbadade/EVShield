import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, Zap, Activity, Cpu, ShieldAlert, Server,
  ArrowRight, Globe, ChevronRight, CheckCircle2, X, Menu, Car, BatteryCharging
} from 'lucide-react';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { CountUp } from '../components/ui/CountUp';

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
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-8.5 h-8.5 rounded-xl bg-[#AD8B73]/15 border border-[#AD8B73]/30 flex items-center justify-center shadow-glass-sm">
            <ShieldCheck className="w-4.5 h-4.5 text-[#19BFA3]" />
            <Zap className="w-2.5 h-2.5 text-[#CEAB93] absolute bottom-0.5 right-0.5" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#3F3832]">EVShield</span>
        </Link>

        {/* Center links — desktop only */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <a
              key={l.label}
              href={l.href}
              className="px-4 py-1.5 rounded-xl text-sm font-medium text-[#514940] hover:text-[#3F3832] hover:bg-white/40 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <StatusChip label="SYSTEM OPERATIONAL" variant="live" dot pulse />
          <button
            onClick={onEnter}
            className="btn-primary py-2 px-5 text-xs rounded-xl"
          >
            ENTER CONSOLE <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-[#514940] hover:bg-black/[0.04]"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="glass-cream absolute top-full mt-2 left-4 right-4 rounded-2xl p-5 md:hidden z-50 animate-slide-in-down shadow-glass">
          <div className="flex flex-col gap-1 mb-5">
            {navLinks.map(l => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#3F3832] hover:bg-white/50 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
          <button onClick={() => { setMenuOpen(false); onEnter(); }} className="btn-primary w-full justify-center text-sm rounded-xl py-3">
            ENTER SECURITY CONSOLE <ArrowRight className="w-4 h-4" />
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
      <div className="w-64 h-64 rounded-full bg-[#AD8B73]/20 blur-[80px] animate-pulse-slow" />
      <div className="absolute w-52 h-52 rounded-full bg-[#CEAB93]/25 blur-[60px] animate-float-blob-1" />
      <div className="absolute w-48 h-48 rounded-full bg-[#E3CAA5]/28 blur-[70px] animate-float-blob-2" />
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
          <stop offset="0%" stopColor="#AD8B73" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#CEAB93" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#19BFA3" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </svg>

    {/* Central EV Charging Centerpiece */}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <div className="glass-cream rounded-3xl px-6 py-5 flex flex-col items-center gap-2 shadow-glow-peach border border-white/90">
        <div className="p-3.5 rounded-2xl bg-[#AD8B73]/15 border border-[#AD8B73]/30">
          <BatteryCharging className="w-8 h-8 text-[#AD8B73]" />
        </div>
        <span className="font-mono text-[11px] font-bold text-[#3F3832] tracking-wider">EVSHIELD CORE</span>
        <StatusChip label="PROTECTED" variant="protected" dot pulse />
      </div>
    </div>

    {/* Outer Translucent Nodes */}
    {[
      { label: 'CS Gateway',     icon: Server,          x: 'left-4',   y: 'top-6',    variant: 'glass-sand',  color: 'text-[#AD8B73]' },
      { label: 'Auth Layer',     icon: ShieldAlert,     x: 'right-4', y: 'top-6',   variant: 'glass-peach', color: 'text-[#CEAB93]' },
      { label: 'EV Fleet',       icon: Car,              x: 'left-4',  y: 'bottom-6', variant: 'glass-cream', color: 'text-[#19BFA3]' },
      { label: 'Secure Network', icon: Globe,            x: 'right-4', y: 'bottom-6', variant: 'glass-blue',  color: 'text-[#52A8FF]' },
      { label: 'ML Detection',   icon: Cpu,              x: 'left-1/2 -translate-x-1/2', y: 'top-1', variant: 'glass-taupe', color: 'text-[#AD8B73]' },
    ].map(({ label, icon: Icon, x, y, variant, color }) => (
      <div
        key={label}
        className={`absolute ${x} ${y} ${variant} rounded-2xl px-3.5 py-2.5 flex flex-col items-center gap-1 shadow-glass-sm animate-node-pulse`}
      >
        <div className="p-1.5 rounded-lg bg-white/70 border border-white/90">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="font-mono text-[9px] font-bold text-[#514940] whitespace-nowrap">{label}</span>
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
    accent: '#AD8B73',
  },
  {
    n: '02',
    title: 'ML-Powered Detection',
    body: 'Identify abnormal traffic patterns using the EVShield ML detection engine.',
    Icon: Cpu,
    variant: 'peach' as const,
    accent: '#CEAB93',
  },
  {
    n: '03',
    title: 'Rapid Threat Visibility',
    body: 'Surface warnings, incidents, affected infrastructure and security events instantly.',
    Icon: ShieldAlert,
    variant: 'sand' as const,
    accent: '#E3CAA5',
  },
  {
    n: '04',
    title: 'Infrastructure Awareness',
    body: 'Understand how security events affect your EV charging ecosystem.',
    Icon: Server,
    variant: 'taupe' as const,
    accent: '#AD8B73',
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
  { name: 'Mumbai',    nodes: 312, x: '20%', y: '60%', bg: 'glass-peach', color: '#CEAB93' },
  { name: 'Delhi',     nodes: 284, x: '38%', y: '18%', bg: 'glass-sand',  color: '#E3CAA5' },
  { name: 'Bengaluru', nodes: 256, x: '35%', y: '75%', bg: 'glass-cyan',  color: '#19BFA3' },
  { name: 'Pune',      nodes: 178, x: '28%', y: '58%', bg: 'glass-blue',  color: '#52A8FF' },
  { name: 'Hyderabad', nodes: 218, x: '42%', y: '55%', bg: 'glass-taupe', color: '#AD8B73' },
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
  const enter = () => navigate('/dashboard');

  return (
    <div className="min-h-screen warm-bg-canvas font-sans text-[#3F3832]">
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
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-[#3F3832]">
                  Protect every<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#AD8B73] via-[#CEAB93] to-[#19BFA3]">
                    charge.
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-[#514940] leading-relaxed max-w-lg font-normal">
                  EVShield monitors EV charging authentication traffic and uses machine-learning-powered detection to identify abnormal and DDoS-related activity.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <button onClick={enter} className="btn-primary rounded-xl text-sm py-3.5 px-7">
                  ENTER SECURITY CONSOLE
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
              <div className="flex flex-wrap gap-8 pt-4 border-t border-[#AD8B73]/20">
                <div>
                  <div className="text-2xl font-extrabold font-mono text-[#3F3832]">
                    <CountUp end={1250} suffix="+" />
                  </div>
                  <div className="text-xs text-[#7A7067] mt-0.5">Charging Stations</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold font-mono text-[#19BFA3]">
                    <CountUp end={96.8} decimals={1} suffix="%" />
                  </div>
                  <div className="text-xs text-[#7A7067] mt-0.5">ML Accuracy (DEMO)</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold font-mono text-[#AD8B73]">
                    <CountUp end={18450} suffix=" req/s" />
                  </div>
                  <div className="text-xs text-[#7A7067] mt-0.5">Peak throughput monitored</div>
                </div>
              </div>
            </div>

            {/* Right: EV Network Visualization */}
            <div className="hidden lg:block animate-fade-in">
              <div className="glass-cream rounded-[40px] p-8 shadow-glass border border-white/90">
                <EVNetworkViz />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES (Bento Grid with Glass Variations) ───────── */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-14">
          <ScrollReveal>
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#3F3832]">
                Security built for the electric future.
              </h2>
              <p className="text-[#514940] text-lg">
                Every layer of EVShield is purpose-built for the EV charging authentication threat landscape.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ n, title, body, Icon, variant, accent }, idx) => (
              <ScrollReveal key={n} delay={idx * 100}>
                <div className={`glass-${variant} rounded-[28px] p-7 space-y-5 h-full hover:-translate-y-1 transition-all duration-300 shadow-glass-sm`}>
                  <div className="flex items-start justify-between">
                    <div
                      className="p-3 rounded-2xl bg-white/70 border border-white/90"
                    >
                      <Icon className="w-6 h-6" style={{ color: accent }} />
                    </div>
                    <span className="font-mono text-xs text-[#7A7067] font-semibold">{n}</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-[#3F3832]">{title}</h3>
                    <p className="text-sm text-[#514940] leading-relaxed">{body}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PIPELINE ──────────────────────────────────────────── */}
      <section id="protection" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="glass-sand rounded-[40px] p-10 sm:p-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-5">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#3F3832]">
                  From traffic anomaly to security insight.
                </h2>
                <p className="text-[#514940] text-lg leading-relaxed">
                  Every authentication request flows through the EVShield intelligence pipeline in real time.
                </p>
                <button onClick={enter} className="btn-primary rounded-xl text-sm py-3.5 px-6 mt-4">
                  OPEN CONSOLE <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Animated pipeline */}
              <div className="space-y-3">
                {pipeline.map(({ label, sub }, i) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs text-white shadow-glass-sm"
                        style={{ background: `linear-gradient(135deg, #AD8B73, #CEAB93)` }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      {i < pipeline.length - 1 && (
                        <div className="w-[1.5px] h-5 bg-gradient-to-b from-[#AD8B73]/40 to-[#CEAB93]/20 mt-1" />
                      )}
                    </div>
                    <div className="glass-cream rounded-2xl px-4 py-3 flex-1">
                      <div className="text-sm font-semibold text-[#3F3832]">{label}</div>
                      <div className="text-xs text-[#7A7067] mt-0.5">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── ML SHOWCASE ───────────────────────────────────────── */}
      <section id="ml" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <ScrollReveal>
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#3F3832]">
                Machine learning at the center of every decision.
              </h2>
              <p className="text-[#514940] text-lg">A product preview of EVShield ML inference — demo data.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="glass-peach rounded-[40px] p-8 sm:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#CEAB93]/20 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="glass-cream rounded-3xl p-6 space-y-3">
                  <StatusChip label="ML PREDICTION" variant="live" />
                  <div className="font-mono text-4xl font-extrabold tracking-tight text-[#19BFA3]">NORMAL</div>
                  <div className="text-xs text-[#7A7067]">No anomaly detected</div>
                </div>

                <div className="glass-sand rounded-3xl p-6 space-y-3">
                  <StatusChip label="ML CONFIDENCE" variant="demo" />
                  <div className="font-mono text-4xl font-extrabold tracking-tight text-[#AD8B73]">
                    <CountUp end={98.2} decimals={1} suffix="%" />
                  </div>
                  <div className="text-xs text-[#7A7067]">Classification confidence score</div>
                </div>

                <div className="glass-cream rounded-3xl p-6 space-y-3">
                  <StatusChip label="TRAFFIC BASELINE" variant="normal" />
                  <div className="font-mono text-4xl font-extrabold tracking-tight text-[#3F3832]">
                    <CountUp end={1200} suffix=" req/s" />
                  </div>
                  <div className="text-xs text-[#7A7067]">Nominal request rate</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#CEAB93]/25 text-center">
                <StatusChip label="PRODUCT PREVIEW — ALL DATA IS SYNTHETIC DEMONSTRATION" variant="demo" icon={<CheckCircle2 className="w-3 h-3" />} />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── INFRASTRUCTURE MAP ────────────────────────────────── */}
      <section id="infra" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <ScrollReveal>
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#3F3832]">
                One security layer across the charging ecosystem.
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="glass-cream rounded-[40px] p-8 sm:p-12">
              <div className="relative h-72 sm:h-96 mx-auto max-w-lg">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 350">
                  {cities.map((c) => (
                    <line
                      key={c.name}
                      x1={parseFloat(c.x) * 4}
                      y1={parseFloat(c.y) * 3.5}
                      x2={200}
                      y2={175}
                      stroke="url(#mapGradWarm)"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                      opacity="0.6"
                    />
                  ))}
                  <defs>
                    <linearGradient id="mapGradWarm" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#AD8B73" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#CEAB93" stopOpacity="0.7" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass-sand rounded-2xl px-5 py-3 text-center z-10 shadow-glow-peach border border-white/90">
                  <div className="font-mono text-[11px] font-bold text-[#3F3832]">EVSHIELD</div>
                  <div className="text-[10px] text-[#7A7067]">Security Layer</div>
                </div>

                {cities.map((c) => (
                  <div
                    key={c.name}
                    className={`absolute ${c.bg} rounded-xl px-3.5 py-2 text-center animate-node-pulse shadow-glass-sm`}
                    style={{ left: c.x, top: c.y, transform: 'translate(-50%,-50%)' }}
                  >
                    <div className="font-semibold text-xs text-[#3F3832]">{c.name}</div>
                    <div className="font-mono text-[9px] text-[#7A7067]">{c.nodes} nodes</div>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-[#7A7067] mt-4 font-mono">Conceptual visualization — synthetic infrastructure data</p>
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
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3F3832]">
                  See threats as they happen.
                </h2>
                <p className="text-[#514940]">Historical security scenario timeline — demo data.</p>
              </div>
              <StatusChip label="DEMO SCENARIO LOG" variant="demo" />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">
              {events.map(({ tag, variant, glassVariant, time, text }) => (
                <div
                  key={tag}
                  className={`glass-${glassVariant} rounded-3xl p-7 shrink-0 w-72 sm:w-80 snap-start space-y-4 shadow-glass-sm hover:-translate-y-1 transition-all duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <StatusChip label={tag} variant={variant} />
                    <span className="font-mono text-xs text-[#AD8B73] font-bold">{time}</span>
                  </div>
                  <p className="text-sm text-[#514940] leading-relaxed">{text}</p>
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
            <div className="glass-cream rounded-[40px] p-12 sm:p-16 text-center space-y-8 relative overflow-hidden shadow-glass border border-white/90">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#CEAB93]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 left-1/4 w-48 h-48 bg-[#AD8B73]/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#3F3832]">
                  Ready to secure the electric future?
                </h2>
                <p className="text-lg text-[#514940] max-w-xl mx-auto leading-relaxed">
                  Enter the EVShield security console and explore the charging infrastructure protection layer.
                </p>
                <button onClick={enter} className="btn-primary rounded-xl text-sm py-3.5 px-8 mx-auto">
                  ENTER SECURITY CONSOLE
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-[#AD8B73]/20 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#AD8B73]/15 border border-[#AD8B73]/30 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#19BFA3]" />
              </div>
              <span className="font-bold text-[#3F3832]">EVShield</span>
            </div>
            <p className="text-xs text-[#7A7067]">Intelligent security for EV infrastructure.</p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-[#514940]">
            {['Platform', 'Security', 'ML Detection', 'Dashboard'].map(l => (
              <a key={l} href="#" className="hover:text-[#3F3832] transition-colors">{l}</a>
            ))}
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
