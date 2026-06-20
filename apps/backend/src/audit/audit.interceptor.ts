import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Audit interceptor: records every mutating request (POST/PATCH/PUT/DELETE) to
 * the AuditLog table. Read requests are skipped to avoid noise.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const mutating = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method);

    return next.handle().pipe(
      tap(() => {
        if (!mutating) return;
        void this.prisma.auditLog
          .create({
            data: {
              actorId: req.user?.sub ?? null,
              action: `${req.method} ${req.route?.path ?? req.url}`,
              entityType: (req.route?.path ?? req.url).split('/')[3] ?? 'unknown',
              entityId: req.params?.id ?? null,
              ip: req.ip,
              metadata: { params: req.params, query: req.query },
            },
          })
          .catch(() => undefined); // never let audit failure break the request
      }),
    );
  }
}
