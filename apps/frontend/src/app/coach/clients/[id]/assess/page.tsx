'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const SPORTS = ['NONE', 'FOOTBALL', 'BASKETBALL', 'VOLLEYBALL', 'COMBAT', 'RUNNING'];
const EXPERIENCE = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const GOAL_TYPES = ['FAT_LOSS', 'MUSCLE_GAIN', 'RECOMP', 'PERFORMANCE', 'GENERAL_FITNESS'];

/** Parse a comma-separated list into a trimmed string array. */
const toList = (s: string): string[] =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

export default function AssessPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    age: 28,
    gender: 'MALE',
    heightCm: 180,
    weightKg: 80,
    bodyFatPct: '',
    sport: 'NONE',
    experience: 'INTERMEDIATE',
    injuries: '',
    mobilityRestrictions: '',
    equipment: 'barbell, dumbbell, bench, rack, pullup-bar',
    trainingFrequency: 4,
    recoveryQuality: 7,
    sleepQuality: 7,
    stressLevel: 4,
    goalType: 'MUSCLE_GAIN',
    goalSport: 'NONE',
    timeframeWeeks: 8,
  });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = useMutation({
    mutationFn: async () => {
      await Api.createAssessment(id, {
        age: Number(form.age),
        gender: form.gender,
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        bodyFatPct: form.bodyFatPct ? Number(form.bodyFatPct) : undefined,
        sport: form.sport,
        experience: form.experience,
        injuries: toList(form.injuries),
        mobilityRestrictions: toList(form.mobilityRestrictions),
        equipment: toList(form.equipment),
        trainingFrequency: Number(form.trainingFrequency),
        recoveryQuality: Number(form.recoveryQuality),
        sleepQuality: Number(form.sleepQuality),
        stressLevel: Number(form.stressLevel),
      });
      await Api.createGoal(id, {
        type: form.goalType,
        sport: form.goalSport,
        timeframeWeeks: Number(form.timeframeWeeks),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] });
      qc.invalidateQueries({ queryKey: ['goals', id] });
      router.push(`/coach/clients/${id}`);
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Failed to save'),
  });

  const num = (label: string, key: keyof typeof form, min?: number, max?: number) => (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <Input
        type="number"
        min={min}
        max={max}
        value={String(form[key])}
        onChange={(e) => set(key, e.target.value as never)}
      />
    </div>
  );

  const sel = (label: string, key: keyof typeof form, options: string[]) => (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <Select value={String(form[key])} onChange={(e) => set(key, e.target.value as never)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/coach/clients/${id}`} className="text-sm text-brand hover:underline">
          ← Back to client
        </Link>
        <h1 className="text-2xl font-semibold mt-1">New Assessment &amp; Goal</h1>
        <p className="text-slate-600">Capture intake data; a goal is created alongside it.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          submit.mutate();
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Athlete profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {num('Age', 'age', 10, 100)}
            {sel('Gender', 'gender', GENDERS)}
            {sel('Experience', 'experience', EXPERIENCE)}
            {num('Height (cm)', 'heightCm', 100, 250)}
            {num('Weight (kg)', 'weightKg', 30, 300)}
            {num('Body fat % (optional)', 'bodyFatPct', 2, 60)}
            {sel('Sport', 'sport', SPORTS)}
            {num('Training days/week', 'trainingFrequency', 1, 7)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Constraints &amp; equipment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-1">
            <div>
              <label className="text-sm text-slate-600">Injuries (comma-separated)</label>
              <Input value={form.injuries} onChange={(e) => set('injuries', e.target.value)} placeholder="knee, shoulder" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Mobility restrictions (comma-separated)</label>
              <Input
                value={form.mobilityRestrictions}
                onChange={(e) => set('mobilityRestrictions', e.target.value)}
                placeholder="ankle"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Equipment (comma-separated)</label>
              <Input value={form.equipment} onChange={(e) => set('equipment', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recovery &amp; lifestyle (1–10)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {num('Recovery quality', 'recoveryQuality', 1, 10)}
            {num('Sleep quality', 'sleepQuality', 1, 10)}
            {num('Stress level', 'stressLevel', 1, 10)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {sel('Goal type', 'goalType', GOAL_TYPES)}
            {sel('Goal sport', 'goalSport', SPORTS)}
            {num('Timeframe (weeks)', 'timeframeWeeks', 2, 52)}
          </CardContent>
        </Card>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={submit.isPending}>
            {submit.isPending ? 'Saving…' : 'Save assessment & goal'}
          </Button>
          <Link href={`/coach/clients/${id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
