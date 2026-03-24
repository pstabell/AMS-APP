"use client";

type TransactionCounts = {
  stmt: number;
  void: number;
  end: number;
  can: number;
  other: number;
};

type TransactionLegendProps = {
  counts: TransactionCounts;
  className?: string;
};

export type IndicatorType = 'STMT' | 'VOID' | 'END' | 'CAN' | 'OTHER';

export const INDICATOR_STYLES = {
  STMT: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    name: 'Statement/Reconciliation',
    shortName: 'STMT',
    description: 'Statement or reconciliation transactions',
  },
  VOID: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    dot: 'bg-red-500',
    name: 'Voided Transaction',
    shortName: 'VOID',
    description: 'Voided or reversed transactions',
  },
  END: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    name: 'Endorsement',
    shortName: 'END',
    description: 'Policy endorsements and modifications',
  },
  CAN: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    dot: 'bg-red-500',
    name: 'Cancellation',
    shortName: 'CAN',
    description: 'Policy cancellations',
  },
  OTHER: {
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    dot: 'bg-slate-500',
    name: 'Other',
    shortName: 'OTHER',
    description: 'Other transaction types',
  },
};

export function TransactionIndicator({ 
  type, 
  showLabel = false,
  size = 'sm' 
}: { 
  type: IndicatorType; 
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md';
}) {
  const style = INDICATOR_STYLES[type];
  const sizeClasses = {
    xs: showLabel ? 'px-1.5 py-0.5 text-xs' : 'h-2 w-2',
    sm: showLabel ? 'px-2 py-1 text-xs' : 'h-3 w-3',
    md: showLabel ? 'px-2.5 py-1.5 text-sm' : 'h-4 w-4',
  };

  if (showLabel) {
    return (
      <span className={`inline-flex items-center rounded-full border font-medium ${style.badge} ${sizeClasses[size]}`}>
        {style.shortName}
      </span>
    );
  }

  return (
    <div 
      className={`rounded-full ${style.dot} ${sizeClasses[size]}`}
      title={`${style.name}: ${style.description}`}
    />
  );
}

export default function TransactionLegend({ counts, className = '' }: TransactionLegendProps) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  const legendItems = [
    { type: 'STMT' as IndicatorType, count: counts.stmt },
    { type: 'VOID' as IndicatorType, count: counts.void },
    { type: 'END' as IndicatorType, count: counts.end },
    { type: 'CAN' as IndicatorType, count: counts.can },
    { type: 'OTHER' as IndicatorType, count: counts.other },
  ].filter(item => item.count > 0);

  if (total === 0) {
    return null;
  }

  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-900">Transaction Legend</h4>
        <span className="text-xs text-slate-500">{total} transactions</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {legendItems.map(({ type, count }) => {
          const style = INDICATOR_STYLES[type];
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          
          return (
            <div key={type} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <TransactionIndicator type={type} size="md" />
                <div>
                  <div className="text-sm font-medium text-slate-900">{style.shortName}</div>
                  <div className="text-xs text-slate-500">{style.name}</div>
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-sm font-semibold text-slate-900">{count}</div>
                <div className="text-xs text-slate-500">{percentage}%</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
          {legendItems.map(({ type, count }) => {
            const style = INDICATOR_STYLES[type];
            const width = total > 0 ? (count / total) * 100 : 0;
            
            return (
              <div
                key={type}
                className={`${style.dot.replace('bg-', 'bg-')}`}
                style={{ width: `${width}%` }}
                title={`${style.shortName}: ${count} transactions (${width.toFixed(1)}%)`}
              />
            );
          })}
        </div>
        
        <div className="flex justify-between text-xs text-slate-500">
          <span>Transaction Distribution</span>
          <span>{total} total</span>
        </div>
      </div>
    </div>
  );
}