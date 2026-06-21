import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { AuthUser } from '../auth/current-user.decorator';
import { CreateWorkoutDto } from './workouts.dto';

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
  ) {}

  /** Log a completed training session. Clients log their own; coaches may log for theirs. */
  async create(user: AuthUser, clientId: string, dto: CreateWorkoutDto) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.workoutLog.create({
      data: {
        clientId,
        programId: dto.programId,
        weekIndex: dto.weekIndex,
        dayIndex: dto.dayIndex,
        focus: dto.focus,
        performedAt: dto.performedAt ? new Date(dto.performedAt) : new Date(),
        notes: dto.notes,
        entries: dto.entries ? (dto.entries as unknown as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async list(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.workoutLog.findMany({
      where: { clientId },
      orderBy: { performedAt: 'desc' },
      take: 50,
    });
  }
}
