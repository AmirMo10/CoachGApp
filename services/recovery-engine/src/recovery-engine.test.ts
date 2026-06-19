import { describe, expect, it } from 'vitest';
import { ExperienceLevel, Gender, Sport, AssessmentInput } from '@coachg/types';
import { calcRecoveryScore, generateRecoveryPlan } from './recovery-engine';

const good: AssessmentInput = {
  age: 30,
  gender: Gender.MALE,
  heightCm: 180,
  weightKg: 80,
  sport: Sport.NONE,
  experience: ExperienceLevel.INTERMEDIATE,
  injuries: [],
  mobilityRestrictions: [],
  equipment: [],
  trainingFrequency: 4,
  recoveryQuality: 9,
  sleepQuality: 9,
  stressLevel: 2,
};

const poor: AssessmentInput = { ...good, recoveryQuality: 3, sleepQuality: 3, stressLevel: 9 };

describe('recovery engine', () => {
  it('scores good recovery high and poor recovery low', () => {
    expect(calcRecoveryScore(good)).toBeGreaterThan(80);
    expect(calcRecoveryScore(poor)).toBeLessThan(40);
  });

  it('recommends a deload when recovery is poor', () => {
    expect(generateRecoveryPlan(poor).deloadRecommended).toBe(true);
    expect(generateRecoveryPlan(good).deloadRecommended).toBe(false);
  });

  it('adds knee-specific mobility when knee is restricted', () => {
    const plan = generateRecoveryPlan({ ...good, injuries: ['knee'] });
    expect(plan.mobilityRoutine.some((m) => m.toLowerCase().includes('knee') || m.toLowerCase().includes('couch'))).toBe(true);
  });
});
