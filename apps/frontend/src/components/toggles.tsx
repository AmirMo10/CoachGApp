'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Languages } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Dark/light theme toggle. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
        className,
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

/** EN / FA language toggle. */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useT();
  return (
    <button
      type="button"
      aria-label="Toggle language"
      onClick={() => setLocale(locale === 'en' ? 'fa' : 'en')}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
        className,
      )}
    >
      <Languages className="size-4" />
      {locale === 'en' ? 'فا' : 'EN'}
    </button>
  );
}
