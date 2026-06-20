'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const qc = useQueryClient();

  const client = useQuery({ queryKey: ['client', id], queryFn: () => Api.client(id) });
  const assessments = useQuery({ queryKey: ['assessments', id], queryFn: () => Api.assessments(id) });
  const goals = useQuery({ queryKey: ['goals', id], queryFn: () => Api.goals(id) });
  const programs = useQuery({ queryKey: ['programs', id], queryFn: () => Api.programs(id) });
  const nutrition = useQuery({ queryKey: ['nutrition', id], queryFn: () => Api.nutrition(id) });
  const recovery = useQuery({ queryKey: ['recovery', id], queryFn: () => Api.recovery(id) });

  const [goalId, setGoalId] = useState('');
  const [periodization, setPeriodization] = useState('UNDULATING');
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [actionError, setActionError] = useState<string | null>(null);

  const effectiveGoalId = goalId || goals.data?.[0]?.id || '';

  const genProgram = useMutation({
    mutationFn: () =>
      Api.generateProgram(id, { goalId: effectiveGoalId, periodization, durationWeeks, daysPerWeek }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs', id] }),
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Failed'),
  });
  const genNutrition = useMutation({
    mutationFn: () => Api.generateNutrition(id, effectiveGoalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutrition', id] }),
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Failed'),
  });
  const genRecovery = useMutation({
    mutationFn: () => Api.generateRecovery(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recovery', id] }),
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Failed'),
  });
  const genReport = useMutation({ mutationFn: () => Api.generateReport(id) });

  if (client.isLoading) return <p className="text-slate-500">Loading…</p>;
  if (client.error || !client.data) return <p className="text-red-600">Client not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/coach" className="text-sm text-brand hover:underline">
            ← Back to clients
          </Link>
          <h1 className="text-2xl font-semibold mt-1">
            {client.data.firstName} {client.data.lastName}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link href={`/coach/clients/${id}/assess`}>
            <Button variant="outline">New assessment &amp; goal</Button>
          </Link>
          <Button onClick={() => genReport.mutate()} disabled={genReport.isPending}>
            {genReport.isPending ? 'Queuing…' : 'Generate PDF report'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest assessment</CardTitle>
        </CardHeader>
        <CardContent>
          {!assessments.data?.length ? (
            <p className="text-sm text-amber-700">
              No assessment yet.{' '}
              <Link href={`/coach/clients/${id}/assess`} className="text-brand hover:underline">
                Add one
              </Link>{' '}
              to enable plan generation.
            </p>
          ) : (
            (() => {
              const a = assessments.data[0]!;
              return (
                <div className="grid gap-2 sm:grid-cols-4 text-sm">
                  <div>
                    <span className="text-slate-500">Version</span> v{a.version}
                  </div>
                  <div>
                    <span className="text-slate-500">Age</span> {a.age}
                  </div>
                  <div>
                    <span className="text-slate-500">Height/Weight</span> {a.heightCm}cm / {a.weightKg}kg
                  </div>
                  <div>
                    <span className="text-slate-500">Experience</span> {a.experience}
                  </div>
                  <div>
                    <span className="text-slate-500">Sport</span> {a.sport}
                  </div>
                  <div>
                    <span className="text-slate-500">Days/week</span> {a.trainingFrequency}
                  </div>
                </div>
              );
            })()
          )}
        </CardContent>
      </Card>

      {genReport.data ? (
        <Badge tone="success">Report queued ({genReport.data.status}) — id {genReport.data.reportId}</Badge>
      ) : null}
      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Generate plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!goals.data?.length ? (
            <p className="text-sm text-amber-700">
              This client has no goal yet. A goal and assessment are required to generate plans.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="text-sm text-slate-600">Goal</label>
                <Select value={effectiveGoalId} onChange={(e) => setGoalId(e.target.value)}>
                  {goals.data.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.type} {g.sport !== 'NONE' ? `(${g.sport})` : ''}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Periodization</label>
                <Select value={periodization} onChange={(e) => setPeriodization(e.target.value)}>
                  <option value="LINEAR">Linear</option>
                  <option value="BLOCK">Block</option>
                  <option value="UNDULATING">Undulating</option>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Weeks</label>
                <Select
                  value={String(durationWeeks)}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                >
                  <option value="4">4</option>
                  <option value="8">8</option>
                  <option value="12">12</option>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Days/week</label>
                <Select
                  value={String(daysPerWeek)}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                >
                  {[2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => genProgram.mutate()} disabled={!effectiveGoalId || genProgram.isPending}>
              {genProgram.isPending ? 'Generating…' : 'Generate program'}
            </Button>
            <Button
              variant="outline"
              onClick={() => genNutrition.mutate()}
              disabled={!effectiveGoalId || genNutrition.isPending}
            >
              {genNutrition.isPending ? 'Generating…' : 'Generate nutrition'}
            </Button>
            <Button variant="outline" onClick={() => genRecovery.mutate()} disabled={genRecovery.isPending}>
              {genRecovery.isPending ? 'Generating…' : 'Generate recovery'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Programs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!programs.data?.length ? (
              <p className="text-sm text-slate-500">None yet.</p>
            ) : (
              programs.data.map((p) => (
                <div key={p.id} className="text-sm">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-slate-500">
                    {p.periodization} · {p.durationWeeks}wk · {p.daysPerWeek}d/wk · {p.status}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nutrition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!nutrition.data?.length ? (
              <p className="text-sm text-slate-500">None yet.</p>
            ) : (
              nutrition.data.map((n) => (
                <div key={n.id} className="text-sm">
                  <div className="font-medium">{n.strategy}</div>
                  <div className="text-slate-500">
                    {n.goalCalories} kcal · P{n.proteinG} C{n.carbsG} F{n.fatG}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recovery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!recovery.data?.length ? (
              <p className="text-sm text-slate-500">None yet.</p>
            ) : (
              recovery.data.map((r) => (
                <div key={r.id} className="text-sm">
                  <div className="font-medium">
                    Score {r.recoveryScore}/100{' '}
                    {r.deloadRecommended ? <Badge tone="warn">Deload</Badge> : null}
                  </div>
                  <div className="text-slate-500">
                    Sleep {r.sleepTargetHours}h · Water {r.hydrationLiters}L
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
