import { BadRequestException, Injectable } from '@nestjs/common';
import { AssessmentInput } from '@coachg/types';
import { generateNutritionPlan } from '@coachg/nutrition-engine';
import { AiClient, writeShortNote } from '@coachg/ai';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class NutritionService {
  private readonly ai = new AiClient({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ANTHROPIC_MODEL,
    tokenBudget: Number(process.env.AI_TOKEN_BUDGET ?? 0),
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
  ) {}

  async generate(user: AuthUser, clientId: string, goalId: string) {
    await this.clients.getOwned(user, clientId);

    const [assessment, goal] = await Promise.all([
      this.prisma.assessment.findFirst({ where: { clientId }, orderBy: { version: 'desc' } }),
      this.prisma.goal.findUnique({ where: { id: goalId } }),
    ]);
    if (!assessment) throw new BadRequestException('Client has no assessment on file');
    if (!goal || goal.clientId !== clientId) throw new BadRequestException('Invalid goal');

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

    const result = generateNutritionPlan(input, goal.type);

    const aiNotes = await writeShortNote(
      this.ai,
      'You are a sports nutritionist. Explain a nutrition plan briefly and supportively. Never change the numbers.',
      `Strategy ${result.strategy}, ${result.goalCalories} kcal (P${result.macros.proteinG}/C${result.macros.carbsG}/F${result.macros.fatG}). Write 2 sentences of guidance.`,
      `Target ${result.goalCalories} kcal/day on a ${result.strategy.toLowerCase().replace(/_/g, ' ')} approach. Hit your protein target first, keep meals consistent, and adjust portions based on weekly progress.`,
    );

    return this.prisma.nutritionPlan.create({
      data: {
        clientId,
        goalId: goal.id,
        strategy: result.strategy,
        bmr: result.bmr,
        tdee: result.tdee,
        goalCalories: result.goalCalories,
        proteinG: result.macros.proteinG,
        carbsG: result.macros.carbsG,
        fatG: result.macros.fatG,
        mealTiming: result.mealTiming,
        shoppingList: result.shoppingList,
        aiNotes,
        meals: {
          create: result.meals.map((m) => ({
            name: m.name,
            slot: m.slot,
            calories: m.calories,
            proteinG: m.proteinG,
            carbsG: m.carbsG,
            fatG: m.fatG,
            items: m.items,
          })),
        },
      },
      include: { meals: true },
    });
  }

  async list(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.nutritionPlan.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: { meals: true },
    });
  }
}
