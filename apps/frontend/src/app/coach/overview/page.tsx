'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Dumbbell, Salad, HeartPulse, ClipboardList } from 'lucide-react';
import { Api } from '@/lib/api';
import { Stat } from '@/components/ui/stat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart } from '@/components/ui/line-chart';
import { PageLoader } from '@/components/ui/spinner';

export default function OverviewPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['overview'], queryFn: Api.overview });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <p className="text-red-600">Failed to load overview.</p>;

  const t = data.totals;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-brand-600">Coach workspace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Overview</h1>
        <p className="mt-1 text-slate-500">Your roster and generated plans at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Clients" value={t.clients} icon={<Users />} tone="brand" />
        <Stat label="Assessments" value={t.assessments} icon={<ClipboardList />} tone="slate" />
        <Stat label="Programs" value={t.programs} icon={<Dumbbell />} tone="brand" />
        <Stat label="Nutrition plans" value={t.nutritionPlans} icon={<Salad />} tone="sky" />
        <Stat label="Recovery plans" value={t.recoveryPlans} icon={<HeartPulse />} tone="amber" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client growth</CardTitle>
          <CardDescription>New clients added per week (last 8 weeks).</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart
            data={data.clientsByWeek.map((w) => ({ label: w.label, value: w.count }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
