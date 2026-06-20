'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dumbbell, Search } from 'lucide-react';
import { Api } from '@/lib/api';
import { Input, Select, Field } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';

const PATTERNS = ['', 'SQUAT', 'HINGE', 'LUNGE', 'HORIZONTAL_PUSH', 'VERTICAL_PUSH', 'HORIZONTAL_PULL', 'VERTICAL_PULL', 'CARRY', 'ROTATION', 'GAIT', 'PLYOMETRIC', 'CONDITIONING'];
const DIFFICULTY = ['', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const diffTone = (d: string) => (d === 'ADVANCED' ? 'warn' : d === 'INTERMEDIATE' ? 'info' : 'success');

export default function LibraryPage() {
  const [pattern, setPattern] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [equipment, setEquipment] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['exercises', pattern, difficulty, equipment],
    queryFn: () => Api.exercises({ pattern, difficulty, equipment }),
  });

  const filtered = useMemo(
    () => (data ?? []).filter((e) => e.name.toLowerCase().includes(q.toLowerCase())),
    [data, q],
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-brand-600">Coach workspace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Exercise Library</h1>
        <p className="mt-1 text-slate-500">
          The deterministic exercise catalog the program engine selects from. AI never invents exercises.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-4">
          <Field label="Search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name…" className="pl-9" />
            </div>
          </Field>
          <Field label="Movement pattern">
            <Select value={pattern} onChange={(e) => setPattern(e.target.value)}>
              {PATTERNS.map((p) => (
                <option key={p} value={p}>{p ? p.replace(/_/g, ' ') : 'All patterns'}</option>
              ))}
            </Select>
          </Field>
          <Field label="Difficulty">
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {DIFFICULTY.map((d) => (
                <option key={d} value={d}>{d || 'All levels'}</option>
              ))}
            </Select>
          </Field>
          <Field label="Equipment">
            <Input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="barbell" />
          </Field>
        </CardContent>
      </Card>

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <p className="text-red-600">Failed to load exercises.</p>
      ) : (
        <>
          <p className="text-sm text-slate-500">{filtered.length} exercises</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 120).map((ex) => (
              <div key={ex.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <Dumbbell className="size-4" />
                    </span>
                    <span className="font-medium leading-tight text-ink">{ex.name}</span>
                  </div>
                  <Badge tone={diffTone(ex.difficulty)}>{ex.difficulty[0]}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">{ex.movementPattern.replace(/_/g, ' ')}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {ex.primaryMuscles.slice(0, 3).map((m) => (
                    <span key={m} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{m}</span>
                  ))}
                  {ex.equipment.slice(0, 2).map((m) => (
                    <span key={m} className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[11px] text-sky-700">{m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {filtered.length > 120 ? (
            <p className="text-center text-sm text-slate-400">Showing first 120 — refine filters to narrow.</p>
          ) : null}
        </>
      )}
    </div>
  );
}
