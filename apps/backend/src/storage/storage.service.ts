import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * S3-compatible object storage (ArvanCloud Object Storage; MinIO in dev).
 * Uses the AWS S3 SDK purely as an S3-protocol client against a custom
 * endpoint — no AWS-managed services are involved.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = process.env.S3_BUCKET ?? 'coachg';
  private readonly client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? 'ir-thr-at1',
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? '',
      secretAccessKey: process.env.S3_SECRET_KEY ?? '',
    },
  });

  /** Allowlist of mime types accepted for client uploads (secure uploads). */
  private static readonly ALLOWED = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]);

  isAllowed(mimeType: string): boolean {
    return StorageService.ALLOWED.has(mimeType);
  }

  /** Randomized object key to avoid enumeration / collisions. */
  buildKey(prefix: string, filename: string): string {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${prefix}/${randomUUID()}-${safe}`;
  }

  /** Presigned PUT URL for direct client upload (size enforced client-side + at proxy). */
  async presignUpload(key: string, contentType: string, expiresIn = 300): Promise<string> {
    const cmd = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    return getSignedUrl(this.client, cmd, { expiresIn });
  }

  /** Presigned GET URL for time-limited download (reports, documents). */
  async presignDownload(key: string, expiresIn = 300): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn });
  }

  /** Direct server-side upload (used by the report worker). */
  async putObject(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
    return key;
  }
}
