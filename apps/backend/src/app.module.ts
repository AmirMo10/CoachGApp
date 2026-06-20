import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './auth/roles.guard';
import { AuditInterceptor } from './audit/audit.interceptor';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { ClientsModule } from './clients/clients.module';
import { ExercisesModule } from './exercises/exercises.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { GoalsModule } from './goals/goals.module';
import { ProgramsModule } from './programs/programs.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { RecoveryModule } from './recovery/recovery.module';
import { BloodworkModule } from './bloodwork/bloodwork.module';
import { ProgressModule } from './progress/progress.module';
import { ReportsModule } from './reports/reports.module';
import { EngagementModule } from './engagement/engagement.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        redact: ['req.headers.authorization'],
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL ?? 60) * 1000,
        limit: Number(process.env.RATE_LIMIT_MAX ?? 120),
      },
    ]),
    PrismaModule,
    AuthModule,
    StorageModule,
    QueueModule,
    HealthModule,
    ClientsModule,
    ExercisesModule,
    AssessmentsModule,
    GoalsModule,
    ProgramsModule,
    NutritionModule,
    RecoveryModule,
    BloodworkModule,
    ProgressModule,
    ReportsModule,
    EngagementModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
