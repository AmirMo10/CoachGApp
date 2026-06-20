import * as React from 'react';
import { cn } from '@/lib/utils';

const tones = {
  default: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-brand-50 text-brand-700 ring-brand-200',
  warn: 'bg-amber-50 text-amber-700 ring-amber-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  neutral: 'bg-slate-900 text-white ring-slate-900',
};

export function Badge({
  className,
  tone = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
