import { describe, expect, it } from 'vitest';
import { PeriodizationModel, ProgramPhase, ProgramPlan } from '@coachg/types';
import { AiClient } from './client';
import { explainProgram, templatedExplanation } from './explain-program';

const program: ProgramPlan = {
  name: 'Test',
  periodization: PeriodizationModel.LINEAR,
  durationWeeks: 8,
  daysPerWeek: 4,
  weeks: [
    {
      weekIndex: 4,
      phase: ProgramPhase.DELOAD,
      volumeMultiplier: 0.6,
      intensityMultiplier: 0.9,
      isDeload: true,
      days: [],
    },
  ],
};

describe('explainProgram', () => {
  it('falls back to templated text when AI is disabled', async () => {
    const ai = new AiClient({ apiKey: '' }); // disabled
    expect(ai.isEnabled()).toBe(false);
    const text = await explainProgram(ai, program);
    expect(text).toContain('8-week');
    expect(text.toLowerCase()).toContain('deload');
  });

  it('templated explanation mentions periodization', () => {
    expect(templatedExplanation(program).toLowerCase()).toContain('linear');
  });
});
