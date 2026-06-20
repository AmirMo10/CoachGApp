import { cn } from '@/lib/utils';

/** Coach"G" wordmark with a gradient monogram tile. */
export function Logo({
  className,
  light = false,
  showText = true,
}: {
  className?: string;
  light?: boolean;
  showText?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid size-8 place-items-center rounded-xl bg-brand-gradient text-sm font-black text-white shadow-glow">
        G
      </span>
      {showText ? (
        <span className={cn('text-lg font-bold tracking-tight', light ? 'text-white' : 'text-ink')}>
          Coach<span className="text-brand-500">G</span>
        </span>
      ) : null}
    </span>
  );
}

/** Colored initials avatar for clients. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-semibold text-white',
        className,
      )}
    >
      {initials}
    </span>
  );
}
