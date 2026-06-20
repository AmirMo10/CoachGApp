'use client';

import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      aria-hidden
    />
  );
}

export function PageLoader({ label }: { label?: string }) {
  const { t } = useT();
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
      <Spinner /> {label ?? t('common.loading')}
    </div>
  );
}
