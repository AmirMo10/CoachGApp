import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@coachg/types';
import { RecoveryService } from './recovery.service';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@ApiTags('recovery')
@ApiBearerAuth()
@Controller('clients/:id/recovery')
export class RecoveryController {
  constructor(private readonly recovery: RecoveryService) {}

  @Roles(Role.COACH, Role.ADMIN)
  @Post('generate')
  generate(@CurrentUser() user: AuthUser, @Param('id') clientId: string) {
    return this.recovery.generate(user, clientId);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('id') clientId: string) {
    return this.recovery.list(user, clientId);
  }
}
