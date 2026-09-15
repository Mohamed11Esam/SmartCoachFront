import type { ReactNode } from 'react';

export interface BadgeProps {
  variant?: 'accent' | 'approved' | 'pending' | 'declined' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const base = 'inline-flex items-center font-medium rounded-full';

  const variants = {
    accent: 'bg-accent/15 text-accent border border-accent/30',
    approved: 'bg-status-approved/15 text-status-approved border border-status-approved/30',
    pending: 'bg-status-pending/15 text-status-pending border border-status-pending/30',
    declined: 'bg-status-declined/15 text-status-declined border border-status-declined/30',
    neutral: 'bg-card-hover text-text-secondary border border-border',
    outline: 'bg-transparent text-text-primary border border-border-light',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
