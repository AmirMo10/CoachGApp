import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ExperienceLevel, Gender, Sport } from '@coachg/types';

/** Module 2 — full athlete intake. Mirrors the Prisma Assessment model. */
export class CreateAssessmentDto {
  @IsInt() @Min(10) @Max(100) age!: number;
  @IsEnum(Gender) gender!: Gender;
  @IsNumber() @Min(100) @Max(250) heightCm!: number;
  @IsNumber() @Min(30) @Max(300) weightKg!: number;
  @IsOptional() @IsNumber() @Min(2) @Max(60) bodyFatPct?: number;
  @IsEnum(Sport) sport!: Sport;
  @IsEnum(ExperienceLevel) experience!: ExperienceLevel;

  @IsArray() @IsString({ each: true }) injuries: string[] = [];
  @IsArray() @IsString({ each: true }) mobilityRestrictions: string[] = [];
  @IsArray() @IsString({ each: true }) equipment: string[] = [];

  @IsInt() @Min(1) @Max(7) trainingFrequency!: number;
  @IsOptional() scheduleAvailability?: Record<string, boolean>;

  @IsInt() @Min(1) @Max(10) recoveryQuality!: number;
  @IsInt() @Min(1) @Max(10) sleepQuality!: number;
  @IsInt() @Min(1) @Max(10) stressLevel!: number;
}
