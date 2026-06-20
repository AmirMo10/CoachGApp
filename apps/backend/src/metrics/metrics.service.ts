import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Histogram, Registry } from 'prom-client';

/**
 * Prometheus metrics registry. Collects Node/process default metrics plus an
 * HTTP request-duration histogram (labelled by method/route/status) recorded by
 * the MetricsInterceptor. Exposed at GET /api/v1/metrics for scraping.
 */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();
  readonly httpDuration: Histogram<string>;

  constructor() {
    this.registry.setDefaultLabels({ app: process.env.APP_NAME ?? 'coachg-backend' });
    collectDefaultMetrics({ register: this.registry });

    this.httpDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });
  }

  observe(method: string, route: string, status: number, seconds: number): void {
    this.httpDuration.labels(method, route, String(status)).observe(seconds);
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }
}
