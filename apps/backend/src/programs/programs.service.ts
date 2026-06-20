import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AssessmentInput,
  ExerciseDTO,
  GoalInput,
  PeriodizationModel,
} from '@coachg/types';
import { generateProgram, ProgramGenerationError } from '@coachg/program-generator';
import { AiClient, explainProgram } from '@coachg/ai';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { ExercisesService } from '../exercises/exercises.service';
import { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class ProgramsService {
  private readonly ai = new AiClient({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ANTHROPIC_MODEL,
    maxTokens: Number(process.env.ANTHROPIC_MAX_TOKENS ?? 4096),
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
    private readonly exercises: ExercisesService,
  ) {}

  /**
   * Run the full deterministic generation pipeline, persist the program, then
   * (optionally) attach an AI explanation. The program is valid regardless of AI.
   */
  async generate(
    user: AuthUser,
    clientId: string,
    dto: { goalId: string; periodization: PeriodizationModel; durationWeeks: number; daysPerWeek: number },
  ) {
    // Ownership check
    await this.clients.getOwned(user, clientId);

    const [assessment, goal] = await Promise.all([
      this.prisma.assessment.findFirst({
        where: { clientId },
        orderBy: { version: 'desc' },
      }),
      this.prisma.goal.findUnique({ where: { id: dto.goalId } }),
    ]);

    if (!assessment) throw new BadRequestException('Client has no assessment on file');
    if (!goal || goal.clientId !== clientId) throw new BadRequestException('Invalid goal');

    const library = (await this.exercises.all()) as unknown as ExerciseDTO[];

    const assessmentInput: AssessmentInput = {
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
    const goalInput: GoalInput = { type: goal.type, sport: goal.sport };

    let plan;
    try {
      plan = generateProgram({
        assessment: assessmentInput,
        goal: goalInput,
        library,
        periodization: dto.periodization,
        durationWeeks: dto.durationWeeks,
        daysPerWeek: dto.daysPerWeek,
      });
    } catch (e) {
      if (e instanceof ProgramGenerationError) throw new BadRequestException(e.message);
      throw e;
    }

    // AI explanation layer (optional, never blocks).
    const rationale = await explainProgram(this.ai, plan);

    // Persist the full program tree in a single transaction.
    return this.prisma.program.create({
      data: {
        clientId,
        goalId: goal.id,
        name: plan.name,
        periodization: plan.periodization,
        durationWeeks: plan.durationWeeks,
        daysPerWeek: plan.daysPerWeek,
        status: 'DRAFT',
        aiRationale: rationale,
        weeks: {
          create: plan.weeks.map((w) => ({
            weekIndex: w.weekIndex,
            phase: w.phase,
            volumeMultiplier: w.volumeMultiplier,
            intensityMultiplier: w.intensityMultiplier,
            isDeload: w.isDeload,
            days: {
              create: w.days.map((d) => ({
                dayIndex: d.dayIndex,
                focus: d.focus,
                payload: { warmup: d.warmup, conditioning: d.conditioning ?? null },
                exercises: {
                  create: d.exercises.map((ex) => ({
                    exerciseId: ex.exerciseId,
                    order: ex.order,
                    sets: ex.sets,
                    reps: ex.reps,
                    loadPctOf1RM: ex.loadPctOf1RM ?? null,
                    rpe: ex.rpe ?? null,
                    tempo: ex.tempo ?? null,
                    restSeconds: ex.restSeconds,
                    progressionRule: ex.progressionRule ?? null,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: { weeks: { include: { days: { include: { exercises: true } } } } },
    });
  }

  async list(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.program.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(programId: string) {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      include: {
        weeks: {
          orderBy: { weekIndex: 'asc' },
          include: {
            days: {
              orderBy: { dayIndex: 'asc' },
              include: {
                // Include the exercise so the UI can render names/cues, not raw ids.
                exercises: {
                  orderBy: { order: 'asc' },
                  include: {
                    exercise: {
                      select: { name: true, primaryMuscles: true, movementPattern: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }
}
