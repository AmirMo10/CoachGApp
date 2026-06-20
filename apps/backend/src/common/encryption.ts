import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

/**
 * Application-level field encryption for sensitive PII at rest (Module 9 bloodwork).
 *
 * AES-256-GCM (authenticated encryption). The 32-byte key is derived from
 * `ENCRYPTION_KEY` via scrypt with a fixed salt so ciphertext is stable across
 * restarts. Output format: `v1.<ivB64>.<tagB64>.<ctB64>`.
 *
 * Decryption is back-compatible: values that aren't in the `v1.` envelope are
 * returned as-is (so pre-encryption rows / plaintext still read).
 */
const ALGO = 'aes-256-gcm';
const VERSION = 'v1';

let cachedKey: Buffer | null = null;
function key(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.ENCRYPTION_KEY || 'dev-only-encryption-key-change-me';
  cachedKey = scryptSync(secret, 'coachg-field-enc-salt', 32);
  return cachedKey;
}

export function encryptField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}.${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`;
}

export function decryptField(blob: string): string {
  const parts = blob.split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) return blob; // not encrypted → passthrough
  const [, ivB64, tagB64, ctB64] = parts;
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivB64!, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64!, 'base64'));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctB64!, 'base64')), decipher.final()]);
  return pt.toString('utf8');
}

/** Convenience helpers for nullable fields. */
export const encryptNullable = (v: string | null | undefined): string | null =>
  v == null ? null : encryptField(v);
export const decryptNullable = (v: string | null | undefined): string | null =>
  v == null ? null : decryptField(v);
