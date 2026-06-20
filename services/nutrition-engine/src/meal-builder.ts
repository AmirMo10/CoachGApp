import { MacroTargets, MealSuggestion } from '@coachg/types';
import { round } from '@coachg/shared';

/**
 * Template meals per slot. Items are illustrative examples a coach can swap.
 * Macros are proportionally distributed from the day's totals.
 */
const MEAL_TEMPLATES: Record<string, { name: string; items: string[] }> = {
  breakfast: {
    name: 'High-protein breakfast',
    items: ['Eggs', 'Oats', 'Berries', 'Greek yogurt'],
  },
  lunch: {
    name: 'Balanced lunch',
    items: ['Chicken breast', 'Rice', 'Mixed vegetables', 'Olive oil'],
  },
  'pre/post-workout': {
    name: 'Performance fuel',
    items: ['Whey protein', 'Banana', 'Rice cakes'],
  },
  dinner: {
    name: 'Recovery dinner',
    items: ['Salmon', 'Sweet potato', 'Greens', 'Avocado'],
  },
};

export function buildMeals(
  timing: { slot: string; calories: number }[],
  dayMacros: MacroTargets,
  dayCalories: number,
): MealSuggestion[] {
  return timing.map(({ slot, calories }) => {
    const ratio = dayCalories > 0 ? calories / dayCalories : 0;
    const tpl = MEAL_TEMPLATES[slot] ?? { name: slot, items: [] };
    return {
      name: tpl.name,
      slot,
      calories,
      proteinG: round(dayMacros.proteinG * ratio, 0),
      carbsG: round(dayMacros.carbsG * ratio, 0),
      fatG: round(dayMacros.fatG * ratio, 0),
      items: tpl.items,
    };
  });
}

export function buildShoppingList(meals: MealSuggestion[]): string[] {
  const set = new Set<string>();
  for (const meal of meals) {
    for (const item of meal.items) set.add(item);
  }
  return [...set].sort();
}
