'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, Sparkles, Flame, Activity, CheckCircle2 } from 'lucide-react';
import { Api, LoggedExercise, LoggedSet, ProgramDayFull, ProgramWeekFull } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LogState {
  loggedKeys: Set<string>;
  pendingKey: string | null;
  onLog: (weekIndex: number, dayIndex: number, focus: string, entries: LoggedExercise[]) => void;
}

const phaseTone: Record<string, 'success' | 'info' | 'warn' | 'default'> = {
  ACCUMULATION: 'info',
  INTENSIFICATION: 'success',
  REALIZATION: 'default',
  DELOAD: 'warn',
};

/**
 * Shared week-by-week program viewer used by both coach and client portals.
 * When `clientId` is provided (client portal), each day shows a "Log session"
 * form that records the actual reps/load performed per exercise.
 */
export function ProgramView({
  programId,
  backHref,
  clientId,
}: {
  programId: string;
  backHref: string;
  clientId?: string;
}) {
  const { t } = useT();
  const program = useQuery({ queryKey: ['program', programId], queryFn: () => Api.program(programId) });
  const [openWeek, setOpenWeek] = useState(1);
  const [loggedKeys, setLoggedKeys] = useState<Set<string>>(new Set());
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const logWorkout = useMutation({
    mutationFn: (v: { weekIndex: number; dayIndex: number; focus: string; entries: LoggedExercise[] }) => {
      setPendingKey(`${v.weekIndex}-${v.dayIndex}`);
      return Api.logWorkout(clientId!, { programId, ...v });
    },
    onSuccess: (_r, v) => {
      setLoggedKeys((s) => new Set(s).add(`${v.weekIndex}-${v.dayIndex}`));
      setPendingKey(null);
    },
    onError: () => setPendingKey(null),
  });

  const log: LogState | undefined = clientId
    ? {
        loggedKeys,
        pendingKey,
        onLog: (weekIndex, dayIndex, focus, entries) =>
          logWorkout.mutate({ weekIndex, dayIndex, focus, entries }),
      }
    : undefined;

  if (program.isLoading) return <PageLoader />;
  if (program.error || !program.data) return <p className="text-red-600">{t('pv.notFound')}</p>;
  const p = program.data;

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="size-4" /> {t('common.back')}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{p.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="info">{p.periodization}</Badge>
          <Badge>{p.durationWeeks} {t('cd.weeks')}</Badge>
          <Badge>{p.daysPerWeek} {t('cd.daysWeek')}</Badge>
          <Badge tone={p.status === 'ACTIVE' ? 'success' : 'default'}>{p.status}</Badge>
        </div>
      </div>

      {p.aiRationale ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <Sparkles className="size-[18px]" />
              </span>
              {t('pv.rationale')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm leading-relaxed text-slate-600">
              {p.aiRationale.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {p.weeks.map((week) => (
          <WeekRow
            key={week.id}
            week={week}
            open={openWeek === week.weekIndex}
            onToggle={() => setOpenWeek((w) => (w === week.weekIndex ? -1 : week.weekIndex))}
            log={log}
          />
        ))}
      </div>
    </div>
  );
}

function WeekRow({
  week,
  open,
  onToggle,
  log,
}: {
  week: ProgramWeekFull;
  open: boolean;
  onToggle: () => void;
  log?: LogState;
}) {
  const { t } = useT();
  return (
    <Card className={cn('overflow-hidden transition-shadow', open && 'shadow-glow')}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
            {week.weekIndex}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">{t('pv.week')} {week.weekIndex}</span>
              <Badge tone={phaseTone[week.phase] ?? 'default'}>{week.phase}</Badge>
              {week.isDeload ? <Badge tone="warn">{t('common.deload')}</Badge> : null}
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Activity className="size-3" /> Vol ×{week.volumeMultiplier}
              </span>
              <span className="inline-flex items-center gap-1">
                <Flame className="size-3" /> Int ×{week.intensityMultiplier}
              </span>
            </div>
          </div>
        </div>
        <ChevronDown className={cn('size-5 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="grid gap-4 border-t border-slate-100 bg-slate-50/50 p-5 md:grid-cols-2">
          {week.days.map((day) => (
            <div key={day.id} className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{t('pv.day')} {day.dayIndex}</span>
                <Badge>{day.focus}</Badge>
              </div>
              {day.payload?.warmup?.length ? (
                <p className="mt-2 text-xs text-slate-400">{t('pv.warmup')}: {day.payload.warmup.join(' · ')}</p>
              ) : null}
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="pb-1 font-medium">{t('pv.exercise')}</th>
                    <th className="pb-1 text-center font-medium">{t('pv.sets')}</th>
                    <th className="pb-1 text-center font-medium">{t('pv.reps')}</th>
                    <th className="pb-1 text-center font-medium">{t('pv.load')}</th>
                    <th className="pb-1 text-center font-medium">{t('pv.rest')}</th>
                  </tr>
                </thead>
                <tbody>
                  {day.exercises.map((ex) => (
                    <tr key={ex.id} className="border-t border-slate-100">
                      <td className="py-1.5 pr-2 font-medium text-ink">{ex.exercise.name}</td>
                      <td className="py-1.5 text-center text-slate-600">{ex.sets}</td>
                      <td className="py-1.5 text-center text-slate-600">{ex.reps}</td>
                      <td className="py-1.5 text-center text-slate-600">
                        {ex.loadPctOf1RM ? `${Math.round(ex.loadPctOf1RM * 100)}%` : ex.rpe ? `RPE ${ex.rpe}` : '—'}
                      </td>
                      <td className="py-1.5 text-center text-slate-600">{ex.restSeconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {day.payload?.conditioning?.length ? (
                <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
                  {t('pv.conditioning')}: {day.payload.conditioning.join(' · ')}
                </p>
              ) : null}
              {log ? <DayLogger week={week} day={day} log={log} /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

/**
 * Per-day session logger: clients record the actual reps/load/RPE they performed
 * for each exercise. Rows are pre-seeded from the planned set count.
 */
function DayLogger({ week, day, log }: { week: ProgramWeekFull; day: ProgramDayFull; log: LogState }) {
  const { t } = useT();
  const key = `${week.weekIndex}-${day.dayIndex}`;
  const done = log.loggedKeys.has(key);
  const pending = log.pendingKey === key;
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<LoggedExercise[]>(() =>
    day.exercises.map((ex) => ({
      name: ex.exercise.name,
      sets: Array.from({ length: Math.max(1, ex.sets) }, () => ({}) as LoggedSet),
    })),
  );

  const update = (ei: number, si: number, field: keyof LoggedSet, value: string) => {
    setEntries((prev) =>
      prev.map((e, i) =>
        i !== ei
          ? e
          : {
              ...e,
              sets: e.sets.map((s, j) =>
                j !== si ? s : { ...s, [field]: value === '' ? undefined : Number(value) },
              ),
            },
      ),
    );
  };

  if (done) {
    return (
      <Button variant="subtle" size="sm" className="mt-3 w-full" disabled>
        <CheckCircle2 className="size-4" /> {t('pv.logged')}
      </Button>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setOpen(true)}>
        {t('pv.logSession')}
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/40">
      {entries.map((ex, ei) => (
        <div key={ei}>
          <p className="text-xs font-semibold text-ink">{ex.name}</p>
          <div className="mt-1.5 space-y-1.5">
            {ex.sets.map((s, si) => (
              <div key={si} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[11px] text-slate-400">
                  {t('pv.set')} {si + 1}
                </span>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={t('pv.reps')}
                  value={s.reps ?? ''}
                  onChange={(e) => update(ei, si, 'reps', e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="kg"
                  value={s.weightKg ?? ''}
                  onChange={(e) => update(ei, si, 'weightKg', e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="RPE"
                  value={s.rpe ?? ''}
                  onChange={(e) => update(ei, si, 'rpe', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          disabled={pending}
          onClick={() => log.onLog(week.weekIndex, day.dayIndex, day.focus, entries)}
        >
          {pending ? <Spinner /> : t('pv.saveSession')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
