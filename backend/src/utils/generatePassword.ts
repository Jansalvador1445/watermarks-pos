import crypto from 'crypto';

/** Generates a secure 10-character temporary password */
export const generateTempPassword = (): string => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;

  const pick = (chars: string) => chars[crypto.randomInt(chars.length)];

  const required = [pick(upper), pick(lower), pick(digits), pick(symbols), pick(symbols)];
  const rest = Array.from({ length: 5 }, () => pick(all));

  return [...required, ...rest]
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
};
