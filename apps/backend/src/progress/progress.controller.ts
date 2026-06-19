import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './progress.dto';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@ApiTags('progress')
@ApiBearerAuth()
@Controller('clients/:id/progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('id') clientId: string) {
    return this.progress.list(user, clientId);
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthUser, @Param('id') clientId: string) {
    return this.progress.summary(user, clientId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('id') clientId: string,
    @Body() dto: CreateProgressDto,
  ) {
    return this.progress.create(user, clientId, dto);
  }
}
