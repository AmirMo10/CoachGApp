import { describe, expect, it } from 'vitest';
import {
  Difficulty,
  ExerciseDTO,
  ExperienceLevel,
  Gender,
  GoalType,
  MovementPattern,
  PeriodizationModel,
  Sport,
  AssessmentInput,
} from '@coachg/types';
import { filterExercises } from './rule-engine';
import { buildPeriodization } from './periodization';
import { generateProgram } from './generate';

function makeExercise(partial: Partial<ExerciseDTO> & { id: string }): ExerciseDTO {
  return {
    slug: partial.id,
    name: partial.id,
    equipment: [],
    primaryMuscles: [],
    secondaryMuscles: [],
    movementPattern: MovementPattern.SQUAT,
    difficulty: Difficulty.BEGINNER,
    contraindications: [],
    coachingCues: [],
    sportTransferTags: [],
    ...partial,
  };
}

const library: ExerciseDTO[] = [
  makeExercise({ id: 'goblet-squat', movementPattern: MovementPattern.SQUAT, equipment: ['dumbbell'] }),
  makeExercise({ id: 'rdl', movementPattern: MovementPattern.HINGE, equipment: ['barbell'] }),
  makeExercise({ id: 'bench', movementPattern: MovementPattern.HORIZONTAL_PUSH, equipment: ['barbell'] }),
  makeExercise({ id: 'ohp', movementPattern: MovementPattern.VERTICAL_PUSH, equipment: ['barbell'] }),
  makeExercise({ id: 'row', movementPattern: MovementPattern.HORIZONTAL_PULL, equipment: ['barbell'] }),
  makeExercise({ id: 'pullup', movementPattern: MovementPattern.VERTICAL_PULL, equipment: ['pullup-bar'] }),
  makeExercise({
    id: 'box-jump',
    movementPattern: MovementPattern.PLYOMETRIC,
    equipment: ['box'],
    sportTransferTags: ['vertical-jump', 'plyometric'],
  }),
  makeExercise({
    id: 'barbell-squat',
    movementPattern: MovementPattern.SQUAT,
    equipment: ['barbell'],
    difficulty: Difficulty.ADVANCED,
    contraindications: ['knee'],
  }),
];

const assessment: AssessmentInput = {
  age: 28,
  gender: Gender.MALE,
  heightCm: 178,
  weightKg: 82,
  sport: Sport.NONE,
  experience: ExperienceLevel.INTERMEDIATE,
  injuries: ['knee'],
  mobilityRestrictions: [],
  equipment: ['dumbbell', 'barbell', 'pullup-bar', 'box'],
  trainingFrequency: 4,
  recoveryQuality: 7,
  sleepQuality: 7,
  stressLevel: 4,
};

describe('rule engine', () => {
  it('excludes contraindicated and too-advanced exercises', () => {
    const { candidates } = filterExercises(library, assessment);
    const ids = candidates.map((c) => c.id);
    // barbell-squat is ADVANCED + contraindicated for knee → excluded for intermediate w/ knee injury
    expect(ids).not.toContain('barbell-squat');
    expect(ids).toContain('goblet-squat');
  });

  it('excludes exercises requiring unavailable equipment', () => {
    const noEquip = { ...assessment, equipment: ['dumbbell'] };
    const { candidates } = filterExercises(library, noEquip);
    expect(candidates.map((c) => c.id)).toEqual(['goblet-squat']);
  });
});

describe('periodization', () => {
  it('marks every 4th week as deload', () => {
    const weeks = buildPeriodization(PeriodizationModel.LINEAR, 8);
    expect(weeks).toHaveLength(8);
    expect(weeks[3]!.isDeload).toBe(true);
    expect(weeks[7]!.isDeload).toBe(true);
    expect(weeks[0]!.isDeload).toBe(false);
  });
});

describe('generateProgram', () => {
  it('produces a complete, valid program with no AI', () => {
    const program = generateProgram({
      assessment,
      goal: { type: GoalType.MUSCLE_GAIN, sport: Sport.NONE },
      library,
      periodization: PeriodizationModel.UNDULATING,
      durationWeeks: 8,
      daysPerWeek: 4,
    });

    expect(program.weeks).toHaveLength(8);
    for (const week of program.weeks) {
      expect(week.days).toHaveLength(4);
      for (const day of week.days) {
        expect(day.exercises.length).toBeGreaterThan(0);
        for (const ex of day.exercises) {
          expect(ex.sets).toBeGreaterThan(0);
          expect(ex.reps).toBeTruthy();
        }
      }
    }
  });

  it('is reproducible for a fixed seed', () => {
    const opts = {
      assessment,
      goal: { type: GoalType.MUSCLE_GAIN, sport: Sport.NONE },
      library,
      periodization: PeriodizationModel.LINEAR,
      durationWeeks: 4,
      daysPerWeek: 3,
      seed: 42,
    };
    const a = generateProgram(opts);
    const b = generateProgram(opts);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('throws when too few safe exercises exist', () => {
    expect(() =>
      generateProgram({
        assessment: { ...assessment, equipment: [] },
        goal: { type: GoalType.MUSCLE_GAIN, sport: Sport.NONE },
        library,
        periodization: PeriodizationModel.LINEAR,
        durationWeeks: 4,
        daysPerWeek: 3,
      }),
    ).toThrow();
  });
});
