import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { JWT_SECRET } from '$env/static/private';
import db from './db';

// Derive a 32-byte AES key from JWT_SECRET via SHA-256
function getEncryptionKey(): Buffer {
  return createHash('sha256').update(JWT_SECRET).digest();
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16-byte authentication tag
  // Format: iv(12) + tag(16) + ciphertext — all base64
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

// Encrypted settings — only for sensitive keys (no remote AI keys; local stack uses env).
const ENCRYPTED_KEYS = new Set<string>([]);

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.appSetting.findUnique({ where: { key } });
  if (!row?.value) return null;
  if (ENCRYPTED_KEYS.has(key)) {
    try {
      return decrypt(row.value);
    } catch {
      return null; // tampered or wrong secret
    }
  }
  return row.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const stored = ENCRYPTED_KEYS.has(key) ? encrypt(value) : value;
  await db.appSetting.upsert({
    where: { key },
    update: { value: stored },
    create: { key, value: stored },
  });
}
