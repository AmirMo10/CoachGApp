'use client';

import { ProgramView } from '@/components/program-view';

export default function ProgramViewer({ params }: { params: { id: string; programId: string } }) {
  return <ProgramView programId={params.programId} backHref={`/coach/clients/${params.id}`} />;
}
