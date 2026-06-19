import { Injectable } from '@nestjs/common';
import { GoalType, Sport } from '@coachg/types';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { AuthUser } from '../auth/current-user.decorator';

export interface CreateGoalInput {
  type: GoalType;
  sport: Sport;
  timeframeWeeks?: number;
  targetMetrics?: Record<string, number>;
}

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
  ) {}

  async list(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.goal.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } });
  }

  async create(user: AuthUser, clientId: string, dto: CreateGoalInput) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.goal.create({ data: { ...dto, clientId } });
  }
}
