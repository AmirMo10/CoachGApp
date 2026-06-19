import Link from 'next/link';
import { Button } from '@/components/ui/button';

const FEATURES = [
  ['Program Generator', 'Rule engine + periodization + exercise DB. AI explains, never decides.'],
  ['Nutrition Engine', 'BMR, TDEE, macros, meals, and shopping lists — fully computed.'],
  ['Recovery Engine', 'Sleep, hydration, mobility, recovery score & deload guidance.'],
  ['Premium PDF Reports', 'Client-ready reports you can sell as a coaching service.'],
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-8 py-5 border-b">
        <span className="text-2xl font-bold">
          Coach<span className="text-brand">&quot;G&quot;</span>
        </span>
        <Link href="/coach">
          <Button>Coach Login</Button>
        </Link>
      </header>

      <section className="px-8 py-24 max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold tracking-tight text-ink">
          AI-powered coaching, <span className="text-brand">grounded in science.</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600">
          Generate personalized training programs, nutrition plans, recovery protocols, and premium
          athlete reports — automatically. The training logic is deterministic; AI only personalizes
          and explains.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/coach">
            <Button size="lg">Get Started</Button>
          </Link>
          <a href="https://code.claude.com/docs" target="_blank" rel="noreferrer">
            <Button size="lg" variant="outline">
              Documentation
            </Button>
          </a>
        </div>
      </section>

      <section className="px-8 pb-24 max-w-5xl mx-auto grid gap-6 sm:grid-cols-2">
        {FEATURES.map(([title, desc]) => (
          <div key={title} className="rounded-lg border p-6">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="mt-2 text-slate-600">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
