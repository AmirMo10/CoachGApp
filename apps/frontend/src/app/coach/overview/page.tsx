'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Dumbbell, Salad, HeartPulse, ClipboardList } from 'lucide-react';
import { Api } from '@/lib/api';
import { Stat } from '@/components/ui/stat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart } from '@/components/ui/line-chart';
import { PageLoader } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';

export default function OverviewPage() {
  const { t } = useT();
  const { data, isLoading, error } = useQuery({ queryKey: ['overview'], queryFn: Api.overview });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <p className="text-red-600">Failed to load overview.</p>;

  const totals = data.totals;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-brand-600">{t('dash.workspace')}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{t('overview.title')}</h1>
        <p className="mt-1 text-slate-500">{t('overview.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label={t('admin.clients')} value={totals.clients} icon={<Users />} tone="brand" />
        <Stat label="Assessments" value={totals.assessments} icon={<ClipboardList />} tone="slate" />
        <Stat label={t('admin.programs')} value={totals.programs} icon={<Dumbbell />} tone="brand" />
        <Stat label="Nutrition" value={totals.nutritionPlans} icon={<Salad />} tone="sky" />
        <Stat label={t('client.recovery')} value={totals.recoveryPlans} icon={<HeartPulse />} tone="amber" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('overview.clientGrowth')}</CardTitle>
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
