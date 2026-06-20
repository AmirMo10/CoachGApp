import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

/** Records request duration for every HTTP request into the Prometheus histogram. */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (ctx.getType() !== 'http') return next.handle();
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    const start = process.hrtime.bigint();

    const record = () => {
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      // Use the matched route pattern (not the raw URL) to keep label cardinality low.
      const route = req.route?.path ?? 'unknown';
      this.metrics.observe(req.method, route, res.statusCode, seconds);
    };

    return next.handle().pipe(tap({ next: record, error: record }));
  }
}
