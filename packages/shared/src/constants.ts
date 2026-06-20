import { ActivityLevel, ExperienceLevel, NutritionStrategy } from '@coachg/types';

/** Mifflin-St Jeor activity multipliers for TDEE. */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHT]: 1.375,
  [ActivityLevel.MODERATE]: 1.55,
  [ActivityLevel.ACTIVE]: 1.725,
  [ActivityLevel.VERY_ACTIVE]: 1.9,
};

/** Map training frequency (sessions/week) → activity level. */
export function frequencyToActivity(freq: number): ActivityLevel {
  if (freq <= 1) return ActivityLevel.SEDENTARY;
  if (freq <= 3) return ActivityLevel.LIGHT;
  if (freq <= 4) return ActivityLevel.MODERATE;
  if (freq <= 5) return ActivityLevel.ACTIVE;
  return ActivityLevel.VERY_ACTIVE;
}

/** Calorie adjustment (fraction of TDEE) per nutrition strategy. */
export const CALORIE_ADJUSTMENT: Record<NutritionStrategy, number> = {
  [NutritionStrategy.FAT_LOSS]: -0.2,
  [NutritionStrategy.MAINTENANCE]: 0,
  [NutritionStrategy.MUSCLE_GAIN]: 0.1,
  [NutritionStrategy.RECOMP]: -0.05,
};

/** Protein target grams per kg of bodyweight per strategy. */
export const PROTEIN_G_PER_KG: Record<NutritionStrategy, number> = {
  [NutritionStrategy.FAT_LOSS]: 2.2,
  [NutritionStrategy.MAINTENANCE]: 1.8,
  [NutritionStrategy.MUSCLE_GAIN]: 2.0,
  [NutritionStrategy.RECOMP]: 2.2,
};

/** Fat target grams per kg of bodyweight (remainder goes to carbs). */
export const FAT_G_PER_KG = 0.9;

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

/** Default sets per exercise by experience level. */
export const SETS_BY_EXPERIENCE: Record<ExperienceLevel, number> = {
  [ExperienceLevel.BEGINNER]: 3,
  [ExperienceLevel.INTERMEDIATE]: 4,
  [ExperienceLevel.ADVANCED]: 5,
};

export const MEDICAL_DISCLAIMER =
  'This information is educational only and is not medical advice, diagnosis, or treatment. ' +
  'Always consult a qualified healthcare professional regarding bloodwork and health decisions.';
