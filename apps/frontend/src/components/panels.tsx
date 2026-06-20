'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Sparkles, FileText, Plus, FlaskConical } from 'lucide-react';
import { Api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';

const flagTone = (f: string) => (f === 'HIGH' || f === 'LOW' ? 'warn' : 'success');
const MARKER_TYPES = ['FASTING_GLUCOSE', 'HBA1C', 'HDL', 'LDL', 'TRIGLYCERIDES', 'VITAMIN_D', 'TESTOSTERONE', 'FERRITIN'];

// ── Messages ──
export function MessagesPanel({ clientId, role }: { clientId: string; role: 'COACH' | 'CLIENT' }) {
  const { t } = useT();
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
            <p className="py-6 text-center text-sm text-slate-400">{t('pn.noMessages')}</p>
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
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('pn.writeMessage')} />
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
  const { t } = useT();
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
                <Field label={t('pn.marker')}>
                  <Select value={type} onChange={(e) => setType(e.target.value)}>
                    {MARKER_TYPES.map((m) => (
                      <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="w-28">
                <Field label={t('pn.value')}>
                  <Input type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} />
                </Field>
              </div>
              <div className="min-w-[160px] flex-1">
                <Field label={t('pn.notesOptional')}>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Field>
              </div>
              <Button type="submit" disabled={!value || add.isPending}>
                {add.isPending ? <Spinner /> : <Plus className="size-4" />} {t('common.add')}
              </Button>
            </form>
            <p className="mt-2 text-xs text-slate-400">{t('pn.eduDisclaimer')}</p>
          </CardContent>
        </Card>
      ) : null}

      {panels.isLoading ? (
        <PageLoader />
      ) : !panels.data?.length ? (
        <p className="py-6 text-center text-sm text-slate-400">{t('pn.noBloodwork')}</p>
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
  const { t } = useT();
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
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('pn.addNote')} />
          <Button type="submit" disabled={!body.trim() || add.isPending}>
            {add.isPending ? <Spinner /> : <Plus className="size-4" />}
          </Button>
        </form>
        {notes.isLoading ? (
          <PageLoader />
        ) : !notes.data?.length ? (
          <p className="py-4 text-center text-sm text-slate-400">{t('pn.noNotes')}</p>
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
const ACCEPTED = 'image/jpeg,image/png,image/webp,application/pdf';

export function DocumentsPanel({ clientId, canUpload = false }: { clientId: string; canUpload?: boolean }) {
  const { t } = useT();
  const qc = useQueryClient();
  const docs = useQuery({ queryKey: ['documents', clientId], queryFn: () => Api.documents(clientId) });
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      // 1) presign → 2) PUT bytes directly to object storage → 3) record metadata
      const { key, url } = await Api.presignDocument(clientId, file.name, file.type);
      const put = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!put.ok) throw new Error(`Upload failed (${put.status}). Check storage CORS/credentials.`);
      return Api.recordDocument(clientId, {
        name: file.name,
        objectKey: key,
        mimeType: file.type,
        sizeBytes: file.size,
      });
    },
    onSuccess: () => {
      setError(null);
      if (fileRef.current) fileRef.current.value = '';
      qc.invalidateQueries({ queryKey: ['documents', clientId] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Upload failed'),
  });

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        {canUpload ? (
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              className="block text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload.mutate(f);
              }}
              disabled={upload.isPending}
            />
            {upload.isPending ? (
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <Spinner /> {t('settings.uploading')}
              </span>
            ) : null}
            <span className="text-xs text-slate-400">JPG/PNG/WebP/PDF</span>
          </div>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-100">{error}</p>
        ) : null}

        {docs.isLoading ? (
          <PageLoader />
        ) : !docs.data?.length ? (
          <p className="py-6 text-center text-sm text-slate-400">{t('pn.noDocuments')}</p>
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
