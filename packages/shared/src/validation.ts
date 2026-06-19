import { z } from 'zod';
import {
  ExperienceLevel,
  Gender,
  GoalType,
  PeriodizationModel,
  Sport,
} from '@coachg/types';

export const assessmentSchema = z.object({
  age: z.number().int().min(10).max(100),
  gender: z.nativeEnum(Gender),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  bodyFatPct: z.number().min(2).max(60).optional(),
  sport: z.nativeEnum(Sport).default(Sport.NONE),
  experience: z.nativeEnum(ExperienceLevel),
  injuries: z.array(z.string()).default([]),
  mobilityRestrictions: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  trainingFrequency: z.number().int().min(1).max(7),
  recoveryQuality: z.number().int().min(1).max(10),
  sleepQuality: z.number().int().min(1).max(10),
  stressLevel: z.number().int().min(1).max(10),
});

export const goalSchema = z.object({
  type: z.nativeEnum(GoalType),
  sport: z.nativeEnum(Sport).default(Sport.NONE),
  timeframeWeeks: z.number().int().min(2).max(52).optional(),
  targetMetrics: z.record(z.number()).optional(),
});

export const generateProgramSchema = z.object({
  goalId: z.string().cuid(),
  periodization: z.nativeEnum(PeriodizationModel),
  durationWeeks: z.union([z.literal(4), z.literal(8), z.literal(12), z.number().int().min(2).max(24)]),
  daysPerWeek: z.number().int().min(2).max(6),
});

export type AssessmentSchema = z.infer<typeof assessmentSchema>;
export type GoalSchema = z.infer<typeof goalSchema>;
export type GenerateProgramSchema = z.infer<typeof generateProgramSchema>;
