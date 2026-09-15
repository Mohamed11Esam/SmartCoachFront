import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  accentIcon?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changeLabel = 'vs last week',
  icon,
  accentIcon = true,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card hoverEffect className="p-5 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-text-primary mt-1.5 tracking-tight group-hover:text-accent transition-colors">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        <div
          className={`p-3 rounded-xl border ${
            accentIcon
              ? 'bg-accent/10 border-accent/20 text-accent'
              : 'bg-main border-border text-text-secondary'
          }`}
        >
          {icon}
        </div>
      </div>

      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center font-semibold ${
              isPositive
                ? 'text-status-approved'
                : isNegative
                ? 'text-status-declined'
                : 'text-text-muted'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : isNegative ? (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <Minus className="w-3.5 h-3.5 mr-0.5" />
            )}
            {Math.abs(change)}%
          </span>
          <span className="text-text-muted">{changeLabel}</span>
        </div>
      )}
    </Card>
  );
}
