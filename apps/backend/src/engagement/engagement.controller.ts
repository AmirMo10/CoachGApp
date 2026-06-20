import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '@coachg/types';
import { EngagementService } from './engagement.service';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

class BodyDto {
  @IsString() @MinLength(1) @MaxLength(5000) body!: string;
}
class PresignDto {
  @IsString() fileName!: string;
  @IsString() mimeType!: string;
}
class RecordDocDto {
  @IsString() name!: string;
  @IsString() objectKey!: string;
  @IsString() mimeType!: string;
  @IsInt() sizeBytes!: number;
}

@ApiTags('engagement')
@ApiBearerAuth()
@Controller('clients/:id')
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  // Notes (coach-only)
  @Roles(Role.COACH, Role.ADMIN)
  @Get('notes')
  listNotes(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.engagement.listNotes(user, id);
  }

  @Roles(Role.COACH, Role.ADMIN)
  @Post('notes')
  addNote(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: BodyDto) {
    return this.engagement.addNote(user, id, dto.body);
  }

  // Messaging (coach + client)
  @Get('messages')
  listMessages(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.engagement.listMessages(user, id);
  }

  @Post('messages')
  sendMessage(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: BodyDto) {
    return this.engagement.sendMessage(user, id, dto.body);
  }

  @Roles(Role.COACH, Role.ADMIN)
  @Post('messages/draft')
  draftReply(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.engagement.draftReply(user, id);
  }

  // Documents
  @Get('documents')
  listDocuments(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.engagement.listDocuments(user, id);
  }

  @Roles(Role.COACH, Role.ADMIN)
  @Post('documents/presign')
  presign(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: PresignDto) {
    return this.engagement.presignUpload(user, id, dto.fileName, dto.mimeType);
  }

  @Roles(Role.COACH, Role.ADMIN)
  @Post('documents')
  record(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RecordDocDto) {
    return this.engagement.recordDocument(user, id, dto);
  }
}
