import React, { useEffect, useRef } from 'react';

interface WaveLinesProps {
  className?: string;
}

interface LineConfig {
  baseYPercent: number;
  amp1: number;
  amp2: number;
  amp3: number;
  freq1: number;
  freq2: number;
  freq3: number;
  speed1: number;
  speed2: number;
  speed3: number;
  phase1: number;
  phase2: number;
  phase3: number;
  width: number;
  alpha: number;
  colorType: 'blue' | 'indigo' | 'violet' | 'magenta' | 'mixed';
}

/**
 * Highly Organic Animated Wave-Line Art Layer
 *
 * Spans edge-to-edge across the entire viewport width, starting behind the lower hero
 * area and floating naturally over the live WebGL ShaderGradient background.
 *
 * Distinct harmonic ribbons with diverse amplitudes, phase offsets, and non-parallel paths
 * in royal blue, indigo, violet, and magenta, with soft gradient edge fades.
 */
export const WaveLines: React.FC<WaveLinesProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

    // Generate 26 distinct, organic line configurations with varied frequencies and paths
    const lines: LineConfig[] = [];
    const TOTAL_LINES = 26;

    for (let i = 0; i < TOTAL_LINES; i++) {
      const p = i / (TOTAL_LINES - 1); // 0 to 1

      // Widely dispersed vertical baselines from 22% to 85% of container height
      const baseYPercent = 0.22 + p * 0.63 + Math.sin(p * Math.PI * 3) * 0.05;

      // Varied amplitudes to break uniformity
      const amp1 = 22 + Math.sin(p * Math.PI * 2.2) * 16 + (i % 3) * 5;
      const amp2 = 14 + Math.cos(p * Math.PI * 1.8) * 10 + (i % 2) * 4;
      const amp3 = 8 + Math.sin(p * 5) * 6;

      // Varied spatial frequencies (different wavelengths)
      const freq1 = 0.75 + (i % 4) * 0.22 + p * 0.35;
      const freq2 = 1.6 + (i % 3) * 0.45 - p * 0.4;
      const freq3 = 3.2 + (i % 5) * 0.6;

      // Varied continuous motion speeds (some glide slightly faster, some slower)
      const speed1 = 0.38 + (i % 5) * 0.07;
      const speed2 = 0.28 + (i % 3) * 0.06;
      const speed3 = 0.18 + (i % 4) * 0.04;

      // Varied initial phase angles
      const phase1 = p * 4.2 + (i % 3) * 1.1;
      const phase2 = p * 3.1 + (i % 4) * 0.8 + 1.2;
      const phase3 = p * 5.5 + 0.7;

      // Varied line thickness and alpha
      const centerDist = Math.abs(p - 0.5) * 2;
      const alpha = 0.35 + (1 - centerDist * 0.45) * 0.52;
      const strokeWidth = 0.95 + (1 - centerDist * 0.5) * 0.75;

      // Color distribution across the ribbon families
      let colorType: LineConfig['colorType'] = 'mixed';
      if (p < 0.28) colorType = 'blue';
      else if (p < 0.52) colorType = 'indigo';
      else if (p < 0.76) colorType = 'violet';
      else colorType = 'magenta';

      lines.push({
        baseYPercent,
        amp1,
        amp2,
        amp3,
        freq1,
        freq2,
        freq3,
        speed1,
        speed2,
        speed3,
        phase1,
        phase2,
        phase3,
        width: strokeWidth,
        alpha,
        colorType,
      });
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = Math.max(10, Math.floor(width * dpr));
      canvas.height = Math.max(10, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const render = () => {
      if (!ctx || width === 0 || height === 0) return;

      ctx.clearRect(0, 0, width, height);

      if (!prefersReducedMotion) {
        timeRef.current += 0.007; // Smooth, calm gliding motion
      }
      const t = timeRef.current;

      ctx.save();

      // Render each organic line with individual harmonic equations
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const baseY = height * line.baseYPercent;

        const k1 = (Math.PI * 2 * line.freq1) / width;
        const k2 = (Math.PI * 2 * line.freq2) / width;
        const k3 = (Math.PI * 2 * line.freq3) / width;

        // Create horizontal edge-to-edge color gradient
        const grad = ctx.createLinearGradient(0, 0, width, 0);

        // Subtly transition between Royal Blue (#2563EB), Indigo (#4F46E5), Violet (#8B5CF6 / #7C3AED), and Magenta (#D946EF)
        const a = line.alpha;
        grad.addColorStop(0.0, 'rgba(37, 99, 235, 0)'); // Soft edge fade
        grad.addColorStop(0.08, `rgba(37, 99, 235, ${a * 0.45})`);
        grad.addColorStop(0.24, `rgba(79, 70, 229, ${a * 0.72})`);
        grad.addColorStop(0.48, `rgba(139, 92, 246, ${a * 0.95})`);
        grad.addColorStop(0.72, `rgba(192, 132, 252, ${a * 0.85})`);
        grad.addColorStop(0.86, `rgba(217, 70, 239, ${a * 0.70})`);
        grad.addColorStop(0.96, `rgba(244, 114, 182, ${a * 0.35})`);
        grad.addColorStop(1.0, 'rgba(217, 70, 239, 0)'); // Soft edge fade

        ctx.strokeStyle = grad;
        ctx.lineWidth = line.width;
        ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
        ctx.shadowBlur = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();

        const step = Math.max(4, Math.floor(width / 220));
        for (let x = 0; x <= width + step; x += step) {
          // Compound sine & cosine wave creates organic, non-repetitive silk-like ripples
          const w =
            Math.sin(k1 * x + t * line.speed1 + line.phase1) * line.amp1 +
            Math.cos(k2 * x - t * line.speed2 + line.phase2) * line.amp2 +
            Math.sin(k3 * x + t * line.speed3 + line.phase3) * line.amp3;

          const y = baseY + w;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      ctx.restore();

      if (!prefersReducedMotion) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      } else if (!animFrameRef.current && !prefersReducedMotion) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      ro.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full pointer-events-none select-none overflow-hidden ${className}`}
      style={{
        // Seamless vertical fade mask: no hard edges, seamlessly blends into darkness
        maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 18%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.85) 82%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 18%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.85) 82%, transparent 100%)',
      }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default WaveLines;
