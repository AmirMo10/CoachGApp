'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, UserCog, Dumbbell, Activity } from 'lucide-react';
import { Api } from '@/lib/api';
import { Stat } from '@/components/ui/stat';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart } from '@/components/ui/line-chart';
import { PageLoader } from '@/components/ui/spinner';

export default function AdminDashboard() {
  const analytics = useQuery({ queryKey: ['adminAnalytics'], queryFn: Api.adminAnalytics });
  const coaches = useQuery({ queryKey: ['adminCoaches'], queryFn: Api.adminCoaches });

  if (analytics.isLoading) return <PageLoader />;
  if (analytics.error || !analytics.data) return <p className="text-red-600">Failed to load analytics.</p>;
  const t = analytics.data.totals;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-brand-600">Platform</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Admin overview</h1>
        <p className="mt-1 text-slate-500">System-wide metrics and coach management.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Coaches" value={t.coaches} icon={<UserCog />} tone="brand" />
        <Stat label="Clients" value={t.clients} icon={<Users />} tone="sky" />
        <Stat label="Programs" value={t.programs} icon={<Dumbbell />} tone="amber" />
        <Stat label="Active users" value={t.users} icon={<Activity />} tone="slate" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client growth</CardTitle>
          <CardDescription>New clients across the platform (last 8 weeks).</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart data={analytics.data.clientsByWeek.map((w) => ({ label: w.label, value: w.count }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coaches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {coaches.isLoading ? (
            <PageLoader />
          ) : !coaches.data?.length ? (
            <p className="px-5 py-6 text-slate-500">No coaches yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2 font-medium">Coach</th>
                  <th className="px-5 py-2 font-medium">Business</th>
                  <th className="px-5 py-2 text-center font-medium">Clients</th>
                  <th className="px-5 py-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {coaches.data.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink">{c.name || '—'}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.businessName ?? '—'}</td>
                    <td className="px-5 py-3 text-center text-slate-600">{c.clientCount}</td>
                    <td className="px-5 py-3 text-center">
                      <Badge tone={c.isActive ? 'success' : 'default'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
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
