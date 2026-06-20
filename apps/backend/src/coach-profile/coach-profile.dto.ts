import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCoachProfileDto {
  @IsOptional() @IsString() @MaxLength(120) businessName?: string;
  @IsOptional() @IsString() @MaxLength(2000) bio?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) specialties?: string[];
  @IsOptional() @IsString() logoKey?: string;
}

export class LogoPresignDto {
  @IsString() fileName!: string;
  @IsString() mimeType!: string;
}
