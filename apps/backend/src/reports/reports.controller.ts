import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@coachg/types';
import { ReportsService } from './reports.service';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Roles(Role.COACH, Role.ADMIN)
  @Post('clients/:id/reports/generate')
  generate(@CurrentUser() user: AuthUser, @Param('id') clientId: string) {
    return this.reports.generate(user, clientId);
  }

  @Get('reports/:reportId')
  get(@Param('reportId') reportId: string) {
    return this.reports.get(reportId);
  }
}
