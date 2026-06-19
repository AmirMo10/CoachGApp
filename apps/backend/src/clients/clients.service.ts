import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/current-user.decorator';
import { Role } from '@coachg/types';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve the coach profile id for the acting user (or throw). */
  private coachId(user: AuthUser): string {
    if (!user.coachProfileId) throw new ForbiddenException('Not a coach');
    return user.coachProfileId;
  }

  list(user: AuthUser) {
    return this.prisma.clientProfile.findMany({
      where: { coachId: this.coachId(user), deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(user: AuthUser, data: { firstName: string; lastName: string; email?: string }) {
    return this.prisma.clientProfile.create({
      data: { ...data, coachId: this.coachId(user) },
    });
  }

  /**
   * Fetch a client and enforce ownership: a coach may only access their own
   * clients; a client may only access their own profile.
   */
  async getOwned(user: AuthUser, clientId: string) {
    const client = await this.prisma.clientProfile.findFirst({
      where: { id: clientId, deletedAt: null },
      include: { assessments: { orderBy: { version: 'desc' }, take: 1 }, goals: true },
    });
    if (!client) throw new NotFoundException('Client not found');

    const ownedByCoach = user.role === Role.COACH && client.coachId === user.coachProfileId;
    const isSelf = user.role === Role.CLIENT && client.id === user.clientProfileId;
    const isAdmin = user.role === Role.ADMIN;
    if (!ownedByCoach && !isSelf && !isAdmin) {
      throw new ForbiddenException('You do not have access to this client');
    }
    return client;
  }

  async softDelete(user: AuthUser, clientId: string) {
    await this.getOwned(user, clientId);
    return this.prisma.clientProfile.update({
      where: { id: clientId },
      data: { deletedAt: new Date() },
    });
  }
}
