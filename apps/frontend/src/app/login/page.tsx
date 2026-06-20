'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Dumbbell, Salad, HeartPulse } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Logo } from '@/components/brand';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('coach@coachg.dev');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative">
          <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight">
            Generate a complete coaching program in seconds.
          </h2>
          <div className="mt-8 space-y-3">
            {[
              [Dumbbell, 'Periodized training from a 1000+ exercise library'],
              [Salad, 'Macros & meal plans computed, never guessed'],
              [HeartPulse, 'Recovery scoring with automatic deloads'],
            ].map(([Icon, text], i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <span className="grid size-9 place-items-center rounded-xl glass text-brand-300">
                  <Icon className="size-[18px]" />
                </span>
                <span className="text-sm">{text as string}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-slate-400">Self-hosted · ArvanCloud · OWASP-aligned</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-[var(--background)] px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your coach workspace.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Field label="Email">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </Field>
            <Field label="Password">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </Field>
            {error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-100">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Spinner /> : <>Sign in <ArrowRight className="size-4" /></>}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-3 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Demo:</span> coach@coachg.dev / password123
          </div>
          <Link href="/" className="mt-6 inline-block text-sm text-slate-500 hover:text-brand-600">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
