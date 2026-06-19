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
export declare const Role: {
    readonly ADMIN: "ADMIN";
    readonly COACH: "COACH";
    readonly CLIENT: "CLIENT";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const Gender: {
    readonly MALE: "MALE";
    readonly FEMALE: "FEMALE";
    readonly OTHER: "OTHER";
};
export type Gender = (typeof Gender)[keyof typeof Gender];
export declare const ExperienceLevel: {
    readonly BEGINNER: "BEGINNER";
    readonly INTERMEDIATE: "INTERMEDIATE";
    readonly ADVANCED: "ADVANCED";
};
export type ExperienceLevel = (typeof ExperienceLevel)[keyof typeof ExperienceLevel];
export declare const GoalType: {
    readonly FAT_LOSS: "FAT_LOSS";
    readonly MUSCLE_GAIN: "MUSCLE_GAIN";
    readonly RECOMP: "RECOMP";
    readonly PERFORMANCE: "PERFORMANCE";
    readonly GENERAL_FITNESS: "GENERAL_FITNESS";
};
export type GoalType = (typeof GoalType)[keyof typeof GoalType];
export declare const Sport: {
    readonly NONE: "NONE";
    readonly FOOTBALL: "FOOTBALL";
    readonly BASKETBALL: "BASKETBALL";
    readonly VOLLEYBALL: "VOLLEYBALL";
    readonly COMBAT: "COMBAT";
    readonly RUNNING: "RUNNING";
};
export type Sport = (typeof Sport)[keyof typeof Sport];
export declare const PeriodizationModel: {
    readonly LINEAR: "LINEAR";
    readonly BLOCK: "BLOCK";
    readonly UNDULATING: "UNDULATING";
};
export type PeriodizationModel = (typeof PeriodizationModel)[keyof typeof PeriodizationModel];
export declare const ProgramPhase: {
    readonly ACCUMULATION: "ACCUMULATION";
    readonly INTENSIFICATION: "INTENSIFICATION";
    readonly REALIZATION: "REALIZATION";
    readonly DELOAD: "DELOAD";
};
export type ProgramPhase = (typeof ProgramPhase)[keyof typeof ProgramPhase];
export declare const MovementPattern: {
    readonly SQUAT: "SQUAT";
    readonly HINGE: "HINGE";
    readonly LUNGE: "LUNGE";
    readonly HORIZONTAL_PUSH: "HORIZONTAL_PUSH";
    readonly VERTICAL_PUSH: "VERTICAL_PUSH";
    readonly HORIZONTAL_PULL: "HORIZONTAL_PULL";
    readonly VERTICAL_PULL: "VERTICAL_PULL";
    readonly CARRY: "CARRY";
    readonly ROTATION: "ROTATION";
    readonly GAIT: "GAIT";
    readonly PLYOMETRIC: "PLYOMETRIC";
    readonly CONDITIONING: "CONDITIONING";
};
export type MovementPattern = (typeof MovementPattern)[keyof typeof MovementPattern];
export declare const Difficulty: {
    readonly BEGINNER: "BEGINNER";
    readonly INTERMEDIATE: "INTERMEDIATE";
    readonly ADVANCED: "ADVANCED";
};
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];
export declare const NutritionStrategy: {
    readonly FAT_LOSS: "FAT_LOSS";
    readonly MAINTENANCE: "MAINTENANCE";
    readonly MUSCLE_GAIN: "MUSCLE_GAIN";
    readonly RECOMP: "RECOMP";
};
export type NutritionStrategy = (typeof NutritionStrategy)[keyof typeof NutritionStrategy];
export declare const ActivityLevel: {
    readonly SEDENTARY: "SEDENTARY";
    readonly LIGHT: "LIGHT";
    readonly MODERATE: "MODERATE";
    readonly ACTIVE: "ACTIVE";
    readonly VERY_ACTIVE: "VERY_ACTIVE";
};
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
    recoveryQuality: number;
    sleepQuality: number;
    stressLevel: number;
}
export interface GoalInput {
    type: GoalType;
    sport: Sport;
    timeframeWeeks?: number;
    targetMetrics?: Record<string, number>;
}
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
    mealTiming: {
        slot: string;
        calories: number;
    }[];
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
export interface RecoveryResult {
    sleepTargetHours: number;
    hydrationLiters: number;
    mobilityRoutine: string[];
    recoveryScore: number;
    deloadRecommended: boolean;
    recommendations: string[];
}
