'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Image as ImageIcon, Save } from 'lucide-react';
import { Api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageLoader, Spinner } from '@/components/ui/spinner';

const toList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

export default function SettingsPage() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ['coachProfile'], queryFn: Api.coachProfile });

  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Hydrate the form once the profile loads.
  useEffect(() => {
    if (profile.data) {
      setBusinessName(profile.data.businessName ?? '');
      setBio(profile.data.bio ?? '');
      setSpecialties(profile.data.specialties.join(', '));
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () =>
      Api.updateCoachProfile({ businessName, bio, specialties: toList(specialties) }),
    onSuccess: () => {
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 2500);
      qc.invalidateQueries({ queryKey: ['coachProfile'] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Save failed'),
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const { key, url } = await Api.presignLogo(file.name, file.type);
      const put = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!put.ok) throw new Error(`Upload failed (${put.status}). Check storage CORS/credentials.`);
      return Api.updateCoachProfile({ logoKey: key });
    },
    onSuccess: () => {
      if (fileRef.current) fileRef.current.value = '';
      qc.invalidateQueries({ queryKey: ['coachProfile'] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Logo upload failed'),
  });

  if (profile.isLoading) return <PageLoader />;
  if (profile.error || !profile.data) return <p className="text-red-600">Failed to load profile.</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-medium text-brand-600">Coach workspace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-slate-500">Your business profile and report branding.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Building2 className="size-[18px]" />
            </span>
            Business profile
          </CardTitle>
          <CardDescription>Shown on generated client reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <Field label="Account">
              <Input value={profile.data.email} disabled />
            </Field>
            <Field label="Business name">
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Apex Performance" />
            </Field>
            <Field label="Specialties" hint="Comma-separated">
              <Input value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="strength, sport, hypertrophy" />
            </Field>
            <Field label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink shadow-soft placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                placeholder="Tell clients about your coaching approach…"
              />
            </Field>
            {error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-100">{error}</p>
            ) : null}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? <Spinner /> : <Save className="size-4" />} Save changes
              </Button>
              {saved ? <span className="text-sm text-brand-600">Saved ✓</span> : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <ImageIcon className="size-[18px]" />
            </span>
            Report logo
          </CardTitle>
          <CardDescription>Appears in the header of every PDF report.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="grid size-20 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {profile.data.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.data.logoUrl} alt="Logo" className="size-full object-contain" />
              ) : (
                <ImageIcon className="size-7 text-slate-300" />
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="block text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
                disabled={uploadLogo.isPending}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadLogo.mutate(f);
                }}
              />
              <p className="mt-1 text-xs text-slate-400">
                {uploadLogo.isPending ? 'Uploading…' : 'JPG/PNG/WebP'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
