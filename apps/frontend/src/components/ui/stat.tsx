import * as React from 'react';
import { cn } from '@/lib/utils';

/** Compact metric card with an icon chip, used across dashboards. */
export function Stat({
  label,
  value,
  sub,
  icon,
  tone = 'brand',
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'brand' | 'sky' | 'amber' | 'slate';
  className?: string;
}) {
  const chip = {
    brand: 'bg-brand-50 text-brand-600',
    sky: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  }[tone];

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-slate-500">{label}</span>
        {icon ? (
          <span className={cn('grid size-9 place-items-center rounded-xl [&_svg]:size-[18px]', chip)}>
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-400">{sub}</div> : null}
    </div>
  );
}
