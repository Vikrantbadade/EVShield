import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition — reliable client-side route fade + subtle slide.
 *
 * Wraps the entire <Routes> block. When the pathname changes:
 *   1. Fades out + slides down slightly (150 ms CSS transition).
 *   2. Swaps the route content.
 *   3. Fades back in + slides up to resting position (150 ms).
 *
 * Respects prefers-reduced-motion: the reduced-motion media query
 * in index.css sets transition-duration to 0.01ms globally, so
 * the animation is imperceptible for users who prefer it.
 *
 * Usage in App.tsx:
 *   <PageTransition key={location.pathname}>
 *     <Routes location={location}>…</Routes>
 *   </PageTransition>
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathname = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname === prevPathname.current) {
      // Same route — update children in place (e.g. query-string only change)
      setDisplayChildren(children);
      return;
    }

    prevPathname.current = location.pathname;

    // 1. Fade out
    setVisible(false);

    // 2. Swap content + fade in after transition completes (150 ms)
    timerRef.current = setTimeout(() => {
      setDisplayChildren(children);
      window.scrollTo({ top: 0, behavior: 'instant' });
      setVisible(true);
    }, 160);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Keep display children in sync when route is unchanged but children update
  useEffect(() => {
    if (visible) setDisplayChildren(children);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <div
      style={{
        transition: 'opacity 160ms ease, transform 160ms ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(8px)',
        willChange: 'opacity, transform',
      }}
    >
      {displayChildren}
    </div>
  );
};
