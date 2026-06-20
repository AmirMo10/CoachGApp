import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@coachg/types';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { StorageService } from '../storage/storage.service';
import { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class EngagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
    private readonly storage: StorageService,
  ) {}

  // ── Notes (coach-only) ──
  async listNotes(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.coachNote.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } });
  }

  async addNote(user: AuthUser, clientId: string, body: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.coachNote.create({ data: { clientId, body } });
  }

  // ── Messaging (coach + client thread) ──
  async listMessages(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.message.findMany({ where: { clientId }, orderBy: { createdAt: 'asc' } });
  }

  async sendMessage(user: AuthUser, clientId: string, body: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.message.create({
      data: { clientId, body, senderRole: user.role as Role },
    });
  }

  // ── Documents (presigned upload to object storage) ──
  async listDocuments(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.document.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } });
  }

  /** Step 1: get a presigned PUT URL. The client uploads directly to storage. */
  async presignUpload(user: AuthUser, clientId: string, fileName: string, mimeType: string) {
    await this.clients.getOwned(user, clientId);
    if (!this.storage.isAllowed(mimeType)) {
      throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }
    const key = this.storage.buildKey(`clients/${clientId}/documents`, fileName);
    const url = await this.storage.presignUpload(key, mimeType);
    return { key, url };
  }

  /** Step 2: record metadata once the upload completes. */
  async recordDocument(
    user: AuthUser,
    clientId: string,
    data: { name: string; objectKey: string; mimeType: string; sizeBytes: number },
  ) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.document.create({ data: { clientId, ...data } });
  }
}
