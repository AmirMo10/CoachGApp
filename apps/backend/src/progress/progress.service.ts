import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { AuthUser } from '../auth/current-user.decorator';
import { CreateProgressDto } from './progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
  ) {}

  async list(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.progressEntry.findMany({
      where: { clientId },
      orderBy: { entryDate: 'asc' },
    });
  }

  /** Clients may log their own progress; coaches may log for their clients. */
  async create(user: AuthUser, clientId: string, dto: CreateProgressDto) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.progressEntry.create({
      data: {
        clientId,
        entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
        weightKg: dto.weightKg,
        bodyFatPct: dto.bodyFatPct,
        waistCm: dto.waistCm,
        strengthPRs: dto.strengthPRs,
        sprintTimes: dto.sprintTimes,
        jumpHeightCm: dto.jumpHeightCm,
        compliancePct: dto.compliancePct,
        recoveryScore: dto.recoveryScore,
      },
    });
  }

  /** Aggregate first/last per numeric metric for dashboard summaries. */
  async summary(user: AuthUser, clientId: string) {
    const entries = await this.list(user, clientId);
    if (entries.length === 0) return { metrics: [] as unknown[] };
    const first = entries[0]!;
    const last = entries[entries.length - 1]!;
    const metric = (label: string, a?: number | null, b?: number | null) =>
      a != null && b != null
        ? { metric: label, start: a, current: b, change: Math.round((b - a) * 100) / 100 }
        : null;

    return {
      metrics: [
        metric('Weight (kg)', first.weightKg, last.weightKg),
        metric('Body fat (%)', first.bodyFatPct, last.bodyFatPct),
        metric('Waist (cm)', first.waistCm, last.waistCm),
        metric('Jump height (cm)', first.jumpHeightCm, last.jumpHeightCm),
      ].filter(Boolean),
    };
  }
}
