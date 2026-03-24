'use client';

import { ReactNode } from 'react';

type MetricCardProps = {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  // New semantic colors + legacy support
  color?: 'accent' | 'gold' | 'success' | 'error' | 'info' | 'blue' | 'green' | 'amber' | 'red';
  isLoading?: boolean;
  children?: ReactNode;
};

const colorStyles = {
  accent: {
    iconBg: 'bg-[var(--accent-primary-muted)]',
    iconBorder: 'border-[var(--accent-primary)]',
    valueColor: 'text-[var(--accent-primary)]',
    glowColor: 'shadow-[var(--shadow-glow)]',
  },
  gold: {
    iconBg: 'bg-[var(--gold-muted)]',
    iconBorder: 'border-[var(--gold-primary)]',
    valueColor: 'text-[var(--gold-primary)]',
    glowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
  },
  success: {
    iconBg: 'bg-[var(--success-muted)]',
    iconBorder: 'border-[var(--success)]',
    valueColor: 'text-[var(--success)]',
    glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
  },
  error: {
    iconBg: 'bg-[var(--error-muted)]',
    iconBorder: 'border-[var(--error)]',
    valueColor: 'text-[var(--error)]',
    glowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
  },
  info: {
    iconBg: 'bg-[var(--info-muted)]',
    iconBorder: 'border-[var(--info)]',
    valueColor: 'text-[var(--info)]',
    glowColor: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
  },
};

// Legacy color mapping
const legacyColorMap: Record<string, keyof typeof colorStyles> = {
  blue: 'info',
  green: 'success',
  amber: 'gold',
  red: 'error',
};

export default function MetricCard({ 
  label, 
  value, 
  sublabel, 
  icon = '📊', 
  trend,
  color = 'gold',
  isLoading = false,
  children 
}: MetricCardProps) {
  // Map legacy colors to new system
  const mappedColor = legacyColorMap[color] || color;
  const styles = colorStyles[mappedColor as keyof typeof colorStyles] || colorStyles.gold;
  
  return (
    <div className={`
      relative flex items-center gap-4 rounded-xl
      bg-[var(--background-secondary)] border border-[var(--border-color)]
      px-4 py-3.5 
      transition-all duration-200
      hover:border-[var(--border-color-strong)]
      hover:shadow-[var(--shadow-md)]
      group
    `}>
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
           style={{ background: 'linear-gradient(135deg, var(--hover-bg), transparent)' }} />
      
      {/* Icon */}
      <div className={`
        relative shrink-0 flex items-center justify-center 
        w-11 h-11 rounded-lg 
        ${styles.iconBg} 
        border ${styles.iconBorder} border-opacity-30
        transition-transform duration-200 group-hover:scale-105
      `}>
        <span className="text-xl">{icon}</span>
      </div>

      {/* Content */}
      <div className="relative flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] leading-tight mb-0.5">
          {label}
        </p>
        {isLoading ? (
          <div className="h-6 w-20 bg-[var(--background-tertiary)] rounded animate-pulse mt-0.5" />
        ) : (
          <p className={`text-xl font-bold ${styles.valueColor} leading-tight tracking-tight`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        )}
        {sublabel && !isLoading && (
          <p className="text-[10px] text-[var(--foreground-subtle)] leading-tight mt-0.5">{sublabel}</p>
        )}
      </div>

      {/* Trend indicator */}
      {trend && trend !== 'neutral' && (
        <div className={`
          relative shrink-0 flex items-center justify-center
          w-6 h-6 rounded-full text-xs
          ${trend === 'up' ? 'bg-[var(--success-muted)] text-[var(--success)]' : 'bg-[var(--error-muted)] text-[var(--error)]'}
        `}>
          {trend === 'up' ? '↑' : '↓'}
        </div>
      )}

      {children && <div className="relative shrink-0">{children}</div>}
    </div>
  );
}
