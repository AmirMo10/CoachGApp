'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CoachDashboard() {
  const qc = useQueryClient();
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: Api.clients,
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const createClient = useMutation({
    mutationFn: () => Api.createClient({ firstName, lastName }),
    onSuccess: () => {
      setFirstName('');
      setLastName('');
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Your Clients</h1>
        <p className="text-slate-600 mt-1">
          Manage athletes and generate programs, nutrition, and recovery plans.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a client</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap gap-3 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (firstName && lastName) createClient.mutate();
            }}
          >
            <div className="flex-1 min-w-[140px]">
              <label className="text-sm text-slate-600">First name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-sm text-slate-600">Last name</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? 'Adding…' : 'Add client'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="px-5 py-6 text-slate-500">Loading…</p>
          ) : error ? (
            <p className="px-5 py-6 text-red-600">Failed to load clients.</p>
          ) : !clients?.length ? (
            <p className="px-5 py-6 text-slate-500">No clients yet — add one above.</p>
          ) : (
            <ul className="divide-y">
              {clients.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <div className="font-medium">
                      {c.firstName} {c.lastName}
                    </div>
                    {c.email ? <div className="text-sm text-slate-500">{c.email}</div> : null}
                  </div>
                  <Link href={`/coach/clients/${c.id}`}>
                    <Button size="sm" variant="outline">
                      Open
                    </Button>
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
