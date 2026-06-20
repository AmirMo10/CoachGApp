import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPassword } from './password';

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

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { coachProfile: true, clientProfile: true },
    });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { coachProfile: true, clientProfile: true },
    });
    if (!user) return null;
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      coachProfileId: user.coachProfile?.id,
      clientProfileId: user.clientProfile?.id,
    };
  }
}
