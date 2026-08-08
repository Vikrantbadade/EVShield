import React from 'react';

type GlassVariant = 'cream' | 'peach' | 'sand' | 'taupe' | 'white' | 'cyan' | 'blue' | 'danger' | 'success';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: GlassVariant;
  hover?: boolean;
  padding?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'white',
  hover = true,
  padding = 'p-6',
}) => {
  const variantClassMap: Record<GlassVariant, string> = {
    cream: 'glass-cream',
    peach: 'glass-peach',
    sand: 'glass-sand',
    taupe: 'glass-taupe',
    white: 'glass-card',
    cyan: 'glass-cyan',
    blue: 'glass-blue',
    danger: 'glass-danger',
    success: 'glass-success',
  };

  const base = variantClassMap[variant] || 'glass-card';
  const hoverClass = hover ? 'hover:-translate-y-1 hover:shadow-glass-hover' : '';

  return (
    <div className={`${base} ${padding} rounded-[28px] transition-all duration-300 ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};
