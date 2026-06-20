import { BadRequestException, Injectable } from '@nestjs/common';
import { AssessmentInput } from '@coachg/types';
import { generateRecoveryPlan } from '@coachg/recovery-engine';
import { AiClient, writeShortNote } from '@coachg/ai';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class RecoveryService {
  private readonly ai = new AiClient({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ANTHROPIC_MODEL,
    tokenBudget: Number(process.env.AI_TOKEN_BUDGET ?? 0),
  });

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

    const aiNotes = await writeShortNote(
      this.ai,
      'You are a recovery coach. Briefly, supportively explain a recovery plan. Never give medical advice.',
      `Recovery score ${result.recoveryScore}/100, sleep target ${result.sleepTargetHours}h, deload ${result.deloadRecommended}. Write 2 sentences.`,
      result.deloadRecommended
        ? `Your recovery markers are low (score ${result.recoveryScore}/100). Prioritise sleep and consider the recommended deload before pushing intensity again.`
        : `Recovery is on track (score ${result.recoveryScore}/100). Keep your sleep and hydration consistent to sustain training quality.`,
    );

    return this.prisma.recoveryPlan.create({
      data: {
        clientId,
        sleepTargetHours: result.sleepTargetHours,
        hydrationLiters: result.hydrationLiters,
        mobilityRoutine: result.mobilityRoutine,
        recoveryScore: result.recoveryScore,
        deloadRecommended: result.deloadRecommended,
        recommendations: result.recommendations,
        aiNotes,
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
