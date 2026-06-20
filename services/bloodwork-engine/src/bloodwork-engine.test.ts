import { describe, expect, it } from 'vitest';
import { analyzeMarker, analyzePanel } from './bloodwork-engine';

describe('bloodwork engine', () => {
  it('flags high fasting glucose with educational insight + disclaimer', () => {
    const r = analyzeMarker({ type: 'FASTING_GLUCOSE', value: 120 });
    expect(r.flag).toBe('HIGH');
    expect(r.unit).toBe('mg/dL');
    expect(r.disclaimer.toLowerCase()).toContain('not medical advice');
    expect(r.insight).toBeTruthy();
  });

  it('flags low vitamin D', () => {
    expect(analyzeMarker({ type: 'VITAMIN_D', value: 18 }).flag).toBe('LOW');
  });

  it('marks normal values within range', () => {
    expect(analyzeMarker({ type: 'HBA1C', value: 5.2 }).flag).toBe('NORMAL');
  });

  it('respects caller-supplied reference ranges', () => {
    const r = analyzeMarker({ type: 'FERRITIN', value: 25, referenceLow: 20, referenceHigh: 200 });
    expect(r.flag).toBe('NORMAL');
  });

  it('never diagnoses — output is insight + disclaimer only', () => {
    const panel = analyzePanel([
      { type: 'LDL', value: 160 },
      { type: 'HDL', value: 35 },
    ]);
    expect(panel).toHaveLength(2);
    for (const m of panel) {
      expect(m.disclaimer).toBeTruthy();
      expect(m.insight.toLowerCase()).not.toContain('you have');
    }
  });
});
