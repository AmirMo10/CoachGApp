import { BadRequestException, Injectable } from '@nestjs/common';
import { AssessmentInput } from '@coachg/types';
import { generateNutritionPlan } from '@coachg/nutrition-engine';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class NutritionService {
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
