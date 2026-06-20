import { describe, expect, it } from 'vitest';
import { clamp, lerp, round } from './math';
import { frequencyToActivity } from './constants';
import { ActivityLevel } from '@coachg/types';

describe('math', () => {
  it('rounds to decimals', () => {
    expect(round(1.2345, 2)).toBe(1.23);
    expect(round(1780.4)).toBe(1780);
  });

  it('clamps within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('lerps and clamps t', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 2)).toBe(10);
  });
});

describe('frequencyToActivity', () => {
  it('maps training frequency to activity level', () => {
    expect(frequencyToActivity(1)).toBe(ActivityLevel.SEDENTARY);
    expect(frequencyToActivity(4)).toBe(ActivityLevel.MODERATE);
    expect(frequencyToActivity(6)).toBe(ActivityLevel.VERY_ACTIVE);
  });
});
