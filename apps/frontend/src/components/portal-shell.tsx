'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, homeForRole } from '@/lib/auth';
import { Logo, Avatar } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import type { AuthUser } from '@/lib/api';

/**
 * Top-bar layout for the client and admin portals with a role guard.
 * Redirects to login when unauthenticated, or to the user's own home if their
 * role doesn't match the portal.
 */
export function PortalShell({
  role,
  title,
  children,
}: {
  role: AuthUser['role'];
  title: string;
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.role !== role) router.replace(homeForRole(user.role));
  }, [loading, user, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="grid min-h-screen place-items-center">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="flex items-center justify-between border-b border-slate-200/70 bg-white px-6 py-3.5">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden text-sm font-medium text-slate-400 sm:inline">· {title}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <Avatar name={user.email} className="size-8 text-xs" />
            <span className="text-sm text-slate-500">{user.email}</span>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
