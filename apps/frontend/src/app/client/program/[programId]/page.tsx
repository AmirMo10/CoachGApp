'use client';

import { ProgramView } from '@/components/program-view';

export default function ClientProgramPage({ params }: { params: { programId: string } }) {
  return <ProgramView programId={params.programId} backHref="/client" />;
}
