import { Injectable, NotFoundException } from '@nestjs/common';
import type { ReportData } from '@coachg/report-engine';
import { AiClient, writeReportNarrative } from '@coachg/ai';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { QueueService } from '../queue/queue.service';
import { StorageService } from '../storage/storage.service';
import { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class ReportsService {
  private readonly ai = new AiClient({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ANTHROPIC_MODEL,
    tokenBudget: Number(process.env.AI_TOKEN_BUDGET ?? 0),
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
    private readonly queue: QueueService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Assemble the premium report payload from persisted data and enqueue PDF
   * generation (handled asynchronously by the BullMQ worker → object storage).
   */
  async generate(user: AuthUser, clientId: string) {
    const client = await this.clients.getOwned(user, clientId);

    const [assessment, goal, program, nutrition, recovery, progress, coach] = await Promise.all([
      this.prisma.assessment.findFirst({ where: { clientId }, orderBy: { version: 'desc' } }),
      this.prisma.goal.findFirst({ where: { clientId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.program.findFirst({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        include: { weeks: { include: { days: { include: { exercises: true } } } } },
      }),
      this.prisma.nutritionPlan.findFirst({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        include: { meals: true },
      }),
      this.prisma.recoveryPlan.findFirst({ where: { clientId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.progressEntry.findMany({ where: { clientId }, orderBy: { entryDate: 'asc' } }),
      this.prisma.clientProfile
        .findUnique({ where: { id: clientId } })
        .coach({ include: { user: true } }),
    ]);

    // AI-written narrative (with deterministic fallback baked into the helper).
    const narrative = await writeReportNarrative(this.ai, {
      clientName: `${client.firstName} ${client.lastName}`,
      goal: goal?.type,
      sport: assessment?.sport,
      experience: assessment?.experience,
      programName: program?.name,
    });

    const data: ReportData = {
      brand: {
        businessName: coach?.businessName ?? 'Coach"G"',
        coachName: `${coach?.user?.firstName ?? ''} ${coach?.user?.lastName ?? ''}`.trim() || 'Coach',
      },
      client: {
        fullName: `${client.firstName} ${client.lastName}`,
        age: assessment?.age,
        sport: assessment?.sport,
        goal: goal?.type,
      },
      assessmentSummary: assessment
        ? [
            { label: 'Height', value: `${assessment.heightCm} cm` },
            { label: 'Weight', value: `${assessment.weightKg} kg` },
            { label: 'Experience', value: assessment.experience },
            { label: 'Training days/week', value: String(assessment.trainingFrequency) },
          ]
        : [],
      goalAnalysis: narrative.goalAnalysis,
      performanceAnalysis: narrative.performanceAnalysis,
      program: program
        ? {
            name: program.name,
            periodization: program.periodization,
            durationWeeks: program.durationWeeks,
            daysPerWeek: program.daysPerWeek,
            weeks: program.weeks.map((w) => ({
              weekIndex: w.weekIndex,
              phase: w.phase,
              volumeMultiplier: w.volumeMultiplier,
              intensityMultiplier: w.intensityMultiplier,
              isDeload: w.isDeload,
              days: w.days.map((d) => ({
                dayIndex: d.dayIndex,
                focus: d.focus,
                warmup: [],
                exercises: d.exercises.map((e) => ({
                  exerciseId: e.exerciseId,
                  exerciseName: e.exerciseId,
                  order: e.order,
                  sets: e.sets,
                  reps: e.reps,
                  loadPctOf1RM: e.loadPctOf1RM ?? undefined,
                  rpe: e.rpe ?? undefined,
                  tempo: e.tempo ?? undefined,
                  restSeconds: e.restSeconds,
                  progressionRule: e.progressionRule ?? undefined,
                })),
              })),
            })),
          }
        : undefined,
      programRationale: program?.aiRationale ?? undefined,
      nutrition: nutrition
        ? {
            strategy: nutrition.strategy,
            bmr: nutrition.bmr,
            tdee: nutrition.tdee,
            goalCalories: nutrition.goalCalories,
            macros: { proteinG: nutrition.proteinG, carbsG: nutrition.carbsG, fatG: nutrition.fatG },
            mealTiming: [],
            meals: [],
            shoppingList: nutrition.shoppingList,
          }
        : undefined,
      recovery: recovery
        ? {
            sleepTargetHours: recovery.sleepTargetHours,
            hydrationLiters: recovery.hydrationLiters,
            mobilityRoutine: recovery.mobilityRoutine,
            recoveryScore: recovery.recoveryScore,
            deloadRecommended: recovery.deloadRecommended,
            recommendations: recovery.recommendations,
          }
        : undefined,
      progress: progress.length
        ? progress.map((p) => ({
            metric: p.entryDate.toISOString().slice(0, 10),
            start: p.weightKg ? `${p.weightKg} kg` : '-',
            current: p.bodyFatPct ? `${p.bodyFatPct}%` : '-',
            change: '-',
          }))
        : undefined,
      generatedAt: new Date().toISOString().slice(0, 10),
    };

    const report = await this.prisma.report.create({ data: { clientId, status: 'PENDING' } });
    await this.queue.enqueueReport(report.id, data);
    return { reportId: report.id, status: report.status };
  }

  async get(reportId: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    const downloadUrl =
      report.status === 'READY' && report.objectKey
        ? await this.storage.presignDownload(report.objectKey)
        : null;
    return { ...report, downloadUrl };
  }
}
