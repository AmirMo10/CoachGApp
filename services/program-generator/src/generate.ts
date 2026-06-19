import {
  AssessmentInput,
  ExerciseDTO,
  GoalInput,
  PeriodizationModel,
  ProgramPlan,
} from '@coachg/types';
import { analyzeGoal } from './goal-analysis';
import { filterExercises } from './rule-engine';
import { buildPeriodization } from './periodization';
import { buildWeek } from './program-builder';

export interface GenerateProgramOptions {
  assessment: AssessmentInput;
  goal: GoalInput;
  library: ExerciseDTO[];
  periodization: PeriodizationModel;
  durationWeeks: number;
  daysPerWeek: number;
  /** optional seed for reproducible selection */
  seed?: number;
}

export class ProgramGenerationError extends Error {}

/**
 * Top-level deterministic program generation pipeline:
 *   Goal Analysis → Rule Engine → Periodization → Exercise Selection → Program Builder
 *
 * The output is a complete, valid program WITHOUT any AI. The AI explanation
 * layer is applied separately and can only add narrative — never change logic.
 */
export function generateProgram(opts: GenerateProgramOptions): ProgramPlan {
  const { assessment, goal, library, periodization, durationWeeks, daysPerWeek } = opts;
  const seed = opts.seed ?? 1;

  // 1. Goal analysis
  const prescription = analyzeGoal(goal.type, goal.sport, assessment.experience);

  // 2. Rule engine — safe, available candidate exercises only
  const { candidates } = filterExercises(library, assessment);
  if (candidates.length < 3) {
    throw new ProgramGenerationError(
      'Not enough safe, available exercises for this athlete. Expand the library or relax equipment/injury constraints.',
    );
  }

  // 3. Periodization skeleton
  const skeleton = buildPeriodization(periodization, durationWeeks);

  // 4 + 5. Exercise selection + program builder per week
  const weeks = skeleton.map((wk) =>
    buildWeek(wk, daysPerWeek, candidates, prescription, seed),
  );

  return {
    name: `${goal.type} • ${periodization} • ${durationWeeks}wk`,
    periodization,
    durationWeeks,
    daysPerWeek,
    weeks,
  };
}
