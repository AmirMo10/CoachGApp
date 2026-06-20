'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dumbbell, Salad, HeartPulse } from 'lucide-react';
import { Api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Stat } from '@/components/ui/stat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart } from '@/components/ui/line-chart';
import { Spinner } from '@/components/ui/spinner';
import { Tabs } from '@/components/ui/tabs';
import { MessagesPanel, BloodworkPanel } from '@/components/panels';
import { useT } from '@/lib/i18n';

export default function ClientDashboard() {
  const { t } = useT();
  const { user } = useAuth();
  const id = user?.clientProfileId ?? '';
  const qc = useQueryClient();

  const programs = useQuery({ queryKey: ['programs', id], queryFn: () => Api.programs(id), enabled: !!id });
  const nutrition = useQuery({ queryKey: ['nutrition', id], queryFn: () => Api.nutrition(id), enabled: !!id });
  const recovery = useQuery({ queryKey: ['recovery', id], queryFn: () => Api.recovery(id), enabled: !!id });
  const progress = useQuery({ queryKey: ['progress', id], queryFn: () => Api.progress(id), enabled: !!id });

  const [weight, setWeight] = useState('');
  const log = useMutation({
    mutationFn: () => Api.addProgress(id, { weightKg: Number(weight) }),
    onSuccess: () => {
      setWeight('');
      qc.invalidateQueries({ queryKey: ['progress', id] });
    },
  });

  if (!id) return <p className="text-slate-500">No athlete profile linked to this account.</p>;

  const latestProgram = programs.data?.[0];
  const latestNutrition = nutrition.data?.[0];
  const latestRecovery = recovery.data?.[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-brand-600">{t('client.welcome')}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{t('client.yourPlan')}</h1>
        <p className="mt-1 text-slate-500">{t('client.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label={t('client.program')}
          value={latestProgram ? `${latestProgram.durationWeeks}wk` : '—'}
          sub={latestProgram?.periodization}
          icon={<Dumbbell />}
          tone="brand"
        />
        <Stat
          label={t('client.dailyCalories')}
          value={latestNutrition ? `${latestNutrition.goalCalories}` : '—'}
          sub={latestNutrition?.strategy}
          icon={<Salad />}
          tone="sky"
        />
        <Stat
          label={t('client.recovery')}
          value={latestRecovery ? `${latestRecovery.recoveryScore}/100` : '—'}
          sub={latestRecovery?.deloadRecommended ? 'Deload advised' : 'On track'}
          icon={<HeartPulse />}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('client.trainingProgram')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!programs.data?.length ? (
              <p className="text-sm text-slate-400">No program yet — your coach will assign one.</p>
            ) : (
              programs.data.map((p) => (
                <Link
                  key={p.id}
                  href={`/client/program/${p.id}`}
                  className="block rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{p.name}</span>
                    <Badge tone={p.status === 'ACTIVE' ? 'success' : 'default'}>{p.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{p.durationWeeks} weeks · {p.daysPerWeek} days/week · view →</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader action={
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (weight) log.mutate();
              }}
            >
              <div className="w-24">
                <Field label="Weight kg">
                  <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </Field>
              </div>
              <Button type="submit" size="sm" disabled={!weight || log.isPending}>
                {log.isPending ? <Spinner /> : 'Log'}
              </Button>
            </form>
          }>
            <CardTitle>{t('client.progress')}</CardTitle>
            <CardDescription>Your bodyweight trend.</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              unit="kg"
              data={(progress.data ?? [])
                .filter((p) => p.weightKg != null)
                .map((p) => ({ label: p.entryDate.slice(5, 10), value: p.weightKg as number }))}
            />
          </CardContent>
        </Card>
      </div>

      <Tabs
        items={[
          { key: 'messages', label: t('tabs.messages'), content: <MessagesPanel clientId={id} role="CLIENT" /> },
          { key: 'bloodwork', label: t('tabs.bloodwork'), content: <BloodworkPanel clientId={id} canAdd={false} /> },
        ]}
      />
    </div>
  );
}
