import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AdminController } from './admin.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalyticsController, AdminController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
