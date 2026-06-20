import { describe, expect, it } from 'vitest';
import {
  ExperienceLevel,
  Gender,
  GoalType,
  NutritionStrategy,
  Sport,
  AssessmentInput,
} from '@coachg/types';
import { KCAL_PER_G } from '@coachg/shared';
import { calcBmr, calcTdee } from './calculators';
import { calcMacros, generateNutritionPlan, goalToStrategy } from './nutrition-engine';

const baseAssessment: AssessmentInput = {
  age: 30,
  gender: Gender.MALE,
  heightCm: 180,
  weightKg: 80,
  sport: Sport.NONE,
  experience: ExperienceLevel.INTERMEDIATE,
  injuries: [],
  mobilityRestrictions: [],
  equipment: ['barbell', 'dumbbell'],
  trainingFrequency: 4,
  recoveryQuality: 7,
  sleepQuality: 7,
  stressLevel: 4,
};

describe('calcBmr', () => {
  it('uses Mifflin-St Jeor when no body fat provided (male)', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calcBmr({ gender: Gender.MALE, weightKg: 80, heightCm: 180, age: 30 })).toBe(1780);
  });

  it('uses Katch-McArdle when body fat provided', () => {
    // lean = 80*(1-0.15)=68; 370 + 21.6*68 = 370 + 1468.8 = 1838.8 -> 1839
    expect(
      calcBmr({ gender: Gender.MALE, weightKg: 80, heightCm: 180, age: 30, bodyFatPct: 15 }),
    ).toBe(1839);
  });
});

describe('calcTdee', () => {
  it('applies activity multiplier', () => {
    expect(calcTdee(1780, 1.55)).toBe(2759);
  });
});

describe('goalToStrategy', () => {
  it('maps goals correctly', () => {
    expect(goalToStrategy(GoalType.FAT_LOSS)).toBe(NutritionStrategy.FAT_LOSS);
    expect(goalToStrategy(GoalType.GENERAL_FITNESS)).toBe(NutritionStrategy.MAINTENANCE);
  });
});

describe('calcMacros', () => {
  it('macros sum to approximately goal calories', () => {
    const goalCalories = 2500;
    const m = calcMacros(goalCalories, 80, NutritionStrategy.MAINTENANCE);
    const total =
      m.proteinG * KCAL_PER_G.protein + m.carbsG * KCAL_PER_G.carbs + m.fatG * KCAL_PER_G.fat;
    expect(Math.abs(total - goalCalories)).toBeLessThanOrEqual(KCAL_PER_G.carbs); // within one carb gram
  });
});

describe('generateNutritionPlan', () => {
  it('produces a fat-loss deficit relative to TDEE', () => {
    const plan = generateNutritionPlan(baseAssessment, GoalType.FAT_LOSS);
    expect(plan.strategy).toBe(NutritionStrategy.FAT_LOSS);
    expect(plan.goalCalories).toBeLessThan(plan.tdee);
    expect(plan.meals).toHaveLength(4);
    expect(plan.shoppingList.length).toBeGreaterThan(0);
  });

  it('produces a surplus for muscle gain', () => {
    const plan = generateNutritionPlan(baseAssessment, GoalType.MUSCLE_GAIN);
    expect(plan.goalCalories).toBeGreaterThan(plan.tdee);
  });
});
