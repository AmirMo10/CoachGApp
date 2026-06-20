import { SetMetadata } from '@nestjs/common';
import { Role } from '@coachg/types';

export const ROLES_KEY = 'roles';
/** Restrict a route to specific roles. Used with RolesGuard. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const PUBLIC_KEY = 'isPublic';
/** Mark a route as public (skips auth). */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
