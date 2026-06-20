import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ExerciseFilter {
  muscle?: string;
  equipment?: string;
  pattern?: string;
  difficulty?: string;
  sportTag?: string;
}

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  find(filter: ExerciseFilter) {
    const where: Prisma.ExerciseWhereInput = {};
    if (filter.muscle) where.primaryMuscles = { has: filter.muscle };
    if (filter.equipment) where.equipment = { has: filter.equipment };
    if (filter.sportTag) where.sportTransferTags = { has: filter.sportTag };
    if (filter.pattern) where.movementPattern = filter.pattern as Prisma.EnumMovementPatternFilter['equals'];
    if (filter.difficulty) where.difficulty = filter.difficulty as Prisma.EnumDifficultyFilter['equals'];
    return this.prisma.exercise.findMany({ where, orderBy: { name: 'asc' } });
  }

  /** Full library used by the program generator's rule engine. */
  all() {
    return this.prisma.exercise.findMany();
  }

  get(id: string) {
    return this.prisma.exercise.findUnique({ where: { id } });
  }
}
