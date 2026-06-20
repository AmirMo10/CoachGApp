'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Sparkles, FileText, Plus, FlaskConical } from 'lucide-react';
import { Api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoader, Spinner } from '@/components/ui/spinner';

const flagTone = (f: string) => (f === 'HIGH' || f === 'LOW' ? 'warn' : 'success');
const MARKER_TYPES = ['FASTING_GLUCOSE', 'HBA1C', 'HDL', 'LDL', 'TRIGLYCERIDES', 'VITAMIN_D', 'TESTOSTERONE', 'FERRITIN'];

// ── Messages ──
export function MessagesPanel({ clientId, role }: { clientId: string; role: 'COACH' | 'CLIENT' }) {
  const qc = useQueryClient();
  const messages = useQuery({ queryKey: ['messages', clientId], queryFn: () => Api.messages(clientId) });
  const [body, setBody] = useState('');

  const send = useMutation({
    mutationFn: (text: string) => Api.sendMessage(clientId, text),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['messages', clientId] });
    },
  });
  const draft = useMutation({
    mutationFn: () => Api.draftReply(clientId),
    onSuccess: (r) => setBody(r.draft),
  });

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {messages.isLoading ? (
            <PageLoader />
          ) : !messages.data?.length ? (
            <p className="py-6 text-center text-sm text-slate-400">No messages yet.</p>
          ) : (
            messages.data.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.senderRole === role
                    ? 'ml-auto bg-brand-gradient text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {m.body}
                <div className={`mt-0.5 text-[10px] ${m.senderRole === role ? 'text-white/70' : 'text-slate-400'}`}>
                  {m.senderRole} · {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) send.mutate(body.trim());
          }}
        >
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message…" />
          {role === 'COACH' ? (
            <Button type="button" variant="outline" onClick={() => draft.mutate()} disabled={draft.isPending} title="AI draft">
              {draft.isPending ? <Spinner /> : <Sparkles className="size-4" />}
            </Button>
          ) : null}
          <Button type="submit" disabled={send.isPending || !body.trim()}>
            {send.isPending ? <Spinner /> : <Send className="size-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Bloodwork ──
export function BloodworkPanel({ clientId, canAdd }: { clientId: string; canAdd: boolean }) {
  const qc = useQueryClient();
  const panels = useQuery({ queryKey: ['bloodwork', clientId], queryFn: () => Api.bloodwork(clientId) });
  const [type, setType] = useState('VITAMIN_D');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  const add = useMutation({
    mutationFn: () =>
      Api.addBloodwork(clientId, { notes: notes || undefined, markers: [{ type, value: Number(value) }] }),
    onSuccess: () => {
      setValue('');
      setNotes('');
      qc.invalidateQueries({ queryKey: ['bloodwork', clientId] });
    },
  });

  return (
    <div className="space-y-4">
      {canAdd ? (
        <Card>
          <CardContent className="pt-5">
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (value) add.mutate();
              }}
            >
              <div className="w-44">
                <Field label="Marker">
                  <Select value={type} onChange={(e) => setType(e.target.value)}>
                    {MARKER_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="w-28">
                <Field label="Value">
                  <Input type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} />
                </Field>
              </div>
              <div className="min-w-[160px] flex-1">
                <Field label="Notes (optional)">
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Field>
              </div>
              <Button type="submit" disabled={!value || add.isPending}>
                {add.isPending ? <Spinner /> : <Plus className="size-4" />} Add
              </Button>
            </form>
            <p className="mt-2 text-xs text-slate-400">
              Educational insights only — not medical advice. Values are encrypted at rest.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {panels.isLoading ? (
        <PageLoader />
      ) : !panels.data?.length ? (
        <p className="py-6 text-center text-sm text-slate-400">No bloodwork on file.</p>
      ) : (
        panels.data.map((p) => (
          <Card key={p.id}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FlaskConical className="size-4 text-brand-600" />
                {new Date(p.panelDate).toLocaleDateString()} {p.lab ? `· ${p.lab}` : ''}
              </div>
              <div className="mt-3 space-y-2">
                {p.markers.map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink">{m.type.replace(/_/g, ' ')}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">{m.value} {m.unit}</span>
                        <Badge tone={flagTone(m.flag)}>{m.flag}</Badge>
                      </span>
                    </div>
                    {m.insight ? <p className="mt-1 text-xs text-slate-500">{m.insight}</p> : null}
                  </div>
                ))}
              </div>
              {p.notes ? <p className="mt-3 text-sm text-slate-500">Notes: {p.notes}</p> : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ── Notes (coach only) ──
export function NotesPanel({ clientId }: { clientId: string }) {
  const qc = useQueryClient();
  const notes = useQuery({ queryKey: ['notes', clientId], queryFn: () => Api.notes(clientId) });
  const [body, setBody] = useState('');
  const add = useMutation({
    mutationFn: () => Api.addNote(clientId, body),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['notes', clientId] });
    },
  });

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) add.mutate();
          }}
        >
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a private coach note…" />
          <Button type="submit" disabled={!body.trim() || add.isPending}>
            {add.isPending ? <Spinner /> : <Plus className="size-4" />}
          </Button>
        </form>
        {notes.isLoading ? (
          <PageLoader />
        ) : !notes.data?.length ? (
          <p className="py-4 text-center text-sm text-slate-400">No notes yet.</p>
        ) : (
          <ul className="space-y-2">
            {notes.data.map((n) => (
              <li key={n.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-sm">
                <p className="text-slate-700">{n.body}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Documents ──
export function DocumentsPanel({ clientId }: { clientId: string }) {
  const docs = useQuery({ queryKey: ['documents', clientId], queryFn: () => Api.documents(clientId) });
  return (
    <Card>
      <CardContent className="pt-5">
        {docs.isLoading ? (
          <PageLoader />
        ) : !docs.data?.length ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No documents. Uploads use presigned URLs to object storage.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {docs.data.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-500">
                  <FileText className="size-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{d.name}</p>
                  <p className="text-xs text-slate-400">
                    {d.mimeType} · {(d.sizeBytes / 1024).toFixed(0)} KB · {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
