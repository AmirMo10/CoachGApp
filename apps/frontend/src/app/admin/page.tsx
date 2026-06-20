'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, UserCog, Dumbbell, Activity } from 'lucide-react';
import { Api } from '@/lib/api';
import { Stat } from '@/components/ui/stat';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart } from '@/components/ui/line-chart';
import { PageLoader } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';

export default function AdminDashboard() {
  const { t } = useT();
  const analytics = useQuery({ queryKey: ['adminAnalytics'], queryFn: Api.adminAnalytics });
  const coaches = useQuery({ queryKey: ['adminCoaches'], queryFn: Api.adminCoaches });

  if (analytics.isLoading) return <PageLoader />;
  if (analytics.error || !analytics.data) return <p className="text-red-600">Failed to load analytics.</p>;
  const totals = analytics.data.totals;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-brand-600">{t('admin.platform')}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{t('admin.title')}</h1>
        <p className="mt-1 text-slate-500">{t('admin.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('admin.coaches')} value={totals.coaches} icon={<UserCog />} tone="brand" />
        <Stat label={t('admin.clients')} value={totals.clients} icon={<Users />} tone="sky" />
        <Stat label={t('admin.programs')} value={totals.programs} icon={<Dumbbell />} tone="amber" />
        <Stat label={t('admin.activeUsers')} value={totals.users} icon={<Activity />} tone="slate" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('overview.clientGrowth')}</CardTitle>
          <CardDescription>New clients across the platform (last 8 weeks).</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart data={analytics.data.clientsByWeek.map((w) => ({ label: w.label, value: w.count }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.coaches')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {coaches.isLoading ? (
            <PageLoader />
          ) : !coaches.data?.length ? (
            <p className="px-5 py-6 text-slate-500">{t('admin.noCoaches')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2 font-medium">{t('admin.coach')}</th>
                  <th className="px-5 py-2 font-medium">{t('admin.business')}</th>
                  <th className="px-5 py-2 text-center font-medium">{t('admin.clients')}</th>
                  <th className="px-5 py-2 text-center font-medium">{t('admin.status')}</th>
                </tr>
              </thead>
              <tbody>
                {coaches.data.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800">
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink">{c.name || '—'}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.businessName ?? '—'}</td>
                    <td className="px-5 py-3 text-center text-slate-600">{c.clientCount}</td>
                    <td className="px-5 py-3 text-center">
                      <Badge tone={c.isActive ? 'success' : 'default'}>{c.isActive ? t('admin.active') : t('admin.inactive')}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
