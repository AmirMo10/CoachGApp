import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@coachg/types';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Roles(Role.ADMIN)
  @Get('analytics')
  platformAnalytics() {
    return this.analytics.adminOverview();
  }

  @Roles(Role.ADMIN)
  @Get('coaches')
  coaches() {
    return this.analytics.listCoaches();
  }
}
