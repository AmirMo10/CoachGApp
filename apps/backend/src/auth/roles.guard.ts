import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@coachg/types';
import { PUBLIC_KEY, ROLES_KEY } from './roles.decorator';

/**
 * Combined authentication + RBAC guard.
 * - Public routes bypass auth.
 * - Otherwise a valid Bearer JWT is required; the decoded payload is attached
 *   to req.user.
 * - If @Roles() is present, the user's role must be included.
 *
 * Ownership checks (coach -> own clients, client -> own data) are enforced in
 * the service layer where the resource is known.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    try {
      req.user = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET ?? 'dev-only-change-me',
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    return requiredRoles.includes(req.user.role);
  }

  private extractToken(req: { headers: Record<string, string | undefined> }): string | null {
    const auth = req.headers.authorization;
    if (!auth) return null;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
