import { Injectable } from '@nestjs/common';
import { analyzePanel, BloodMarkerType, MarkerInput } from '@coachg/bloodwork-engine';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { AuthUser } from '../auth/current-user.decorator';
import { CreateBloodworkDto } from './bloodwork.dto';
import {
  decryptField,
  decryptNullable,
  encryptField,
  encryptNullable,
} from '../common/encryption';

type PanelWithMarkers = {
  notes: string | null;
  markers: { value: string }[];
};

@Injectable()
export class BloodworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
  ) {}

  /** Decrypt sensitive fields (marker value + panel notes) for API responses. */
  private decryptPanel<T extends PanelWithMarkers>(panel: T): T {
    return {
      ...panel,
      notes: decryptNullable(panel.notes),
      markers: panel.markers.map((m) => ({ ...m, value: Number(decryptField(m.value)) })),
    };
  }

  /**
   * Persist a bloodwork panel. Each marker is run through the deterministic
   * bloodwork engine to compute its flag + educational insight (never diagnostic).
   * The sensitive marker value and free-text notes are encrypted at rest
   * (AES-256-GCM, app-level field encryption).
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

    const panel = await this.prisma.bloodworkPanel.create({
      data: {
        clientId,
        panelDate: dto.panelDate ? new Date(dto.panelDate) : new Date(),
        lab: dto.lab,
        notes: encryptNullable(dto.notes),
        markers: {
          create: insights.map((m) => ({
            type: m.type,
            value: encryptField(String(m.value)), // encrypted at rest
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
    return this.decryptPanel(panel);
  }

  async list(user: AuthUser, clientId: string) {
    await this.clients.getOwned(user, clientId);
    const panels = await this.prisma.bloodworkPanel.findMany({
      where: { clientId },
      orderBy: { panelDate: 'desc' },
      include: { markers: true },
    });
    return panels.map((p) => this.decryptPanel(p));
  }
}
