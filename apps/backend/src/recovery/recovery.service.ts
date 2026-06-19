import { BadRequestException, Injectable } from '@nestjs/common';
import { AssessmentInput } from '@coachg/types';
import { generateRecoveryPlan } from '@coachg/recovery-engine';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class RecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
  ) {}

  async generate(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    const assessment = await this.prisma.assessment.findFirst({
      where: { clientId },
      orderBy: { version: 'desc' },
    });
    if (!assessment) throw new BadRequestException('Client has no assessment on file');

    const input: AssessmentInput = {
      age: assessment.age,
      gender: assessment.gender,
      heightCm: assessment.heightCm,
      weightKg: assessment.weightKg,
      bodyFatPct: assessment.bodyFatPct ?? undefined,
      sport: assessment.sport,
      experience: assessment.experience,
      injuries: assessment.injuries,
      mobilityRestrictions: assessment.mobilityRestrictions,
      equipment: assessment.equipment,
      trainingFrequency: assessment.trainingFrequency,
      recoveryQuality: assessment.recoveryQuality,
      sleepQuality: assessment.sleepQuality,
      stressLevel: assessment.stressLevel,
    };

    const result = generateRecoveryPlan(input);

    return this.prisma.recoveryPlan.create({
      data: {
        clientId,
        sleepTargetHours: result.sleepTargetHours,
        hydrationLiters: result.hydrationLiters,
        mobilityRoutine: result.mobilityRoutine,
        recoveryScore: result.recoveryScore,
        deloadRecommended: result.deloadRecommended,
        recommendations: result.recommendations,
      },
    });
  }

  async list(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.recoveryPlan.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
