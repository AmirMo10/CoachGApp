'use client';

import Link from 'next/link';
import { Dumbbell, Salad, HeartPulse, FileText, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand';
import { ThemeToggle, LanguageToggle } from '@/components/toggles';
import { useT } from '@/lib/i18n';

const FEATURES = [
  { icon: Dumbbell, title: 'Program Generator', desc: 'Rule engine + periodization + exercise DB. AI explains — it never decides the training.' },
  { icon: Salad, title: 'Nutrition Engine', desc: 'BMR, TDEE, macros, meal timing, and shopping lists — fully computed, not guessed.' },
  { icon: HeartPulse, title: 'Recovery Engine', desc: 'Sleep, hydration, mobility, a recovery score, and automatic deload guidance.' },
  { icon: FileText, title: 'Premium PDF Reports', desc: 'Client-ready reports professional enough to sell as a coaching service.' },
  { icon: ShieldCheck, title: 'Safe by design', desc: 'Injury & equipment screening built into the rule engine. Exercises only from the DB.' },
  { icon: Sparkles, title: 'AI personalization', desc: 'Claude adds voice and rationale on top of deterministic, tested logic.' },
];

export default function Home() {
  const { t } = useT();
  const [titleBefore, titleAfter] = t('landing.title').split('{h}');

  return (
    <main className="min-h-screen bg-ink text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />

        <div className="relative mx-auto max-w-6xl px-6">
          <header className="flex items-center justify-between py-6">
            <Logo light />
            <div className="flex items-center gap-2">
              <LanguageToggle className="border-white/15 bg-white/10 text-white hover:bg-white/20" />
              <Link href="/login">
                <Button variant="dark" size="sm">
                  {t('landing.login')}
                </Button>
              </Link>
            </div>
          </header>

          <section className="py-24 text-center md:py-32">
            <span className="eyebrow animate-fade-up">
              <Sparkles className="size-3.5" /> {t('landing.badge')}
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl animate-fade-up text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              {titleBefore}
              <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                {t('landing.titleHighlight')}
              </span>
              {titleAfter}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg text-slate-300">
              {t('landing.subtitle')}
            </p>
            <div className="mt-9 flex animate-fade-up flex-wrap items-center justify-center gap-3">
              <Link href="/login">
                <Button size="lg">
                  {t('landing.getStarted')} <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a href="https://code.claude.com/docs" target="_blank" rel="noreferrer">
                <Button variant="dark" size="lg">
                  {t('landing.docs')}
                </Button>
              </a>
            </div>
          </section>
        </div>
      </div>

      {/* Features */}
      <section className="bg-white py-20 text-ink dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">{t('landing.featuresTitle')}</h2>
            <p className="mt-3 text-slate-500">{t('landing.featuresSubtitle')}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-glow dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-gradient group-hover:text-white dark:bg-brand-500/15 dark:text-brand-400">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white py-10 text-center text-sm text-slate-400 dark:bg-slate-950">
        © {new Date().getFullYear()} Coach&quot;G&quot; — built for coaches.
      </footer>
    </main>
  );
}
