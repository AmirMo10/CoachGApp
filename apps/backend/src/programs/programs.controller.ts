import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, Max, Min } from 'class-validator';
import { PeriodizationModel, Role } from '@coachg/types';
import { ProgramsService } from './programs.service';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

class GenerateProgramDto {
  @IsString() goalId!: string;
  @IsEnum(PeriodizationModel) periodization!: PeriodizationModel;
  @IsInt() @Min(2) @Max(24) durationWeeks!: number;
  @IsInt() @Min(2) @Max(6) daysPerWeek!: number;
}

@ApiTags('programs')
@ApiBearerAuth()
@Controller()
export class ProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  @Roles(Role.COACH, Role.ADMIN)
  @Post('clients/:id/programs/generate')
  generate(
    @CurrentUser() user: AuthUser,
    @Param('id') clientId: string,
    @Body() dto: GenerateProgramDto,
  ) {
    return this.programs.generate(user, clientId, dto);
  }

  @Get('clients/:id/programs')
  list(@CurrentUser() user: AuthUser, @Param('id') clientId: string) {
    return this.programs.list(user, clientId);
  }

  @Get('programs/:programId')
  get(@Param('programId') programId: string) {
    return this.programs.get(programId);
  }
}
