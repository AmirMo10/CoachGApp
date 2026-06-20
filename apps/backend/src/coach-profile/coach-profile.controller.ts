import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@coachg/types';
import { CoachProfileService } from './coach-profile.service';
import { LogoPresignDto, UpdateCoachProfileDto } from './coach-profile.dto';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@ApiTags('coach-profile')
@ApiBearerAuth()
@Roles(Role.COACH, Role.ADMIN)
@Controller('coach/profile')
export class CoachProfileController {
  constructor(private readonly profile: CoachProfileService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.profile.get(user);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateCoachProfileDto) {
    return this.profile.update(user, dto);
  }

  @Post('logo-url')
  presignLogo(@CurrentUser() user: AuthUser, @Body() dto: LogoPresignDto) {
    return this.profile.presignLogo(user, dto.fileName, dto.mimeType);
  }
}
