'use client';

import { ProgramView } from '@/components/program-view';
import { useAuth } from '@/lib/auth';

export default function ClientProgramPage({ params }: { params: { programId: string } }) {
  const { user } = useAuth();
  return (
    <ProgramView programId={params.programId} backHref="/client" clientId={user?.clientProfileId} />
  );
}
