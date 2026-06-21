import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** One performed set: actual reps/load the client recorded. */
export class LoggedSetDto {
  @IsOptional() @IsNumber() @Min(0) @Max(1000) reps?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(2000) weightKg?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(10) rpe?: number;
}

/** Performed sets for a single exercise within a logged session. */
export class LoggedExerciseDto {
  @IsString() @MaxLength(160) name!: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoggedSetDto)
  sets!: LoggedSetDto[];
}

export class CreateWorkoutDto {
  @IsOptional() @IsString() programId?: string;
  @IsOptional() @IsInt() weekIndex?: number;
  @IsOptional() @IsInt() dayIndex?: number;
  @IsOptional() @IsString() @MaxLength(120) focus?: string;
  @IsOptional() @IsString() performedAt?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoggedExerciseDto)
  entries?: LoggedExerciseDto[];
}
