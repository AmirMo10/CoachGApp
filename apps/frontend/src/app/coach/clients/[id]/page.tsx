'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Dumbbell,
  Salad,
  HeartPulse,
  FileText,
  ClipboardList,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar } from '@/components/brand';
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { LineChart } from '@/components/ui/line-chart';
import { LineChart as LineIcon } from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { BloodworkPanel, MessagesPanel, DocumentsPanel, NotesPanel } from '@/components/panels';

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const qc = useQueryClient();

  const client = useQuery({ queryKey: ['client', id], queryFn: () => Api.client(id) });
  const assessments = useQuery({ queryKey: ['assessments', id], queryFn: () => Api.assessments(id) });
  const goals = useQuery({ queryKey: ['goals', id], queryFn: () => Api.goals(id) });
  const programs = useQuery({ queryKey: ['programs', id], queryFn: () => Api.programs(id) });
  const nutrition = useQuery({ queryKey: ['nutrition', id], queryFn: () => Api.nutrition(id) });
  const recovery = useQuery({ queryKey: ['recovery', id], queryFn: () => Api.recovery(id) });
  const progress = useQuery({ queryKey: ['progress', id], queryFn: () => Api.progress(id) });

  const [goalId, setGoalId] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [periodization, setPeriodization] = useState('UNDULATING');
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [actionError, setActionError] = useState<string | null>(null);

  const effectiveGoalId = goalId || goals.data?.[0]?.id || '';

  const onErr = (e: unknown) => setActionError(e instanceof Error ? e.message : 'Failed');
  const genProgram = useMutation({
    mutationFn: () =>
      Api.generateProgram(id, { goalId: effectiveGoalId, periodization, durationWeeks, daysPerWeek }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs', id] }),
    onError: onErr,
  });
  const genNutrition = useMutation({
    mutationFn: () => Api.generateNutrition(id, effectiveGoalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutrition', id] }),
    onError: onErr,
  });
  const genRecovery = useMutation({
    mutationFn: () => Api.generateRecovery(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recovery', id] }),
    onError: onErr,
  });
  const genReport = useMutation({ mutationFn: () => Api.generateReport(id) });
  const logProgress = useMutation({
    mutationFn: () =>
      Api.addProgress(id, {
        weightKg: weight ? Number(weight) : undefined,
        bodyFatPct: bodyFat ? Number(bodyFat) : undefined,
      }),
    onSuccess: () => {
      setWeight('');
      setBodyFat('');
      qc.invalidateQueries({ queryKey: ['progress', id] });
    },
    onError: onErr,
  });

  if (client.isLoading) return <PageLoader />;
  if (client.error || !client.data) return <p className="text-red-600">Client not found.</p>;

  const c = client.data;
  const a = assessments.data?.[0];
  const hasGoal = !!goals.data?.length;

  return (
    <div className="space-y-6">
      <Link href="/coach" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="size-4" /> Clients
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={`${c.firstName} ${c.lastName}`} className="size-14 text-base" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {c.firstName} {c.lastName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {a ? <Badge tone="info">{a.sport}</Badge> : null}
              {hasGoal ? <Badge tone="success">{goals.data![0]!.type}</Badge> : null}
              {!a ? <Badge tone="warn">Needs assessment</Badge> : null}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/coach/clients/${id}/assess`}>
            <Button variant="outline">
              <ClipboardList className="size-4" /> New assessment
            </Button>
          </Link>
          <Button onClick={() => genReport.mutate()} disabled={genReport.isPending}>
            {genReport.isPending ? <Spinner /> : <FileText className="size-4" />} PDF report
          </Button>
        </div>
      </div>

      {genReport.data ? (
        <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700 ring-1 ring-inset ring-brand-200">
          <CheckCircle2 className="size-4" /> Report queued — status {genReport.data.status} (id{' '}
          {genReport.data.reportId.slice(0, 8)}…)
        </div>
      ) : null}
      {actionError ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-inset ring-red-100">
          {actionError}
        </div>
      ) : null}

      {/* Assessment */}
      <Card>
        <CardHeader action={a ? <Badge>v{a.version}</Badge> : null}>
          <CardTitle>Latest assessment</CardTitle>
        </CardHeader>
        <CardContent>
          {!a ? (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-sm text-amber-800">
              No assessment yet.{' '}
              <Link href={`/coach/clients/${id}/assess`} className="font-medium underline">
                Add one
              </Link>{' '}
              to enable plan generation.
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {[
                ['Age', a.age],
                ['Height', `${a.heightCm} cm`],
                ['Weight', `${a.weightKg} kg`],
                ['Experience', a.experience],
                ['Sport', a.sport],
                ['Training days/wk', a.trainingFrequency],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Generation panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand-500" /> Generate plans
          </CardTitle>
          <CardDescription>Deterministic engines build the plan; AI adds the rationale.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!hasGoal ? (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-sm text-amber-800">
              A goal and assessment are required.{' '}
              <Link href={`/coach/clients/${id}/assess`} className="font-medium underline">
                Run intake
              </Link>{' '}
              first.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Goal">
                <Select value={effectiveGoalId} onChange={(e) => setGoalId(e.target.value)}>
                  {goals.data!.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.type} {g.sport !== 'NONE' ? `(${g.sport})` : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Periodization">
                <Select value={periodization} onChange={(e) => setPeriodization(e.target.value)}>
                  <option value="LINEAR">Linear</option>
                  <option value="BLOCK">Block</option>
                  <option value="UNDULATING">Undulating</option>
                </Select>
              </Field>
              <Field label="Weeks">
                <Select value={String(durationWeeks)} onChange={(e) => setDurationWeeks(Number(e.target.value))}>
                  <option value="4">4 weeks</option>
                  <option value="8">8 weeks</option>
                  <option value="12">12 weeks</option>
                </Select>
              </Field>
              <Field label="Days / week">
                <Select value={String(daysPerWeek)} onChange={(e) => setDaysPerWeek(Number(e.target.value))}>
                  {[2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => genProgram.mutate()} disabled={!effectiveGoalId || genProgram.isPending}>
              {genProgram.isPending ? <Spinner /> : <Dumbbell className="size-4" />} Program
            </Button>
            <Button
              variant="outline"
              onClick={() => genNutrition.mutate()}
              disabled={!effectiveGoalId || genNutrition.isPending}
            >
              {genNutrition.isPending ? <Spinner /> : <Salad className="size-4" />} Nutrition
            </Button>
            <Button variant="outline" onClick={() => genRecovery.mutate()} disabled={genRecovery.isPending}>
              {genRecovery.isPending ? <Spinner /> : <HeartPulse className="size-4" />} Recovery
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan results */}
      <div className="grid gap-5 lg:grid-cols-3">
        <PlanCard icon={<Dumbbell className="size-[18px]" />} title="Programs" tone="brand" empty={!programs.data?.length}>
          {programs.data?.map((p) => (
            <Link
              key={p.id}
              href={`/coach/clients/${id}/programs/${p.id}`}
              className="block rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{p.periodization}</span>
                <Badge tone={p.status === 'ACTIVE' ? 'success' : 'default'}>{p.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {p.durationWeeks} weeks · {p.daysPerWeek} days/week · view →
              </p>
            </Link>
          ))}
        </PlanCard>

        <PlanCard icon={<Salad className="size-[18px]" />} title="Nutrition" tone="sky" empty={!nutrition.data?.length}>
          {nutrition.data?.map((n) => (
            <div key={n.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{n.strategy}</span>
                <span className="text-sm font-semibold text-brand-600">{n.goalCalories} kcal</span>
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <Macro label="P" value={n.proteinG} />
                <Macro label="C" value={n.carbsG} />
                <Macro label="F" value={n.fatG} />
              </div>
            </div>
          ))}
        </PlanCard>

        <PlanCard icon={<HeartPulse className="size-[18px]" />} title="Recovery" tone="amber" empty={!recovery.data?.length}>
          {recovery.data?.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">Score {r.recoveryScore}/100</span>
                {r.deloadRecommended ? <Badge tone="warn">Deload</Badge> : <Badge tone="success">On track</Badge>}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${r.recoveryScore}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Sleep {r.sleepTargetHours}h · Water {r.hydrationLiters}L
              </p>
            </div>
          ))}
        </PlanCard>
      </div>

      {/* Progress tracking */}
      <Card>
        <CardHeader
          action={
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (weight || bodyFat) logProgress.mutate();
              }}
            >
              <div className="w-24">
                <Field label="Weight kg">
                  <Input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="84"
                  />
                </Field>
              </div>
              <div className="w-20">
                <Field label="Body %">
                  <Input
                    type="number"
                    step="0.1"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    placeholder="16"
                  />
                </Field>
              </div>
              <Button type="submit" size="sm" disabled={(!weight && !bodyFat) || logProgress.isPending}>
                {logProgress.isPending ? <Spinner /> : 'Log'}
              </Button>
            </form>
          }
        >
          <CardTitle className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <LineIcon className="size-[18px]" />
            </span>
            Progress
          </CardTitle>
          <CardDescription>Bodyweight trend over logged entries.</CardDescription>
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

      {/* Bloodwork / Messages / Documents / Notes */}
      <Tabs
        items={[
          { key: 'bloodwork', label: 'Bloodwork', content: <BloodworkPanel clientId={id} canAdd /> },
          { key: 'messages', label: 'Messages', content: <MessagesPanel clientId={id} role="COACH" /> },
          { key: 'documents', label: 'Documents', content: <DocumentsPanel clientId={id} /> },
          { key: 'notes', label: 'Notes', content: <NotesPanel clientId={id} /> },
        ]}
      />
    </div>
  );
}

function Macro({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md bg-white px-2 py-1 font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
      {label} {value}g
    </span>
  );
}

function PlanCard({
  icon,
  title,
  tone,
  empty,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: 'brand' | 'sky' | 'amber';
  empty: boolean;
  children: React.ReactNode;
}) {
  const chip = { brand: 'bg-brand-50 text-brand-600', sky: 'bg-sky-50 text-sky-600', amber: 'bg-amber-50 text-amber-600' }[tone];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={`grid size-7 place-items-center rounded-lg ${chip}`}>{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {empty ? <p className="py-2 text-sm text-slate-400">None yet — generate above.</p> : children}
      </CardContent>
    </Card>
  );
}
