import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@coachg/types';

export interface AuthUser {
  sub: string;
  email: string;
  role: Role;
  coachProfileId?: string;
  clientProfileId?: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
