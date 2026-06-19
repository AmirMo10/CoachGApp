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
import { getSportProtocol } from './sport-performance';
import { generateProgram } from './generate';

describe('sport performance', () => {
  it('returns football qualities + blocks', () => {
    const p = getSportProtocol(Sport.FOOTBALL);
    expect(p.qualities).toContain('acceleration');
    expect(p.blocks.length).toBeGreaterThan(0);
  });

  it('returns empty protocol for NONE', () => {
    expect(getSportProtocol(Sport.NONE).blocks).toHaveLength(0);
  });
});

function ex(id: string, pattern: MovementPattern, tags: string[] = []): ExerciseDTO {
  return {
    id,
    slug: id,
    name: id,
    equipment: [],
    primaryMuscles: [],
    secondaryMuscles: [],
    movementPattern: pattern,
    difficulty: Difficulty.BEGINNER,
    contraindications: [],
    coachingCues: [],
    sportTransferTags: tags,
  };
}

describe('generateProgram with sport', () => {
  it('injects sport conditioning blocks on non-deload days', () => {
    const assessment: AssessmentInput = {
      age: 24,
      gender: Gender.MALE,
      heightCm: 180,
      weightKg: 78,
      sport: Sport.FOOTBALL,
      experience: ExperienceLevel.INTERMEDIATE,
      injuries: [],
      mobilityRestrictions: [],
      equipment: [],
      trainingFrequency: 4,
      recoveryQuality: 7,
      sleepQuality: 7,
      stressLevel: 4,
    };
    const library = [
      ex('squat', MovementPattern.SQUAT),
      ex('hinge', MovementPattern.HINGE),
      ex('push', MovementPattern.HORIZONTAL_PUSH),
      ex('pull', MovementPattern.HORIZONTAL_PULL),
      ex('sprint', MovementPattern.GAIT, ['sprint', 'acceleration']),
    ];

    const program = generateProgram({
      assessment,
      goal: { type: GoalType.PERFORMANCE, sport: Sport.FOOTBALL },
      library,
      periodization: PeriodizationModel.LINEAR,
      durationWeeks: 4,
      daysPerWeek: 3,
    });

    const week1 = program.weeks[0]!;
    const hasConditioning = week1.days.some((d) => (d.conditioning?.length ?? 0) > 0);
    expect(hasConditioning).toBe(true);
  });
});
