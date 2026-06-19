import {
  ExerciseDTO,
  ProgramDayPlan,
  ProgramExercisePrescription,
  ProgramWeekPlan,
} from '@coachg/types';
import { clamp, round } from '@coachg/shared';
import { TrainingPrescription } from './goal-analysis';
import { WeekSkeleton } from './periodization';
import { selectExercisesForDay } from './exercise-selection';

/** Day focus labels rotated across the training week by split size. */
const SPLITS: Record<number, string[]> = {
  2: ['Full Body A', 'Full Body B'],
  3: ['Lower', 'Upper', 'Full Body'],
  4: ['Lower', 'Upper', 'Lower', 'Upper'],
  5: ['Lower', 'Push', 'Pull', 'Lower', 'Upper'],
  6: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'],
};

const EXERCISES_PER_DAY = 5;

function buildExercisePrescriptions(
  exercises: ExerciseDTO[],
  prescription: TrainingPrescription,
  week: WeekSkeleton,
): ProgramExercisePrescription[] {
  const [repMin, repMax] = prescription.repRange;
  const [loadMin, loadMax] = prescription.loadBand;

  // Volume multiplier scales sets; intensity multiplier scales load band.
  const sets = clamp(Math.round(prescription.sets * week.volumeMultiplier), 2, 6);
  const load = clamp(
    round(((loadMin + loadMax) / 2) * week.intensityMultiplier, 2),
    0.4,
    0.95,
  );

  return exercises.map((ex, i) => ({
    exerciseId: ex.id,
    exerciseName: ex.name,
    order: i + 1,
    sets,
    reps: `${repMin}-${repMax}`,
    loadPctOf1RM: load,
    tempo: '2-0-1',
    restSeconds: prescription.restSeconds,
    progressionRule:
      'Add load when top of rep range is hit on all sets with good form (double progression).',
  }));
}

export function buildWeek(
  skeleton: WeekSkeleton,
  daysPerWeek: number,
  candidates: ExerciseDTO[],
  prescription: TrainingPrescription,
  seedBase: number,
): ProgramWeekPlan {
  const focusLabels = SPLITS[daysPerWeek] ?? SPLITS[4]!;
  const days: ProgramDayPlan[] = [];

  for (let d = 0; d < daysPerWeek; d++) {
    // Seed combines week + day so selection is reproducible yet varied.
    const seed = seedBase + skeleton.weekIndex * 100 + d;
    const exercises = selectExercisesForDay(candidates, prescription, EXERCISES_PER_DAY, seed);
    days.push({
      dayIndex: d + 1,
      focus: focusLabels[d % focusLabels.length]!,
      warmup: ['5 min easy cardio', 'Dynamic mobility for target areas', '2 ramp-up sets'],
      exercises: buildExercisePrescriptions(exercises, prescription, skeleton),
      conditioning: skeleton.isDeload ? ['Light Zone-2 cardio 15 min'] : undefined,
    });
  }

  return {
    weekIndex: skeleton.weekIndex,
    phase: skeleton.phase,
    volumeMultiplier: skeleton.volumeMultiplier,
    intensityMultiplier: skeleton.intensityMultiplier,
    isDeload: skeleton.isDeload,
    days,
  };
}
