'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Users, LayoutDashboard, Dumbbell, Settings, LogOut, type LucideIcon } from 'lucide-react';
import { useAuth, homeForRole } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { Logo, Avatar } from '@/components/brand';
import { ThemeToggle, LanguageToggle } from '@/components/toggles';
import { PageLoader } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type NavItem = { href: string; labelKey: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: '/coach', labelKey: 'nav.clients', icon: Users },
  { href: '/coach/overview', labelKey: 'nav.overview', icon: LayoutDashboard },
  { href: '/coach/library', labelKey: 'nav.library', icon: Dumbbell },
  { href: '/coach/settings', labelKey: 'nav.settings', icon: Settings },
];

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.role !== 'COACH') router.replace(homeForRole(user.role));
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'COACH') {
    return (
      <div className="grid min-h-screen place-items-center">
        <PageLoader />
      </div>
    );
  }

  const isActive = (href: string) =>
    href === '/coach' ? pathname === '/coach' || pathname.startsWith('/coach/clients') : pathname === href;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-slate-200/70 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-950 lg:flex">
        <div className="flex items-center justify-between px-2">
          <Logo />
          <div className="flex items-center gap-1.5">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        <nav className="mt-8 flex-1 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t('nav.workspace')}
          </p>
          {NAV.map(({ href, labelKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-brand-gradient text-white shadow-soft'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
              )}
            >
              <Icon className="size-[18px]" /> {t(labelKey)}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <Avatar name={user.email} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{user.email}</p>
              <p className="text-xs capitalize text-slate-400">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <LogOut className="size-4" /> {t('common.signOut')}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-slate-200/70 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
        <Logo />
        <div className="flex items-center gap-1.5">
          <LanguageToggle />
          <ThemeToggle />
          <button onClick={logout} className="ml-1 text-sm font-medium text-slate-500">
            {t('common.signOut')}
          </button>
        </div>
      </header>

      <div className="min-w-0">
        <main className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
