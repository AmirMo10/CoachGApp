import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Role } from '@coachg/types';
import { NutritionService } from './nutrition.service';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

class GenerateNutritionDto {
  @IsString() goalId!: string;
}

@ApiTags('nutrition')
@ApiBearerAuth()
@Controller('clients/:id/nutrition')
export class NutritionController {
  constructor(private readonly nutrition: NutritionService) {}

  @Roles(Role.COACH, Role.ADMIN)
  @Post('generate')
  generate(
    @CurrentUser() user: AuthUser,
    @Param('id') clientId: string,
    @Body() dto: GenerateNutritionDto,
  ) {
    return this.nutrition.generate(user, clientId, dto.goalId);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('id') clientId: string) {
    return this.nutrition.list(user, clientId);
  }
}
