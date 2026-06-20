import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuthUser } from '../auth/current-user.decorator';
import { UpdateCoachProfileDto } from './coach-profile.dto';

@Injectable()
export class CoachProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private coachId(user: AuthUser): string {
    if (!user.coachProfileId) throw new ForbiddenException('Not a coach');
    return user.coachProfileId;
  }

  async get(user: AuthUser) {
    const profile = await this.prisma.coachProfile.findUnique({
      where: { id: this.coachId(user) },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
    if (!profile) throw new NotFoundException('Coach profile not found');
    const logoUrl = profile.logoKey ? await this.storage.presignDownload(profile.logoKey) : null;
    return {
      id: profile.id,
      email: profile.user.email,
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      businessName: profile.businessName,
      bio: profile.bio,
      specialties: profile.specialties,
      logoKey: profile.logoKey,
      logoUrl,
    };
  }

  async update(user: AuthUser, dto: UpdateCoachProfileDto) {
    const id = this.coachId(user);
    await this.prisma.coachProfile.update({
      where: { id },
      data: {
        businessName: dto.businessName,
        bio: dto.bio,
        specialties: dto.specialties,
        logoKey: dto.logoKey,
      },
    });
    return this.get(user);
  }

  /** Presigned PUT for a logo image (image mime types only). */
  async presignLogo(user: AuthUser, fileName: string, mimeType: string) {
    const id = this.coachId(user);
    if (!mimeType.startsWith('image/') || !this.storage.isAllowed(mimeType)) {
      throw new BadRequestException('Logo must be an image (JPG/PNG/WebP)');
    }
    const key = this.storage.buildKey(`coaches/${id}/branding`, fileName);
    const url = await this.storage.presignUpload(key, mimeType);
    return { key, url };
  }
}
