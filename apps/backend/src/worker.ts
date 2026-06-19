/**
 * BullMQ worker process entrypoint (run via `pnpm --filter @coachg/backend start:worker`).
 * Handles heavy, async jobs offloaded from the API: report generation, AI
 * explanation batches, exercise-library ETL. Scaled independently in production.
 */
import { Worker, type ConnectionOptions } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { renderReportPdf, ReportData } from '@coachg/report-engine';

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

const prisma = new PrismaClient();

// NOTE: object-storage upload is abstracted; wire to ArvanCloud S3 client here.
async function uploadPdf(key: string, _buffer: Buffer): Promise<string> {
  // TODO(Phase 5): use @aws-sdk/client-s3 against S3_ENDPOINT (ArvanCloud).
  return key;
}

new Worker(
  'reports',
  async (job) => {
    const { reportId, data } = job.data as { reportId: string; data: ReportData };
    await prisma.report.update({ where: { id: reportId }, data: { status: 'PROCESSING' } });
    try {
      const pdf = await renderReportPdf(data);
      const key = await uploadPdf(`reports/${reportId}.pdf`, pdf);
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
