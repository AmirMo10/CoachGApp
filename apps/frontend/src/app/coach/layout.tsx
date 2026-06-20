'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Users, LayoutDashboard, Dumbbell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Logo, Avatar } from '@/components/brand';
import { PageLoader } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/coach', label: 'Clients', icon: Users },
  { href: '/coach/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/coach/library', label: 'Exercise Library', icon: Dumbbell, soon: true },
  { href: '/coach/settings', label: 'Settings', icon: Settings, soon: true },
];

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
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
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-slate-200/70 bg-white px-4 py-5 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex-1 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>
          {NAV.map(({ href, label, icon: Icon, soon }) =>
            soon ? (
              <span
                key={href}
                className="flex cursor-not-allowed items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-400"
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-[18px]" /> {label}
                </span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold">
                  soon
                </span>
              </span>
            ) : (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'bg-brand-gradient text-white shadow-soft'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className="size-[18px]" /> {label}
              </Link>
            ),
          )}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.email} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{user.email}</p>
              <p className="text-xs capitalize text-slate-400">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-slate-200/70 bg-white px-5 py-3 lg:hidden">
        <Logo />
        <button onClick={logout} className="text-sm font-medium text-slate-500">
          Sign out
        </button>
      </header>

      <div className="min-w-0">
        <main className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
