'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, UserPlus, Users, Plus, Activity } from 'lucide-react';
import { Api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stat } from '@/components/ui/stat';
import { Avatar } from '@/components/brand';
import { PageLoader } from '@/components/ui/spinner';

export default function CoachDashboard() {
  const qc = useQueryClient();
  const { data: clients, isLoading, error } = useQuery({ queryKey: ['clients'], queryFn: Api.clients });

  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const createClient = useMutation({
    mutationFn: () => Api.createClient({ firstName, lastName }),
    onSuccess: () => {
      setFirstName('');
      setLastName('');
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const total = clients?.length ?? 0;
  const recent = clients?.filter((c) => Date.now() - new Date(c.createdAt).getTime() < 7 * 864e5).length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-600">Coach workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Clients</h1>
          <p className="mt-1 text-slate-500">Manage athletes and generate their plans.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>
          <UserPlus className="size-4" /> Add client
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total clients" value={total} icon={<Users />} tone="brand" />
        <Stat label="Added this week" value={recent} icon={<Plus />} tone="sky" />
        <Stat label="Active programs" value={total} sub="generated plans" icon={<Activity />} tone="amber" />
      </div>

      {open ? (
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle>Add a client</CardTitle>
            <CardDescription>Create a profile, then run an assessment to unlock plans.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (firstName && lastName) createClient.mutate();
              }}
            >
              <div className="min-w-[150px] flex-1">
                <Field label="First name">
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </Field>
              </div>
              <div className="min-w-[150px] flex-1">
                <Field label="Last name">
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </Field>
              </div>
              <Button type="submit" disabled={createClient.isPending}>
                {createClient.isPending ? 'Adding…' : 'Save client'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>All clients</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <PageLoader />
          ) : error ? (
            <p className="py-10 text-center text-red-600">Failed to load clients.</p>
          ) : !clients?.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 py-14 text-center dot-grid">
              <Users className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">No clients yet</p>
              <p className="text-sm text-slate-500">Add your first athlete to get started.</p>
              <Button className="mt-4" onClick={() => setOpen(true)}>
                <UserPlus className="size-4" /> Add client
              </Button>
            </div>
          ) : (
            <ul className="-mx-2 divide-y divide-slate-100">
              {clients.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/coach/clients/${c.id}`}
                    className="group flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50"
                  >
                    <Avatar name={`${c.firstName} ${c.lastName}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="truncate text-sm text-slate-400">{c.email ?? 'No email on file'}</p>
                    </div>
                    <ChevronRight className="size-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
