import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

/** Hash untuk kolom password_hash (format self-contained, tanpa dependency bcrypt). */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = pbkdf2Sync(plain, salt, 100_000, 64, 'sha512').toString('hex');
  return `pbkdf2$${salt}$${derived}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored || !stored.startsWith('pbkdf2$')) return false;
  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  const [, salt, expected] = parts;
  const derived = pbkdf2Sync(plain, salt, 100_000, 64, 'sha512').toString('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(derived, 'hex'));
  } catch {
    return false;
  }
}
