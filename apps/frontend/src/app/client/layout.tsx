'use client';

import { PortalShell } from '@/components/portal-shell';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell role="CLIENT" title="Athlete">
      {children}
    </PortalShell>
  );
}
