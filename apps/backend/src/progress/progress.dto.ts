import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateProgressDto {
  @IsOptional() @IsString() entryDate?: string;
  @IsOptional() @IsNumber() weightKg?: number;
  @IsOptional() @IsNumber() bodyFatPct?: number;
  @IsOptional() @IsNumber() waistCm?: number;
  @IsOptional() @IsObject() strengthPRs?: Record<string, number>;
  @IsOptional() @IsObject() sprintTimes?: Record<string, number>;
  @IsOptional() @IsNumber() jumpHeightCm?: number;
  @IsOptional() @IsNumber() compliancePct?: number;
  @IsOptional() @IsNumber() recoveryScore?: number;
}
