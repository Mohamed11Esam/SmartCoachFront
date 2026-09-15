import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'accent-glow';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer';

  const variants = {
    primary:
      'bg-accent text-black font-semibold hover:bg-accent-hover shadow-[0_0_15px_rgba(198,241,53,0.15)] hover:shadow-[0_0_25px_rgba(198,241,53,0.3)]',
    'accent-glow':
      'bg-accent text-black font-bold hover:bg-accent-hover shadow-[0_0_20px_rgba(198,241,53,0.35)]',
    secondary:
      'bg-card text-text-primary border border-border hover:bg-card-hover hover:border-border-light',
    outline:
      'bg-transparent text-accent border border-accent/40 hover:bg-accent/10 hover:border-accent',
    danger:
      'bg-status-declined text-white hover:bg-red-600 shadow-sm',
    ghost:
      'text-text-secondary hover:text-text-primary hover:bg-card/70',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base font-semibold gap-2.5',
    icon: 'p-2.5 aspect-square',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
      {children}
    </button>
  );
}
