'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, ShieldAlert, BatteryCharging, Target } from 'lucide-react';
import { Api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const SPORTS = ['NONE', 'FOOTBALL', 'BASKETBALL', 'VOLLEYBALL', 'COMBAT', 'RUNNING'];
const EXPERIENCE = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const GOAL_TYPES = ['FAT_LOSS', 'MUSCLE_GAIN', 'RECOMP', 'PERFORMANCE', 'GENERAL_FITNESS'];

const toList = (s: string): string[] =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

export default function AssessPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { t } = useT();
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
      qc.invalidateQueries({ queryKey: ['assessments', id] });
      qc.invalidateQueries({ queryKey: ['goals', id] });
      router.push(`/coach/clients/${id}`);
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Failed to save'),
  });

  const num = (label: string, key: keyof typeof form, hint?: string) => (
    <Field label={label} hint={hint}>
      <Input type="number" value={String(form[key])} onChange={(e) => set(key, e.target.value as never)} />
    </Field>
  );
  const sel = (label: string, key: keyof typeof form, options: string[]) => (
    <Field label={label}>
      <Select value={String(form[key])} onChange={(e) => set(key, e.target.value as never)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace('_', ' ')}
          </option>
        ))}
      </Select>
    </Field>
  );

  const sectionIcon = 'grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/coach/clients/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="size-4" /> {t('as.backToClient')}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t('as.title')}</h1>
        <p className="mt-1 text-slate-500">{t('as.subtitle')}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          submit.mutate();
        }}
        className="space-y-5"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={sectionIcon}>
                <User className="size-[18px]" />
              </span>
              {t('as.athleteProfile')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {num(t('as.age'), 'age')}
            {sel(t('as.gender'), 'gender', GENDERS)}
            {sel(t('as.experience'), 'experience', EXPERIENCE)}
            {num(t('as.heightCm'), 'heightCm')}
            {num(t('as.weightKg'), 'weightKg')}
            {num(t('as.bodyFat'), 'bodyFatPct', t('common.optional'))}
            {sel(t('as.sport'), 'sport', SPORTS)}
            {num(t('as.trainingDays'), 'trainingFrequency')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={sectionIcon}>
                <ShieldAlert className="size-[18px]" />
              </span>
              {t('as.constraints')}
            </CardTitle>
            <CardDescription>{t('as.constraintsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label={t('as.injuries')} hint="e.g. knee, shoulder">
              <Input value={form.injuries} onChange={(e) => set('injuries', e.target.value)} placeholder="knee, shoulder" />
            </Field>
            <Field label={t('as.mobility')} hint="e.g. ankle">
              <Input
                value={form.mobilityRestrictions}
                onChange={(e) => set('mobilityRestrictions', e.target.value)}
                placeholder="ankle"
              />
            </Field>
            <Field label={t('as.equipment')}>
              <Input value={form.equipment} onChange={(e) => set('equipment', e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={sectionIcon}>
                <BatteryCharging className="size-[18px]" />
              </span>
              {t('as.recoveryLifestyle')}
            </CardTitle>
            <CardDescription>{t('as.recoveryDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {num(t('as.recoveryQuality'), 'recoveryQuality')}
            {num(t('as.sleepQuality'), 'sleepQuality')}
            {num(t('as.stressLevel'), 'stressLevel')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={sectionIcon}>
                <Target className="size-[18px]" />
              </span>
              {t('as.goal')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {sel(t('as.goalType'), 'goalType', GOAL_TYPES)}
            {sel(t('as.goalSport'), 'goalSport', SPORTS)}
            {num(t('as.timeframe'), 'timeframeWeeks')}
          </CardContent>
        </Card>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-inset ring-red-100 dark:bg-red-500/15 dark:ring-red-500/30">
            {error}
          </p>
        ) : null}

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={submit.isPending}>
            {submit.isPending ? <Spinner /> : null} {t('as.saveBtn')}
          </Button>
          <Link href={`/coach/clients/${id}`}>
            <Button type="button" variant="outline" size="lg">
              {t('common.cancel')}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
