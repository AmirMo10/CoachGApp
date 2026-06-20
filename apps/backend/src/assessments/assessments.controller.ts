import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@coachg/types';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './assessment.dto';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@ApiTags('assessments')
@ApiBearerAuth()
@Controller()
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Get('clients/:id/assessments')
  list(@CurrentUser() user: AuthUser, @Param('id') clientId: string) {
    return this.assessments.list(user, clientId);
  }

  @Roles(Role.COACH, Role.ADMIN)
  @Post('clients/:id/assessments')
  create(
    @CurrentUser() user: AuthUser,
    @Param('id') clientId: string,
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.assessments.create(user, clientId, dto);
  }

  @Get('clients/:id/assessments/:assessmentId')
  get(
    @CurrentUser() user: AuthUser,
    @Param('id') clientId: string,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.assessments.get(user, clientId, assessmentId);
  }
}
