import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-text-muted pointer-events-none flex items-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-input-bg text-text-primary rounded-xl border border-border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed ${
              icon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error ? 'border-status-declined focus:ring-status-declined/40' : ''
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-text-muted flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-status-declined flex items-center gap-1 mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
