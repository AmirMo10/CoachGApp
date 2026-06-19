import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@coachg/types';
import { BloodworkService } from './bloodwork.service';
import { CreateBloodworkDto } from './bloodwork.dto';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@ApiTags('bloodwork')
@ApiBearerAuth()
@Controller('clients/:id/bloodwork')
export class BloodworkController {
  constructor(private readonly bloodwork: BloodworkService) {}

  @Roles(Role.COACH, Role.ADMIN)
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('id') clientId: string,
    @Body() dto: CreateBloodworkDto,
  ) {
    return this.bloodwork.create(user, clientId, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('id') clientId: string) {
    return this.bloodwork.list(user, clientId);
  }
}
