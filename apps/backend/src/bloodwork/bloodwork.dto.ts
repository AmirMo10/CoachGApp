import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

const MARKER_TYPES = [
  'FASTING_GLUCOSE',
  'HBA1C',
  'HDL',
  'LDL',
  'TRIGLYCERIDES',
  'VITAMIN_D',
  'TESTOSTERONE',
  'FERRITIN',
] as const;
type MarkerType = (typeof MARKER_TYPES)[number];

export class MarkerDto {
  @IsEnum(Object.fromEntries(MARKER_TYPES.map((t) => [t, t])))
  type!: MarkerType;

  @IsNumber() value!: number;
  @IsOptional() @IsNumber() referenceLow?: number;
  @IsOptional() @IsNumber() referenceHigh?: number;
}

export class CreateBloodworkDto {
  @IsOptional() @IsString() panelDate?: string;
  @IsOptional() @IsString() lab?: string;
  @IsOptional() @IsString() notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkerDto)
  markers!: MarkerDto[];
}
