import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverEffect?: boolean;
  glow?: boolean;
}

export function Card({
  children,
  hoverEffect = false,
  glow = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-card rounded-2xl border border-border transition-all duration-200 ${
        hoverEffect
          ? 'hover:bg-card-hover hover:border-border-light hover:shadow-lg hover:-translate-y-0.5'
          : ''
      } ${glow ? 'ring-1 ring-accent/30 shadow-[0_0_20px_rgba(198,241,53,0.1)]' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 border-b border-border/60 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-6 pt-0 border-t border-border/40 mt-auto ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
