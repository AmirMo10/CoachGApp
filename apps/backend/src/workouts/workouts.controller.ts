import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutDto } from './workouts.dto';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@ApiTags('workouts')
@ApiBearerAuth()
@Controller('clients/:id/workouts')
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('id') clientId: string) {
    return this.workouts.list(user, clientId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('id') clientId: string,
    @Body() dto: CreateWorkoutDto,
  ) {
    return this.workouts.create(user, clientId, dto);
  }
}
