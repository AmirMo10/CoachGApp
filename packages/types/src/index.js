"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLevel = exports.NutritionStrategy = exports.Difficulty = exports.MovementPattern = exports.ProgramPhase = exports.PeriodizationModel = exports.Sport = exports.GoalType = exports.ExperienceLevel = exports.Gender = exports.Role = void 0;
exports.Role = { ADMIN: 'ADMIN', COACH: 'COACH', CLIENT: 'CLIENT' };
exports.Gender = { MALE: 'MALE', FEMALE: 'FEMALE', OTHER: 'OTHER' };
exports.ExperienceLevel = {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
};
exports.GoalType = {
    FAT_LOSS: 'FAT_LOSS',
    MUSCLE_GAIN: 'MUSCLE_GAIN',
    RECOMP: 'RECOMP',
    PERFORMANCE: 'PERFORMANCE',
    GENERAL_FITNESS: 'GENERAL_FITNESS',
};
exports.Sport = {
    NONE: 'NONE',
    FOOTBALL: 'FOOTBALL',
    BASKETBALL: 'BASKETBALL',
    VOLLEYBALL: 'VOLLEYBALL',
    COMBAT: 'COMBAT',
    RUNNING: 'RUNNING',
};
exports.PeriodizationModel = {
    LINEAR: 'LINEAR',
    BLOCK: 'BLOCK',
    UNDULATING: 'UNDULATING',
};
exports.ProgramPhase = {
    ACCUMULATION: 'ACCUMULATION',
    INTENSIFICATION: 'INTENSIFICATION',
    REALIZATION: 'REALIZATION',
    DELOAD: 'DELOAD',
};
exports.MovementPattern = {
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
};
exports.Difficulty = {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
};
exports.NutritionStrategy = {
    FAT_LOSS: 'FAT_LOSS',
    MAINTENANCE: 'MAINTENANCE',
    MUSCLE_GAIN: 'MUSCLE_GAIN',
    RECOMP: 'RECOMP',
};
exports.ActivityLevel = {
    SEDENTARY: 'SEDENTARY',
    LIGHT: 'LIGHT',
    MODERATE: 'MODERATE',
    ACTIVE: 'ACTIVE',
    VERY_ACTIVE: 'VERY_ACTIVE',
};
