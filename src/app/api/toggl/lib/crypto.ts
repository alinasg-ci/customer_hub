/**
 * Back-compat shim. The generic implementation lives in
 * src/shared/utils/crypto.ts; Toggl keeps its own API using TOGGL_ENCRYPTION_KEY.
 */
import { encryptWith, decryptWith } from '@/shared/utils/crypto';

const ENV_VAR = 'TOGGL_ENCRYPTION_KEY';

export function encrypt(plaintext: string): string {
  return encryptWith(ENV_VAR, plaintext);
}

export function decrypt(ciphertext: string): string {
  return decryptWith(ENV_VAR, ciphertext);
}
