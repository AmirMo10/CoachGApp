import { Injectable } from '@nestjs/common';
import { analyzePanel, BloodMarkerType, MarkerInput } from '@coachg/bloodwork-engine';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { AuthUser } from '../auth/current-user.decorator';
import { CreateBloodworkDto } from './bloodwork.dto';

@Injectable()
export class BloodworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
  ) {}

  /**
   * Persist a bloodwork panel. Each marker is run through the deterministic
   * bloodwork engine to compute its flag + educational insight (never diagnostic).
   */
  async create(user: AuthUser, clientId: string, dto: CreateBloodworkDto) {
    await this.clients.getOwned(user, clientId);

    const insights = analyzePanel(
      dto.markers.map<MarkerInput>((m) => ({
        type: m.type as BloodMarkerType,
        value: m.value,
        referenceLow: m.referenceLow,
        referenceHigh: m.referenceHigh,
      })),
    );

    return this.prisma.bloodworkPanel.create({
      data: {
        clientId,
        panelDate: dto.panelDate ? new Date(dto.panelDate) : new Date(),
        lab: dto.lab,
        notes: dto.notes,
        markers: {
          create: insights.map((m) => ({
            type: m.type,
            value: m.value,
            unit: m.unit,
            referenceLow: m.referenceLow,
            referenceHigh: m.referenceHigh,
            flag: m.flag,
            insight: m.insight,
          })),
        },
      },
      include: { markers: true },
    });
  }

  async list(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    return this.prisma.bloodworkPanel.findMany({
      where: { clientId },
      orderBy: { panelDate: 'desc' },
      include: { markers: true },
    });
  }
}
