import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { AuthUser } from '../auth/current-user.decorator';
import { CreateAssessmentDto } from './assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
  ) {}

  async list(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.assessment.findMany({
      where: { clientId },
      orderBy: { version: 'desc' },
    });
  }

  /** Create a new assessment version (assessments are versioned, never overwritten). */
  async create(user: AuthUser, clientId: string, dto: CreateAssessmentDto) {
    await this.clients.getOwned(user, clientId);
    const latest = await this.prisma.assessment.findFirst({
      where: { clientId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;

    return this.prisma.assessment.create({
      data: { ...dto, clientId, version },
    });
  }

  async get(user: AuthUser, clientId: string, assessmentId: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.assessment.findFirst({ where: { id: assessmentId, clientId } });
  }
}
