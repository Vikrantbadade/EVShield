import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface SidebarContextProps {
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  animate: boolean;
  isPinned: boolean;
  setIsPinned: (pinned: boolean | ((prev: boolean) => boolean)) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  togglePin: () => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export interface SidebarProviderProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean | ((prev: boolean) => boolean)) => void;
  animate?: boolean;
}

const PINNED_STORAGE_KEY = 'evshield_sidebar_pinned';

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}) => {
  const [isPinned, setIsPinnedState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(PINNED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const [internalOpen, setInternalOpen] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const open = openProp !== undefined ? openProp : (isPinned || internalOpen);

  const setOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    if (setOpenProp) {
      setOpenProp(value);
    } else {
      setInternalOpen(value);
    }
  };

  const setIsPinned = (value: boolean | ((prev: boolean) => boolean)) => {
    setIsPinnedState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const togglePin = () => {
    setIsPinnedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      if (!next) {
        setInternalOpen(false);
      }
      return next;
    });
  };

  return (
    <SidebarContext.Provider
      value={{
        open,
        setOpen,
        animate,
        isPinned,
        setIsPinned,
        mobileOpen,
        setMobileOpen,
        togglePin,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar: React.FC<SidebarProviderProps> = ({
  children,
  open,
  setOpen,
  animate,
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <>
      <DesktopSidebar className={className} {...props}>
        {children}
      </DesktopSidebar>
      <MobileSidebar className={className}>
        {children}
      </MobileSidebar>
    </>
  );
};

export const DesktopSidebar: React.FC<React.HTMLAttributes<HTMLElement>> = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen, animate, isPinned } = useSidebar();

  return (
    <motion.aside
      className={cn(
        'fixed top-0 left-0 bottom-0 z-40 hidden lg:flex flex-col',
        'bg-[#17172A]/95 backdrop-blur-xl border-r border-[#C4B5FD]/16 select-none',
        open && !isPinned ? 'shadow-2xl shadow-black/70' : 'shadow-lg shadow-black/30',
        className
      )}
      animate={{
        width: animate ? (open ? 260 : 68) : 260,
      }}
      transition={{
        duration: 0.22,
        ease: [0.4, 0, 0.2, 1],
      }}
      onMouseEnter={() => {
        if (!isPinned) setOpen(true);
      }}
      onMouseLeave={() => {
        if (!isPinned) setOpen(false);
      }}
      aria-expanded={open}
      {...(props as any)}
    >
      <div className="flex flex-col h-full w-full overflow-hidden">
        {children}
      </div>
    </motion.aside>
  );
};

export const MobileSidebar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
}) => {
  const { mobileOpen, setMobileOpen, animate } = useSidebar();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  return (
    <AnimatePresence>
      {mobileOpen && (
        <SidebarContext.Provider
          value={{
            open: true,
            setOpen: () => {},
            animate,
            isPinned: true,
            setIsPinned: () => {},
            mobileOpen,
            setMobileOpen,
            togglePin: () => {},
          }}
        >
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#11111F]/80 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer Panel */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                'fixed top-0 left-0 bottom-0 w-[280px] z-50 flex flex-col',
                'bg-[#17172A] border-r border-[#C4B5FD]/16 shadow-2xl select-none',
                className
              )}
              aria-label="Mobile Navigation"
            >
              <div className="flex-1 flex flex-col overflow-hidden">
                {children}
              </div>
            </motion.aside>
          </div>
        </SidebarContext.Provider>
      )}
    </AnimatePresence>
  );
};

export interface SidebarLinkItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> | React.ReactNode;
  badge?: React.ReactNode;
}

export interface SidebarLinkProps {
  link: SidebarLinkItem;
  className?: string;
  onClick?: () => void;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({
  link,
  className,
  onClick,
}) => {
  const { open, animate, setMobileOpen } = useSidebar();

  const renderIcon = (isActive: boolean) => {
    const iconColor = isActive ? '#4DD9F0' : '#9B7BFF';
    if (React.isValidElement(link.icon)) {
      return React.cloneElement(link.icon as React.ReactElement<any>, {
        className: cn('w-4 h-4 shrink-0 transition-colors duration-200', (link.icon.props as any)?.className),
        style: { color: iconColor, ...((link.icon.props as any)?.style || {}) },
      });
    }
    if (typeof link.icon === 'function' || (typeof link.icon === 'object' && link.icon !== null)) {
      const IconComponent = link.icon as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
      return <IconComponent className="w-4 h-4 shrink-0 transition-colors duration-200" style={{ color: iconColor }} />;
    }
    return null;
  };

  return (
    <div className="relative group/link">
      <NavLink
        to={link.href}
        onClick={() => {
          setMobileOpen(false);
          if (onClick) onClick();
        }}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative select-none',
            isActive
              ? 'bg-[#9B7BFF]/20 text-[#F5F3FF] border border-[#9B7BFF]/40 font-semibold shadow-sm'
              : 'text-[#9896B0] hover:text-[#F5F3FF] hover:bg-[#252542] border border-transparent',
            !open && 'justify-center px-0 w-10 h-10 mx-auto',
            className
          )
        }
        aria-label={link.label}
      >
        {({ isActive }) => (
          <>
            {/* Active left indicator pill */}
            <span
              className={cn(
                'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-200 bg-[#4DD9F0] shadow-[0_0_8px_#4DD9F0]',
                isActive ? 'h-5 opacity-100' : 'h-0 opacity-0',
                !open && 'left-[-4px]'
              )}
            />

            {/* Icon */}
            <div className="shrink-0 flex items-center justify-center">
              {renderIcon(isActive)}
            </div>

            {/* Label reveal animation */}
            <motion.span
              animate={{
                display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
                opacity: animate ? (open ? 1 : 0) : 1,
              }}
              transition={{ duration: 0.15 }}
              className="text-sm font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left"
            >
              {link.label}
            </motion.span>

            {/* Optional badge in expanded view */}
            {link.badge && open && (
              <span className="shrink-0 ml-auto">
                {link.badge}
              </span>
            )}
          </>
        )}
      </NavLink>

      {/* Floating Tooltip in collapsed icon rail mode */}
      {!open && (
        <div
          role="tooltip"
          className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-[#1D1D35] border border-[#C4B5FD]/20 text-xs font-semibold text-[#F5F3FF] shadow-xl shadow-black/80 pointer-events-none whitespace-nowrap opacity-0 group-hover/link:opacity-100 translate-x-[-4px] group-hover/link:translate-x-0 transition-all duration-150 z-50 hidden lg:block"
        >
          {link.label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1D1D35]" />
        </div>
      )}
    </div>
  );
};
