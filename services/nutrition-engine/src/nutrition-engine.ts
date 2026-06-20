import {
  AssessmentInput,
  GoalType,
  MacroTargets,
  NutritionResult,
  NutritionStrategy,
} from '@coachg/types';
import {
  ACTIVITY_MULTIPLIERS,
  CALORIE_ADJUSTMENT,
  FAT_G_PER_KG,
  KCAL_PER_G,
  PROTEIN_G_PER_KG,
  frequencyToActivity,
  round,
} from '@coachg/shared';
import { calcBmr, calcTdee } from './calculators';
import { buildMeals, buildShoppingList } from './meal-builder';

/** Map a high-level training goal to a nutrition strategy. */
export function goalToStrategy(goal: GoalType): NutritionStrategy {
  switch (goal) {
    case GoalType.FAT_LOSS:
      return NutritionStrategy.FAT_LOSS;
    case GoalType.MUSCLE_GAIN:
      return NutritionStrategy.MUSCLE_GAIN;
    case GoalType.RECOMP:
      return NutritionStrategy.RECOMP;
    default:
      return NutritionStrategy.MAINTENANCE;
  }
}

/** Compute macros from calories + bodyweight. Protein & fat anchored to BW; carbs fill remainder. */
export function calcMacros(
  goalCalories: number,
  weightKg: number,
  strategy: NutritionStrategy,
): MacroTargets {
  const proteinG = round(PROTEIN_G_PER_KG[strategy] * weightKg, 0);
  const fatG = round(FAT_G_PER_KG * weightKg, 0);
  const proteinKcal = proteinG * KCAL_PER_G.protein;
  const fatKcal = fatG * KCAL_PER_G.fat;
  const carbsKcal = Math.max(0, goalCalories - proteinKcal - fatKcal);
  const carbsG = round(carbsKcal / KCAL_PER_G.carbs, 0);
  return { proteinG, carbsG, fatG };
}

/**
 * Deterministic nutrition plan generation. No AI involved — Claude may later
 * add narrative notes, but every number here is computed.
 */
export function generateNutritionPlan(
  assessment: AssessmentInput,
  goal: GoalType,
): NutritionResult {
  const strategy = goalToStrategy(goal);
  const bmr = calcBmr({
    gender: assessment.gender,
    weightKg: assessment.weightKg,
    heightCm: assessment.heightCm,
    age: assessment.age,
    bodyFatPct: assessment.bodyFatPct,
  });

  const activity = frequencyToActivity(assessment.trainingFrequency);
  const tdee = calcTdee(bmr, ACTIVITY_MULTIPLIERS[activity]);
  const goalCalories = round(tdee * (1 + CALORIE_ADJUSTMENT[strategy]), 0);
  const macros = calcMacros(goalCalories, assessment.weightKg, strategy);

  // Distribute calories across 4 meals (40/30/30 style split adapted to 4 slots).
  const mealTiming = [
    { slot: 'breakfast', calories: round(goalCalories * 0.25, 0) },
    { slot: 'lunch', calories: round(goalCalories * 0.3, 0) },
    { slot: 'pre/post-workout', calories: round(goalCalories * 0.2, 0) },
    { slot: 'dinner', calories: round(goalCalories * 0.25, 0) },
  ];

  const meals = buildMeals(mealTiming, macros, goalCalories);
  const shoppingList = buildShoppingList(meals);

  return { strategy, bmr, tdee, goalCalories, macros, mealTiming, meals, shoppingList };
}
