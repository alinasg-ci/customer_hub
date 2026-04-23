/**
 * AES-256-GCM symmetric encryption for secrets and sensitive content stored
 * in Supabase (Toggl tokens, Gmail refresh tokens, email bodies).
 *
 * Each domain supplies its own 32-byte key via a named env var, hex-encoded
 * (64 chars). Output is base64 of: IV(12) ‖ ciphertext ‖ auth-tag(16).
 *
 * Never log plaintext or ciphertext.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function loadKey(envVar: string): Buffer {
  const key = process.env[envVar];
  if (!key) {
    throw new Error(`${envVar} is not configured`);
  }
  if (key.length !== 64) {
    throw new Error(`${envVar} must be 64 hex characters (32 bytes for AES-256)`);
  }
  return Buffer.from(key, 'hex');
}

export function encryptWith(envVar: string, plaintext: string): string {
  const key = loadKey(envVar);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, encrypted, tag]).toString('base64');
}

export function decryptWith(envVar: string, ciphertext: string): string {
  const key = loadKey(envVar);
  const combined = Buffer.from(ciphertext, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(combined.length - TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
