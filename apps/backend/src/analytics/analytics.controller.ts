import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@coachg/types';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('coach')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Roles(Role.COACH, Role.ADMIN)
  @Get('overview')
  overview(@CurrentUser() user: AuthUser) {
    return this.analytics.coachOverview(user);
  }
}
