import { ExperienceLevel, GoalType, MovementPattern, Sport } from '@coachg/types';
import { SETS_BY_EXPERIENCE } from '@coachg/shared';

/**
 * Goal analysis: translates a goal + experience into deterministic training
 * priorities. This is pure rule logic — no AI.
 */
export interface TrainingPrescription {
  /** rep range as [min, max] */
  repRange: [number, number];
  /** % of 1RM band [min, max] */
  loadBand: [number, number];
  /** rest seconds between sets */
  restSeconds: number;
  /** default sets per main exercise */
  sets: number;
  /** ordered emphasis of movement patterns for selection */
  patternEmphasis: MovementPattern[];
  /** sport-transfer tags to prioritise (empty for non-sport goals) */
  sportTags: string[];
}

const SPORT_TAGS: Record<Sport, string[]> = {
  [Sport.NONE]: [],
  [Sport.FOOTBALL]: [
    'sprint',
    'acceleration',
    'max-velocity',
    'agility',
    'change-of-direction',
    'plyometric',
    'hamstring-prevention',
  ],
  [Sport.BASKETBALL]: ['vertical-jump', 'reactive-strength', 'agility', 'plyometric'],
  [Sport.VOLLEYBALL]: ['vertical-jump', 'reactive-strength', 'shoulder-health'],
  [Sport.COMBAT]: ['strength-endurance', 'power', 'conditioning', 'rotational-power'],
  [Sport.RUNNING]: ['aerobic', 'running-economy', 'speed', 'single-leg-stability'],
};

export function analyzeGoal(
  goal: GoalType,
  sport: Sport,
  experience: ExperienceLevel,
): TrainingPrescription {
  const sets = SETS_BY_EXPERIENCE[experience];
  const sportTags = SPORT_TAGS[sport] ?? [];

  const base: Record<GoalType, Omit<TrainingPrescription, 'sets' | 'sportTags'>> = {
    [GoalType.FAT_LOSS]: {
      repRange: [10, 15],
      loadBand: [0.55, 0.7],
      restSeconds: 60,
      patternEmphasis: [
        MovementPattern.SQUAT,
        MovementPattern.HINGE,
        MovementPattern.HORIZONTAL_PUSH,
        MovementPattern.HORIZONTAL_PULL,
        MovementPattern.CONDITIONING,
      ],
    },
    [GoalType.MUSCLE_GAIN]: {
      repRange: [8, 12],
      loadBand: [0.65, 0.8],
      restSeconds: 90,
      patternEmphasis: [
        MovementPattern.SQUAT,
        MovementPattern.HINGE,
        MovementPattern.HORIZONTAL_PUSH,
        MovementPattern.VERTICAL_PUSH,
        MovementPattern.HORIZONTAL_PULL,
        MovementPattern.VERTICAL_PULL,
      ],
    },
    [GoalType.RECOMP]: {
      repRange: [8, 12],
      loadBand: [0.6, 0.75],
      restSeconds: 75,
      patternEmphasis: [
        MovementPattern.SQUAT,
        MovementPattern.HINGE,
        MovementPattern.HORIZONTAL_PUSH,
        MovementPattern.VERTICAL_PULL,
        MovementPattern.CONDITIONING,
      ],
    },
    [GoalType.PERFORMANCE]: {
      repRange: [3, 6],
      loadBand: [0.8, 0.92],
      restSeconds: 180,
      patternEmphasis: [
        MovementPattern.PLYOMETRIC,
        MovementPattern.SQUAT,
        MovementPattern.HINGE,
        MovementPattern.VERTICAL_PUSH,
        MovementPattern.HORIZONTAL_PULL,
      ],
    },
    [GoalType.GENERAL_FITNESS]: {
      repRange: [8, 12],
      loadBand: [0.6, 0.75],
      restSeconds: 75,
      patternEmphasis: [
        MovementPattern.SQUAT,
        MovementPattern.HINGE,
        MovementPattern.HORIZONTAL_PUSH,
        MovementPattern.HORIZONTAL_PULL,
        MovementPattern.CARRY,
      ],
    },
  };

  return { ...base[goal], sets, sportTags };
}
