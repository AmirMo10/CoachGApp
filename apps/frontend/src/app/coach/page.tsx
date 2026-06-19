import { Button } from '@/components/ui/button';

/**
 * Coach dashboard (scaffold). In Phase 2 this is wired to NextAuth/Keycloak and
 * fetches clients from the API with the session token. For now it renders the
 * shell so the layout and routing are in place.
 */
export default function CoachDashboard() {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-8 py-5 border-b">
        <span className="text-xl font-bold">
          Coach<span className="text-brand">&quot;G&quot;</span> · Dashboard
        </span>
        <Button variant="outline">New Client</Button>
      </header>

      <div className="px-8 py-10 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold">Your Clients</h1>
        <p className="text-slate-600 mt-1">
          Manage athletes, run assessments, and generate programs, nutrition, and recovery plans.
        </p>

        <div className="mt-8 rounded-lg border divide-y">
          {/* Placeholder rows — replaced by live data from GET /clients in Phase 2. */}
          {['Alex Athlete', 'Sam Sprinter'].map((name) => (
            <div key={name} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="font-medium">{name}</div>
                <div className="text-sm text-slate-500">Last assessment: this week</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  View
                </Button>
                <Button size="sm">Generate Program</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
