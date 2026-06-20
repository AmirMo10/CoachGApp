import { ExerciseDTO, MovementPattern } from '@coachg/types';
import { TrainingPrescription } from './goal-analysis';

/**
 * Exercise selection: picks exercises ONLY from the rule-engine candidate set.
 * It never invents exercises. Selection is scored deterministically by:
 *  - movement-pattern emphasis (from goal analysis)
 *  - sport-transfer tag overlap (for sport goals)
 *  - de-duplication so a day isn't all the same pattern
 *
 * Selection is seedable for reproducible programs.
 */

/** Simple deterministic PRNG (mulberry32) so programs are reproducible. */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scoreExercise(
  ex: ExerciseDTO,
  pattern: MovementPattern,
  sportTags: string[],
): number {
  let score = 0;
  if (ex.movementPattern === pattern) score += 10;
  if (sportTags.length) {
    const overlap = ex.sportTransferTags.filter((t) => sportTags.includes(t)).length;
    score += overlap * 3;
  }
  return score;
}

/**
 * Pick `count` exercises for a day, distributing across the prescription's
 * emphasised patterns. Returns selected exercises in order.
 */
export function selectExercisesForDay(
  candidates: ExerciseDTO[],
  prescription: TrainingPrescription,
  count: number,
  seed: number,
): ExerciseDTO[] {
  const rng = mulberry32(seed);
  const used = new Set<string>();
  const selected: ExerciseDTO[] = [];
  const patterns = prescription.patternEmphasis;

  for (let slot = 0; slot < count; slot++) {
    const pattern = patterns[slot % patterns.length]!;

    const ranked = candidates
      .filter((ex) => !used.has(ex.id))
      .map((ex) => ({ ex, score: scoreExercise(ex, pattern, prescription.sportTags) }))
      .sort((a, b) => b.score - a.score);

    if (ranked.length === 0) break;

    // Pick from the top tier with deterministic jitter to add variety.
    const topScore = ranked[0]!.score;
    const topTier = ranked.filter((r) => r.score >= topScore - 1);
    const chosen = topTier[Math.floor(rng() * topTier.length)]!.ex;

    used.add(chosen.id);
    selected.push(chosen);
  }

  return selected;
}
