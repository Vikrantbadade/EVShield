import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  X,
  Menu,
  Shield,
  Activity,
  Cpu,
  Server,
  Lock,
  Radio,
} from 'lucide-react';
import { EVShieldLogo } from '../components/ui/EVShieldLogo';
import { ShaderBackground } from '../components/layout/ShaderBackground';
import { WaveLines } from '../components/landing/WaveLines';
import { SpecularButton } from '../components/ui/SpecularButton';
import { useAuth } from '../context/AuthContext';

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: 'Platform', href: '#platform' },
  { label: 'Protection', href: '#protection' },
  { label: 'ML Detection', href: '#ml-detection' },
  { label: 'Infrastructure', href: '#infrastructure' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenConsole = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative min-h-screen text-[#F5F3FF] selection:bg-[#8055F6]/30 selection:text-[#F5F3FF] bg-[#0A0A14] overflow-x-hidden">
      {/* ── Layer 1: Persistent WebGL ShaderGradient Background ── */}
      <ShaderBackground />

      {/* ── Layer 2: Subtle Atmospheric Readability Veil ── */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-gradient-to-b from-[#0A0A14]/75 via-[#0A0A14]/40 to-[#0A0A14]/85" />

      {/* ── Layer 3: Interactive Content & Navigation ── */}
      <div className="relative z-10 w-full flex flex-col">
        {/* ── 1. Spacious Minimalist Navigation Bar ── */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 sm:px-10 ${
            scrolled
              ? 'py-3.5 bg-[#0D0D1A]/85 backdrop-blur-md border-b border-[#C4B5FD]/10'
              : 'py-6 bg-transparent'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left: Brand Identity */}
            <a href="/" className="flex items-center gap-3 shrink-0 group">
              <EVShieldLogo size="sm" variant="mark" showSubtitle={false} />
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-[#F5F3FF] group-hover:text-[#C4B5FD] transition-colors">
                  EVShield
                </span>
                <span className="text-[9px] font-mono tracking-wider text-[#9896B0] uppercase">
                  SOC Platform
                </span>
              </div>
            </a>

            {/* Center: Clean Text Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs font-medium tracking-wide text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Right: Minimal Rectangular Console Action */}
            <div className="hidden md:flex items-center gap-4">
              <button
                type="button"
                onClick={handleOpenConsole}
                className="px-4 py-2 rounded-lg bg-[#8055F6]/20 hover:bg-[#8055F6]/30 border border-[#8055F6]/40 hover:border-[#8055F6]/60 text-[#F5F3FF] text-xs font-medium tracking-wide transition-all shadow-sm"
              >
                Open Security Console
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#1C1C35]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 p-5 rounded-2xl bg-[#14142B]/95 backdrop-blur-xl border border-[#C4B5FD]/16 shadow-2xl animate-fade-in">
              <div className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-[#C4C2D6] hover:text-[#F5F3FF] py-1.5 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-3 border-t border-[#C4B5FD]/12">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleOpenConsole();
                    }}
                    className="w-full py-2.5 rounded-lg bg-[#8055F6] text-[#F5F3FF] text-xs font-semibold tracking-wide transition-all text-center"
                  >
                    Open Security Console
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* ── 2. Editorial Hero with Flowing Wave-Line Art ── */}
        <section className="relative min-h-[92vh] sm:min-h-screen flex flex-col justify-center items-center pt-32 sm:pt-36 pb-28 sm:pb-36 px-6 sm:px-10 overflow-hidden">
          {/* Hero Content (Positioned with high relative z-index) */}
          <div className="max-w-4xl mx-auto text-center space-y-7 relative z-20">
            {/* Controlled Deliberate Headline with The Heritage Legacy Font */}
            <h1 className="font-heritage text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-[#F5F3FF] leading-[1.08] max-w-4xl mx-auto">
              Security for every
              <br />
              EV charge.
            </h1>

            {/* Grounded Supporting Copy */}
            <p className="text-base sm:text-lg md:text-xl text-[#C4C2D6] max-w-2xl mx-auto font-normal leading-relaxed">
              EVShield monitors charging authentication traffic, detects suspicious activity with
              machine learning, and helps protect the infrastructure behind electric mobility.
            </p>

            {/* Single Centered SpecularButton Call to Action */}
            <div className="pt-6 flex justify-center items-center relative z-20">
              <SpecularButton
                size="lg"
                radius={18}
                tint="#ffffff"
                tintOpacity={0.03}
                textColor="#f5f5f5"
                lineColor="#ffffff"
                baseColor="#525252"
                intensity={1}
                idleIntensity={0.35}
                shineSize={10}
                shineFade={34}
                thickness={1.2}
                glow={1}
                followMouse
                proximity={250}
                onClick={handleGetStarted}
              >
                Get Started
              </SpecularButton>
            </div>
          </div>

          {/* Wave-Line Art Layer: Edge-to-Edge full viewport width, starting behind lower hero */}
          <div className="absolute inset-x-0 bottom-0 h-[480px] sm:h-[560px] md:h-[640px] pointer-events-none z-10 overflow-hidden">
            <WaveLines className="w-full h-full" />
          </div>
        </section>

        {/* ── 3. Section A — The Infrastructure EVShield Protects ── */}
        <section id="platform" className="py-28 px-6 sm:px-10 border-t border-[#C4B5FD]/10">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="max-w-2xl space-y-3">
              <span className="text-[11px] font-mono tracking-widest text-[#9B7BFF] uppercase">
                System Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F5F3FF]">
                The charging grid EVShield protects.
              </h2>
              <p className="text-sm sm:text-base text-[#C4C2D6] leading-relaxed">
                Modern charging networks combine distributed hardware, edge gateways, and central
                management systems. EVShield inspects authentication traffic across every tier.
              </p>
            </div>

            {/* Purposeful Architectural Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {/* Step 1: Charging Stations */}
              <div className="p-7 rounded-2xl bg-[#14142B]/75 border border-[#C4B5FD]/14 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 flex items-center justify-center text-[#4DD9F0]">
                  <Radio className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-[#9896B0] uppercase">Tier 01</div>
                  <h3 className="text-base font-bold text-[#F5F3FF]">Charging Stations</h3>
                  <p className="text-xs text-[#C4C2D6] leading-relaxed">
                    Physical field EVSE units initiating OCPP 2.0.1 handshakes and session tokens
                    during vehicle connection.
                  </p>
                </div>
                <div className="pt-2 text-[10px] font-mono text-[#4DD9F0]">OCPP 2.0.1 / ISO 15118</div>
              </div>

              {/* Step 2: Edge Gateways */}
              <div className="p-7 rounded-2xl bg-[#14142B]/75 border border-[#C4B5FD]/14 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 flex items-center justify-center text-[#9B7BFF]">
                  <Server className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-[#9896B0] uppercase">Tier 02</div>
                  <h3 className="text-base font-bold text-[#F5F3FF]">Edge Ingestion Gateways</h3>
                  <p className="text-xs text-[#C4C2D6] leading-relaxed">
                    Regional ingress endpoints terminating encrypted TLS connections and streaming
                    raw authentication request metrics.
                  </p>
                </div>
                <div className="pt-2 text-[10px] font-mono text-[#9B7BFF]">Mutual TLS / Ingress</div>
              </div>

              {/* Step 3: Security & ML Core */}
              <div className="p-7 rounded-2xl bg-[#14142B]/75 border border-[#8055F6]/40 space-y-4 relative shadow-lg shadow-[#8055F6]/10">
                <div className="w-10 h-10 rounded-xl bg-[#8055F6]/25 border border-[#8055F6]/50 flex items-center justify-center text-[#C4B5FD]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-[#9B7BFF] uppercase">Tier 03</div>
                  <h3 className="text-base font-bold text-[#F5F3FF]">EVShield Security Core</h3>
                  <p className="text-xs text-[#C4C2D6] leading-relaxed">
                    Real-time volumetric traffic inspection, baseline comparison, and CICEV2023
                    Random Forest threat classification.
                  </p>
                </div>
                <div className="pt-2 text-[10px] font-mono text-[#34D399]">ML Anomaly Pipeline</div>
              </div>

              {/* Step 4: Fleet SOC Management */}
              <div className="p-7 rounded-2xl bg-[#14142B]/75 border border-[#C4B5FD]/14 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 flex items-center justify-center text-[#34D399]">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-[#9896B0] uppercase">Tier 04</div>
                  <h3 className="text-base font-bold text-[#F5F3FF]">Fleet SOC Console</h3>
                  <p className="text-xs text-[#C4C2D6] leading-relaxed">
                    Automated rate limiting enforcement, rogue token quarantine, and operator
                    forensic timelines.
                  </p>
                </div>
                <div className="pt-2 text-[10px] font-mono text-[#34D399]">Quarantine & Defense</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Section B — How Protection Works ── */}
        <section id="protection" className="py-28 px-6 sm:px-10 border-t border-[#C4B5FD]/10">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="max-w-2xl space-y-3">
              <span className="text-[11px] font-mono tracking-widest text-[#9B7BFF] uppercase">
                Defense Lifecycle
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F5F3FF]">
                How protection works.
              </h2>
              <p className="text-sm sm:text-base text-[#C4C2D6] leading-relaxed">
                Three compact stages safeguard critical charging hardware from denial-of-service
                authentication bursts.
              </p>
            </div>

            {/* Three Compact Stages Connected by Clean Editorial Geometry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Stage 1: Monitor */}
              <div className="p-8 rounded-2xl bg-[#14142B]/70 border border-[#C4B5FD]/14 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold font-mono text-[#9B7BFF]">01</span>
                  <Activity className="w-5 h-5 text-[#4DD9F0]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#F5F3FF]">Monitor</h3>
                  <p className="text-xs sm:text-sm text-[#C4C2D6] leading-relaxed">
                    Observe charging authentication throughput in real time across all regional
                    gateways, continuously comparing incoming request rates against expected
                    operational baselines (12 req/s).
                  </p>
                </div>
              </div>

              {/* Stage 2: Detect */}
              <div className="p-8 rounded-2xl bg-[#14142B]/70 border border-[#C4B5FD]/14 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold font-mono text-[#9B7BFF]">02</span>
                  <Cpu className="w-5 h-5 text-[#9B7BFF]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#F5F3FF]">Detect</h3>
                  <p className="text-xs sm:text-sm text-[#C4C2D6] leading-relaxed">
                    Identify abnormal patterns using the trained machine learning pipeline. The
                    inference model evaluates burst intensity and handshake retries to flag
                    volumetric DDoS attacks before stations degrade.
                  </p>
                </div>
              </div>

              {/* Stage 3: Respond */}
              <div className="p-8 rounded-2xl bg-[#14142B]/70 border border-[#C4B5FD]/14 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold font-mono text-[#9B7BFF]">03</span>
                  <Lock className="w-5 h-5 text-[#34D399]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#F5F3FF]">Respond</h3>
                  <p className="text-xs sm:text-sm text-[#C4C2D6] leading-relaxed">
                    Trigger automated mitigation workflows. Enforce gateway rate limits, isolate
                    compromised tokens, and generate comprehensive forensic audit dossiers for
                    security analysts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Section C — Security Capabilities ── */}
        <section id="ml-detection" className="py-28 px-6 sm:px-10 border-t border-[#C4B5FD]/10">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="max-w-2xl space-y-3">
              <span className="text-[11px] font-mono tracking-widest text-[#9B7BFF] uppercase">
                Platform Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F5F3FF]">
                Engineered for critical charging operations.
              </h2>
              <p className="text-sm sm:text-base text-[#C4C2D6] leading-relaxed">
                Purpose-built cybersecurity capabilities addressing the unique protocol and
                volumetric constraints of EV charging infrastructure.
              </p>
            </div>

            {/* Editorial Grid with Restrained Dividers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Capability 1 */}
              <div className="p-7 rounded-2xl bg-[#14142B]/60 border border-[#C4B5FD]/12 space-y-3 hover:border-[#4DD9F0]/30 transition-colors">
                <div className="text-[10px] font-mono text-[#4DD9F0] uppercase">Telemetry</div>
                <h3 className="text-base font-bold text-[#F5F3FF]">
                  Authentication Traffic Monitoring
                </h3>
                <p className="text-xs text-[#C4C2D6] leading-relaxed">
                  Real-time throughput metrics tracking authentication requests per second against
                  expected baselines and alert thresholds.
                </p>
              </div>

              {/* Capability 2 */}
              <div className="p-7 rounded-2xl bg-[#14142B]/60 border border-[#C4B5FD]/12 space-y-3 hover:border-[#9B7BFF]/30 transition-colors">
                <div className="text-[10px] font-mono text-[#9B7BFF] uppercase">Machine Learning</div>
                <h3 className="text-base font-bold text-[#F5F3FF]">
                  Volumetric DDoS Detection
                </h3>
                <p className="text-xs text-[#C4C2D6] leading-relaxed">
                  Supervised Random Forest classification model trained on empirical CICEV2023 EV
                  charging attack traffic datasets.
                </p>
              </div>

              {/* Capability 3 */}
              <div className="p-7 rounded-2xl bg-[#14142B]/60 border border-[#C4B5FD]/12 space-y-3 hover:border-[#34D399]/30 transition-colors">
                <div className="text-[10px] font-mono text-[#34D399] uppercase">Network</div>
                <h3 className="text-base font-bold text-[#F5F3FF]">
                  Charging Network Mesh Visibility
                </h3>
                <p className="text-xs text-[#C4C2D6] leading-relaxed">
                  Centralized topology visualizing regional hubs, operational states, active
                  stations, and encrypted interconnects.
                </p>
              </div>

              {/* Capability 4 */}
              <div className="p-7 rounded-2xl bg-[#14142B]/60 border border-[#C4B5FD]/12 space-y-3 hover:border-[#FBBF24]/30 transition-colors">
                <div className="text-[10px] font-mono text-[#FBBF24] uppercase">Forensics</div>
                <h3 className="text-base font-bold text-[#F5F3FF]">
                  Incident Dossiers & Attack Logs
                </h3>
                <p className="text-xs text-[#C4C2D6] leading-relaxed">
                  Historical attack logs detailing peak rates, affected infrastructure nodes,
                  timeline sequences, and ML confidence levels.
                </p>
              </div>

              {/* Capability 5 */}
              <div className="p-7 rounded-2xl bg-[#14142B]/60 border border-[#C4B5FD]/12 space-y-3 hover:border-[#FB7185]/30 transition-colors">
                <div className="text-[10px] font-mono text-[#FB7185] uppercase">Mitigation</div>
                <h3 className="text-base font-bold text-[#F5F3FF]">
                  Automated Quarantine & Recovery
                </h3>
                <p className="text-xs text-[#C4C2D6] leading-relaxed">
                  Dynamic rate limiting policies and token quarantine workflows that restore
                  degraded charging gateways to nominal operation.
                </p>
              </div>

              {/* Capability 6 */}
              <div className="p-7 rounded-2xl bg-[#14142B]/60 border border-[#C4B5FD]/12 space-y-3 hover:border-[#38BDF8]/30 transition-colors">
                <div className="text-[10px] font-mono text-[#38BDF8] uppercase">Governance</div>
                <h3 className="text-base font-bold text-[#F5F3FF]">
                  Role-Based Security Operations
                </h3>
                <p className="text-xs text-[#C4C2D6] leading-relaxed">
                  Fine-grained operational roles for SOC Administrators, Security Analysts, and
                  Incident Operators with full audit tracking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Section D — Infrastructure Visibility ── */}
        <section id="infrastructure" className="py-28 px-6 sm:px-10 border-t border-[#C4B5FD]/10">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl space-y-3">
                <span className="text-[11px] font-mono tracking-widest text-[#9B7BFF] uppercase">
                  Regional Hubs
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F5F3FF]">
                  Infrastructure visibility.
                </h2>
                <p className="text-sm sm:text-base text-[#C4C2D6] leading-relaxed">
                  Operators maintain real-time situational awareness across monitored regional
                  charging hubs and connected field stations.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenConsole}
                className="text-xs font-mono text-[#C4B5FD] hover:text-[#F5F3FF] flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>Inspect full topology in console</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Monitored Regional Charging Gateways */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { name: 'Mumbai Central Hub', stations: 312, code: 'BOM-01', health: '99.8%' },
                { name: 'Delhi NCR Gateway', stations: 284, code: 'DEL-01', health: '99.5%' },
                { name: 'Bengaluru Tech Corridor', stations: 256, code: 'BLR-01', health: '99.9%' },
                { name: 'Hyderabad Cyber City', stations: 218, code: 'HYD-01', health: '99.4%' },
                { name: 'Pune Express Cluster', stations: 178, code: 'PUN-01', health: '99.7%' },
              ].map((hub) => (
                <div
                  key={hub.name}
                  className="p-5 rounded-2xl bg-[#14142B]/75 border border-[#C4B5FD]/12 space-y-3 hover:border-[#8055F6]/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#9896B0]">{hub.code}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#34D399]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] inline-block" />
                      Active
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F3FF] leading-snug">{hub.name}</h3>
                    <p className="text-xs font-mono text-[#4DD9F0] mt-1">{hub.stations} stations</p>
                  </div>
                  <div className="pt-2 border-t border-[#C4B5FD]/10 flex items-center justify-between text-[10px] font-mono text-[#9896B0]">
                    <span>Health</span>
                    <span className="text-[#F5F3FF]">{hub.health}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Section E — Final Call to Action ── */}
        <section className="py-32 px-6 sm:px-10 border-t border-[#C4B5FD]/10 relative overflow-hidden">
          <div className="max-w-3xl mx-auto text-center space-y-7 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F3FF] leading-tight">
              Keep charging infrastructure secure.
            </h2>
            <p className="text-base sm:text-lg text-[#C4C2D6] leading-relaxed max-w-xl mx-auto">
              Enter the EVShield security console to access live telemetry, ML anomaly detection,
              and charging network defense.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenConsole}
                className="px-7 py-3.5 rounded-lg bg-[#8055F6] hover:bg-[#7043EA] text-[#F5F3FF] text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-xl shadow-[#8055F6]/25 inline-flex items-center gap-2 group"
              >
                <span>Open Security Console</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* ── 8. Minimalist Footer ── */}
        <footer className="border-t border-[#C4B5FD]/10 py-10 px-6 sm:px-10 bg-[#0B0B14]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <EVShieldLogo size="sm" variant="mark" showSubtitle={false} />
              <span className="text-xs text-[#9896B0] font-mono">
                © {new Date().getFullYear()} EVShield. EV Charging Infrastructure Cybersecurity.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#C4C2D6]">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="hover:text-[#F5F3FF] transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                onClick={handleOpenConsole}
                className="hover:text-[#9B7BFF] transition-colors font-medium"
              >
                Console Login
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
