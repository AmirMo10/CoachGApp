import { AssessmentInput, ExerciseDTO } from '@coachg/types';

/**
 * Rule engine: filters the global exercise library down to a SAFE, AVAILABLE
 * candidate set for a given athlete. This is the safety layer the Sports
 * Scientist owns — it must never be overridden by AI.
 *
 * Filters applied:
 *  1. Equipment availability (exercise equipment ⊆ athlete equipment, or bodyweight)
 *  2. Injury / contraindication screening (exclude exercises contraindicated for an injury)
 *  3. Mobility restriction screening (treated like contraindications)
 *  4. Difficulty ceiling by experience level
 */

const DIFFICULTY_RANK: Record<string, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
};

const EXPERIENCE_CEILING: Record<string, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/** True if every piece of equipment the exercise needs is available to the athlete. */
function hasEquipment(exercise: ExerciseDTO, available: string[]): boolean {
  const avail = new Set(available.map(normalize));
  const needs = exercise.equipment.map(normalize).filter((e) => e && e !== 'bodyweight' && e !== 'none');
  return needs.every((e) => avail.has(e));
}

/** True if the exercise is contraindicated for any of the athlete's injuries/restrictions. */
function isContraindicated(exercise: ExerciseDTO, restrictions: string[]): boolean {
  if (exercise.contraindications.length === 0 || restrictions.length === 0) return false;
  const contra = new Set(exercise.contraindications.map(normalize));
  return restrictions.map(normalize).some((r) => contra.has(r));
}

export interface RuleEngineResult {
  candidates: ExerciseDTO[];
  excludedCount: number;
}

export function filterExercises(
  library: ExerciseDTO[],
  assessment: AssessmentInput,
): RuleEngineResult {
  const ceiling = EXPERIENCE_CEILING[assessment.experience] ?? 3;
  const restrictions = [...assessment.injuries, ...assessment.mobilityRestrictions];

  const candidates = library.filter((ex) => {
    if (DIFFICULTY_RANK[ex.difficulty]! > ceiling) return false;
    if (!hasEquipment(ex, assessment.equipment)) return false;
    if (isContraindicated(ex, restrictions)) return false;
    return true;
  });

  return { candidates, excludedCount: library.length - candidates.length };
}
