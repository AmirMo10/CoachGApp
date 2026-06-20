import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { Role } from '@coachg/types';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './current-user.decorator';

/**
 * Verifies bearer tokens against the configured provider and returns a
 * normalized AuthUser.
 *
 * - AUTH_PROVIDER=keycloak → verify via the realm's JWKS (OIDC), map realm
 *   roles to our Role, and resolve coach/client profile ids by email.
 * - otherwise → verify the locally-signed dev JWT (already in our shape).
 */
@Injectable()
export class TokenVerifierService {
  private readonly logger = new Logger(TokenVerifierService.name);
  private readonly provider = process.env.AUTH_PROVIDER ?? 'local';
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private get issuer(): string {
    return `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`;
  }

  private getJwks() {
    if (!this.jwks) {
      this.jwks = createRemoteJWKSet(
        new URL(`${this.issuer}/protocol/openid-connect/certs`),
      );
    }
    return this.jwks;
  }

  async verify(token: string): Promise<AuthUser> {
    if (this.provider === 'keycloak') return this.verifyKeycloak(token);
    return this.verifyLocal(token);
  }

  private async verifyLocal(token: string): Promise<AuthUser> {
    try {
      return await this.jwt.verifyAsync<AuthUser>(token, {
        secret: process.env.JWT_SECRET ?? 'dev-only-change-me',
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private mapRole(payload: JWTPayload & { realm_access?: { roles?: string[] } }): Role {
    const roles = payload.realm_access?.roles ?? [];
    if (roles.includes('admin')) return Role.ADMIN;
    if (roles.includes('coach')) return Role.COACH;
    return Role.CLIENT;
  }

  private async verifyKeycloak(token: string): Promise<AuthUser> {
    let payload: JWTPayload & { email?: string; realm_access?: { roles?: string[] } };
    try {
      ({ payload } = await jwtVerify(token, this.getJwks(), {
        issuer: this.issuer,
        audience: process.env.KEYCLOAK_CLIENT_ID,
      }));
    } catch (e) {
      this.logger.warn(`Keycloak token verification failed: ${(e as Error).message}`);
      throw new UnauthorizedException('Invalid token');
    }

    const role = this.mapRole(payload);
    const email = payload.email ?? '';
    // Resolve our app profile ids by the federated identity / email.
    const user = email
      ? await this.prisma.user.findUnique({
          where: { email },
          include: { coachProfile: true, clientProfile: true },
        })
      : null;

    return {
      sub: payload.sub ?? '',
      email,
      role,
      coachProfileId: user?.coachProfile?.id,
      clientProfileId: user?.clientProfile?.id,
    };
  }
}
