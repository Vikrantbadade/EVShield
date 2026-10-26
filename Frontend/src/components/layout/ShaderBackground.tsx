import React, { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ShaderErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[EVShield] WebGL/ShaderGradient encountered an error, using fallback:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

const StaticFallback: React.FC = () => (
  <div
    className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    style={{
      background:
        'radial-gradient(circle at 20% 30%, rgba(56, 38, 111, 0.28) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(26, 36, 84, 0.25) 0%, transparent 60%), #0A0A14',
    }}
  />
);

export const ShaderBackground: React.FC = () => {
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    setHasWebGL(checkWebGLSupport());

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  if (!hasWebGL) {
    return <StaticFallback />;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
      style={{
        zIndex: 0,
        pointerEvents: 'none',
        background: '#0A0A14',
      }}
    >
      <ShaderErrorBoundary fallback={<StaticFallback />}>
        <ShaderGradientCanvas
          lazyLoad={false}
          pixelDensity={1}
          fov={45}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {React.createElement(ShaderGradient as React.ComponentType<any>, {
            animate: prefersReducedMotion ? 'off' : 'on',
            axesHelper: 'off',
            bgColor1: '#000000',
            bgColor2: '#000000',
            brightness: 0.7,
            cAzimuthAngle: 180,
            cDistance: 3.59,
            cPolarAngle: 90,
            cameraZoom: 1,
            color1: '#38266F',
            color2: '#1A2454',
            color3: '#6244B8',
            destination: 'onCanvas',
            embedMode: 'off',
            envPreset: 'city',
            frameRate: 30,
            gizmoHelper: 'hide',
            grain: 'off',
            lightType: '3d',
            pixelDensity: 1,
            positionX: -1.4,
            positionY: 0,
            positionZ: 0,
            range: 'disabled',
            rangeEnd: 40,
            rangeStart: 0,
            reflection: 0.08,
            rotationX: 0,
            rotationY: 10,
            rotationZ: 50,
            shader: 'defaults',
            type: 'plane',
            uAmplitude: 1,
            uDensity: 1.4,
            uFrequency: 5.5,
            uSpeed: prefersReducedMotion ? 0 : 0.52,
            uStrength: 1.85,
            uTime: 0,
            wireframe: false,
          })}
        </ShaderGradientCanvas>
      </ShaderErrorBoundary>
    </div>
  );
};
