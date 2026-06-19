/**
 * BullMQ worker process entrypoint (run via `pnpm --filter @coachg/backend start:worker`).
 * Handles heavy, async jobs offloaded from the API: report generation, AI
 * explanation batches, exercise-library ETL. Scaled independently in production.
 */
import { Worker, type ConnectionOptions } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { renderReportPdf, ReportData } from '@coachg/report-engine';
import { StorageService } from './storage/storage.service';

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

const prisma = new PrismaClient();
// StorageService has no DI dependencies, so it can be used outside the Nest context.
const storage = new StorageService();

new Worker(
  'reports',
  async (job) => {
    const { reportId, data } = job.data as { reportId: string; data: ReportData };
    await prisma.report.update({ where: { id: reportId }, data: { status: 'PROCESSING' } });
    try {
      const pdf = await renderReportPdf(data);
      const key = await storage.putObject(`reports/${reportId}.pdf`, pdf, 'application/pdf');
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'READY', objectKey: key },
      });
    } catch (err) {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'FAILED', error: String(err) },
      });
      throw err;
    }
  },
  { connection },
);

// eslint-disable-next-line no-console
console.log('Coach"G" worker started, listening on queues: reports');
