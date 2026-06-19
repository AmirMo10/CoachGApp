import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Local-dev auth fallback. In production AUTH_PROVIDER=keycloak delegates token
 * issuance/validation to Keycloak (OIDC); this service then only verifies the
 * Keycloak-issued JWT. The local path below is for development convenience.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private hash(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { coachProfile: true, clientProfile: true },
    });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const provided = Buffer.from(this.hash(password));
    const stored = Buffer.from(user.passwordHash);
    if (provided.length !== stored.length || !timingSafeEqual(provided, stored)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      coachProfileId: user.coachProfile?.id,
      clientProfileId: user.clientProfile?.id,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      refreshToken: await this.jwt.signAsync(payload, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
      }),
      user: payload,
    };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });
  }
}
