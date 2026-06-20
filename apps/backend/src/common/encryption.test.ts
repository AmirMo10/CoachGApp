import { describe, expect, it } from 'vitest';
import { decryptField, decryptNullable, encryptField, encryptNullable } from './encryption';

describe('field encryption (AES-256-GCM)', () => {
  it('round-trips a value', () => {
    const ct = encryptField('120');
    expect(ct.startsWith('v1.')).toBe(true);
    expect(ct).not.toContain('120');
    expect(decryptField(ct)).toBe('120');
  });

  it('produces a different ciphertext each time (random IV)', () => {
    expect(encryptField('same')).not.toBe(encryptField('same'));
  });

  it('detects tampering via the auth tag', () => {
    const ct = encryptField('secret');
    const parts = ct.split('.');
    const tampered = `${parts[0]}.${parts[1]}.${parts[2]}.${Buffer.from('evil').toString('base64')}`;
    expect(() => decryptField(tampered)).toThrow();
  });

  it('passes through non-encrypted (legacy) values', () => {
    expect(decryptField('plain-text')).toBe('plain-text');
  });

  it('handles nullable helpers', () => {
    expect(encryptNullable(null)).toBeNull();
    expect(decryptNullable(null)).toBeNull();
    expect(decryptNullable(encryptNullable('x'))).toBe('x');
  });
});
