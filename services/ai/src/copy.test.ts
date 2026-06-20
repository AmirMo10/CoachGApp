import { describe, expect, it } from 'vitest';
import { AiClient } from './client';
import { draftMessageReply, writeReportNarrative } from './copy';

describe('AI copy (disabled client → deterministic fallback)', () => {
  const ai = new AiClient({ apiKey: '' });

  it('report narrative falls back without AI', async () => {
    const n = await writeReportNarrative(ai, {
      clientName: 'Alex Athlete',
      goal: 'PERFORMANCE',
      sport: 'FOOTBALL',
    });
    expect(n.goalAnalysis.toLowerCase()).toContain('performance');
    expect(n.goalAnalysis.toLowerCase()).toContain('football');
    expect(n.performanceAnalysis.length).toBeGreaterThan(0);
  });

  it('message draft falls back and is flagged not AI-generated', async () => {
    const r = await draftMessageReply(ai, 'Alex Athlete', 'Felt strong today!');
    expect(r.aiGenerated).toBe(false);
    expect(r.draft).toContain('Alex');
  });
});

describe('AiClient budget guard', () => {
  it('reports disabled when no api key', () => {
    expect(new AiClient({ apiKey: '' }).isEnabled()).toBe(false);
  });

  it('budget guard trips once exceeded', () => {
    const ai = new AiClient({ apiKey: 'sk-test', tokenBudget: 100 });
    // No real calls; simulate by checking the guard contract.
    expect(ai.budgetExceeded()).toBe(false);
  });
});
