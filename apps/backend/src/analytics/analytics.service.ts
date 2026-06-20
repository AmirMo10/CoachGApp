import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Aggregate metrics for the acting coach's own roster. */
  async coachOverview(user: AuthUser) {
    if (!user.coachProfileId) throw new ForbiddenException('Not a coach');
    const coachId = user.coachProfileId;

    const clients = await this.prisma.clientProfile.findMany({
      where: { coachId, deletedAt: null },
      select: { id: true, createdAt: true },
    });
    const clientIds = clients.map((c) => c.id);
    const where = { clientId: { in: clientIds } };

    const [programs, nutrition, recovery, assessments] = await Promise.all([
      this.prisma.program.count({ where }),
      this.prisma.nutritionPlan.count({ where }),
      this.prisma.recoveryPlan.count({ where }),
      this.prisma.assessment.count({ where }),
    ]);

    return {
      totals: {
        clients: clients.length,
        programs,
        nutritionPlans: nutrition,
        recoveryPlans: recovery,
        assessments,
      },
      clientsByWeek: this.bucketByWeek(clients.map((c) => c.createdAt), 8),
    };
  }

  /** Count items per ISO week for the last `weeks` weeks (oldest → newest). */
  private bucketByWeek(dates: Date[], weeks: number): { label: string; count: number }[] {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const buckets = Array.from({ length: weeks }, (_, i) => {
      const start = now - (weeks - i) * weekMs;
      return { start, end: start + weekMs, count: 0 };
    });
    for (const d of dates) {
      const t = d.getTime();
      const b = buckets.find((x) => t >= x.start && t < x.end);
      if (b) b.count++;
    }
    return buckets.map((b) => ({
      label: new Date(b.start).toISOString().slice(5, 10),
      count: b.count,
    }));
  }
}
