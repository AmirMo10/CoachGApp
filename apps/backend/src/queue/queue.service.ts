import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue, type ConnectionOptions } from 'bullmq';

export const REPORTS_QUEUE = 'reports';

/**
 * Central BullMQ queue provider. Producers enqueue jobs here; the separate
 * worker process (src/worker.ts) consumes them. Connection points at Redis.
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly connection: ConnectionOptions = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  };

  readonly reports = new Queue(REPORTS_QUEUE, { connection: this.connection });

  async enqueueReport(reportId: string, data: unknown): Promise<void> {
    await this.reports.add('generate', { reportId, data }, { attempts: 3, removeOnComplete: true });
  }

  async onModuleDestroy(): Promise<void> {
    await this.reports.close();
  }
}
