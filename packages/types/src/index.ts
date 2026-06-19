/**
 * @coachg/types — shared domain enums and contracts.
 *
 * These mirror the Prisma enums but live here so engines and the frontend can
 * import them without depending on the Prisma client. They are declared as
 * `const` objects + union types (rather than TS `enum`s) so they are
 * STRUCTURALLY compatible with the string values Prisma produces at runtime —
 * e.g. a Prisma `Gender` value flows directly into engine inputs typed `Gender`.
 * Value usage (`Gender.MALE`) and `z.nativeEnum` / `@IsEnum` all still work.
 */

export const Role = { ADMIN: 'ADMIN', COACH: 'COACH', CLIENT: 'CLIENT' } as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Gender = { MALE: 'MALE', FEMALE: 'FEMALE', OTHER: 'OTHER' } as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const ExperienceLevel = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const;
export type ExperienceLevel = (typeof ExperienceLevel)[keyof typeof ExperienceLevel];

export const GoalType = {
  FAT_LOSS: 'FAT_LOSS',
  MUSCLE_GAIN: 'MUSCLE_GAIN',
  RECOMP: 'RECOMP',
  PERFORMANCE: 'PERFORMANCE',
  GENERAL_FITNESS: 'GENERAL_FITNESS',
} as const;
export type GoalType = (typeof GoalType)[keyof typeof GoalType];

export const Sport = {
  NONE: 'NONE',
  FOOTBALL: 'FOOTBALL',
  BASKETBALL: 'BASKETBALL',
  VOLLEYBALL: 'VOLLEYBALL',
  COMBAT: 'COMBAT',
  RUNNING: 'RUNNING',
} as const;
export type Sport = (typeof Sport)[keyof typeof Sport];

export const PeriodizationModel = {
  LINEAR: 'LINEAR',
  BLOCK: 'BLOCK',
  UNDULATING: 'UNDULATING',
} as const;
export type PeriodizationModel = (typeof PeriodizationModel)[keyof typeof PeriodizationModel];

export const ProgramPhase = {
  ACCUMULATION: 'ACCUMULATION',
  INTENSIFICATION: 'INTENSIFICATION',
  REALIZATION: 'REALIZATION',
  DELOAD: 'DELOAD',
} as const;
export type ProgramPhase = (typeof ProgramPhase)[keyof typeof ProgramPhase];

export const MovementPattern = {
  SQUAT: 'SQUAT',
  HINGE: 'HINGE',
  LUNGE: 'LUNGE',
  HORIZONTAL_PUSH: 'HORIZONTAL_PUSH',
  VERTICAL_PUSH: 'VERTICAL_PUSH',
  HORIZONTAL_PULL: 'HORIZONTAL_PULL',
  VERTICAL_PULL: 'VERTICAL_PULL',
  CARRY: 'CARRY',
  ROTATION: 'ROTATION',
  GAIT: 'GAIT',
  PLYOMETRIC: 'PLYOMETRIC',
  CONDITIONING: 'CONDITIONING',
} as const;
export type MovementPattern = (typeof MovementPattern)[keyof typeof MovementPattern];

export const Difficulty = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const NutritionStrategy = {
  FAT_LOSS: 'FAT_LOSS',
  MAINTENANCE: 'MAINTENANCE',
  MUSCLE_GAIN: 'MUSCLE_GAIN',
  RECOMP: 'RECOMP',
} as const;
export type NutritionStrategy = (typeof NutritionStrategy)[keyof typeof NutritionStrategy];

export const ActivityLevel = {
  SEDENTARY: 'SEDENTARY',
  LIGHT: 'LIGHT',
  MODERATE: 'MODERATE',
  ACTIVE: 'ACTIVE',
  VERY_ACTIVE: 'VERY_ACTIVE',
} as const;
export type ActivityLevel = (typeof ActivityLevel)[keyof typeof ActivityLevel];

/** Minimal exercise shape the engines consume from the DB. */
export interface ExerciseDTO {
  id: string;
  slug: string;
  name: string;
  equipment: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  movementPattern: MovementPattern;
  difficulty: Difficulty;
  contraindications: string[];
  coachingCues: string[];
  sportTransferTags: string[];
}

/** Assessment input consumed by the rule/nutrition engines. */
export interface AssessmentInput {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;
  sport: Sport;
  experience: ExperienceLevel;
  injuries: string[];
  mobilityRestrictions: string[];
  equipment: string[];
  trainingFrequency: number;
  recoveryQuality: number; // 1-10
  sleepQuality: number; // 1-10
  stressLevel: number; // 1-10
}

export interface GoalInput {
  type: GoalType;
  sport: Sport;
  timeframeWeeks?: number;
  targetMetrics?: Record<string, number>;
}

// ── Nutrition engine output ──
export interface MacroTargets {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface NutritionResult {
  strategy: NutritionStrategy;
  bmr: number;
  tdee: number;
  goalCalories: number;
  macros: MacroTargets;
  mealTiming: { slot: string; calories: number }[];
  meals: MealSuggestion[];
  shoppingList: string[];
}

export interface MealSuggestion {
  name: string;
  slot: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  items: string[];
}

// ── Program engine output ──
export interface ProgramExercisePrescription {
  exerciseId: string;
  exerciseName: string;
  order: number;
  sets: number;
  reps: string;
  loadPctOf1RM?: number;
  rpe?: number;
  tempo?: string;
  restSeconds: number;
  progressionRule?: string;
}

export interface ProgramDayPlan {
  dayIndex: number;
  focus: string;
  warmup: string[];
  exercises: ProgramExercisePrescription[];
  conditioning?: string[];
}

export interface ProgramWeekPlan {
  weekIndex: number;
  phase: ProgramPhase;
  volumeMultiplier: number;
  intensityMultiplier: number;
  isDeload: boolean;
  days: ProgramDayPlan[];
}

export interface ProgramPlan {
  name: string;
  periodization: PeriodizationModel;
  durationWeeks: number;
  daysPerWeek: number;
  weeks: ProgramWeekPlan[];
}

// ── Recovery engine output ──
export interface RecoveryResult {
  sleepTargetHours: number;
  hydrationLiters: number;
  mobilityRoutine: string[];
  recoveryScore: number; // 0-100
  deloadRecommended: boolean;
  recommendations: string[];
}
