interface ProgressBarProps {
  value: number; // current value
  max?: number; // max value (default 100)
  label?: string;
  valueDisplay?: string;
  variant?: 'accent' | 'approved' | 'warning';
  height?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  valueDisplay,
  variant = 'accent',
  height = 'md',
  showPercentage = false,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colors = {
    accent: 'bg-accent shadow-[0_0_10px_rgba(198,241,53,0.4)]',
    approved: 'bg-status-approved shadow-[0_0_10px_rgba(34,197,94,0.4)]',
    warning: 'bg-status-pending shadow-[0_0_10px_rgba(245,158,11,0.4)]',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || valueDisplay || showPercentage) && (
        <div className="flex justify-between items-center text-xs font-medium">
          {label && <span className="text-text-secondary">{label}</span>}
          <span className="text-text-primary font-semibold ml-auto">
            {valueDisplay || (showPercentage ? `${percentage}%` : `${value} / ${max}`)}
          </span>
        </div>
      )}
      <div className={`w-full bg-main rounded-full overflow-hidden border border-border/60 ${heights[height]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
