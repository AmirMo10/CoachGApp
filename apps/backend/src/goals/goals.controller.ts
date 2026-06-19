import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { GoalType, Role, Sport } from '@coachg/types';
import { GoalsService } from './goals.service';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

class CreateGoalDto {
  @IsEnum(GoalType) type!: GoalType;
  @IsEnum(Sport) sport: Sport = Sport.NONE;
  @IsOptional() @IsInt() @Min(2) @Max(52) timeframeWeeks?: number;
  @IsOptional() targetMetrics?: Record<string, number>;
}

@ApiTags('goals')
@ApiBearerAuth()
@Controller('clients/:id/goals')
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('id') clientId: string) {
    return this.goals.list(user, clientId);
  }

  @Roles(Role.COACH, Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Param('id') clientId: string, @Body() dto: CreateGoalDto) {
    return this.goals.create(user, clientId, dto);
  }
}
