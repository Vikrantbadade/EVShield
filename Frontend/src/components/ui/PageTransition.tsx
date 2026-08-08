import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition — reliable client-side route fade.
 *
 * The previous implementation relied on `onAnimationEnd` to swap the
 * displayed route, but the fadeOut stage used Tailwind *transition*
 * utilities (opacity-0, scale-[0.99]), not CSS @keyframe animations.
 * `onAnimationEnd` never fires for CSS transitions, leaving the app
 * frozen on a blank/invisible div indefinitely when navigating.
 *
 * Fix: use a `setTimeout` to swap the displayed location after a
 * short CSS transition completes, completely avoiding the unreliable
 * `animationend` event.
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return;

    // 1. Fade out
    setVisible(false);

    // 2. After the CSS transition (200 ms), swap route and fade back in
    timerRef.current = setTimeout(() => {
      setDisplayLocation(location);
      window.scrollTo(0, 0);
      setVisible(true);
    }, 200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div
      style={{
        transition: 'opacity 200ms ease, transform 200ms ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
      }}
    >
      {/* Render the currently displayed location's children */}
      {React.cloneElement(children as React.ReactElement, {})}
    </div>
  );
};
