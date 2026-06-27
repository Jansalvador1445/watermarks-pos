import crypto from 'crypto';

/** Cryptographically secure reference token (128-bit entropy). */
export const generateSecureReference = (prefix: string): string => {
  const token = crypto.randomBytes(16).toString('hex');
  return `${prefix}-${token}`;
};
