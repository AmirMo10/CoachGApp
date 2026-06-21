import { IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWorkoutDto {
  @IsOptional() @IsString() programId?: string;
  @IsOptional() @IsInt() weekIndex?: number;
  @IsOptional() @IsInt() dayIndex?: number;
  @IsOptional() @IsString() @MaxLength(120) focus?: string;
  @IsOptional() @IsString() performedAt?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsArray() entries?: unknown[];
}
