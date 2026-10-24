import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

import { NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';
import { DOCUMENSO_ENCRYPTION_KEY } from '../../constants/crypto';
import { SIGNING_GATE_COOKIE_PREFIX, SIGNING_GATE_SESSION_HOURS } from './constants';

const sign = (recipientToken: string, expiresAt: number) => {
  if (!DOCUMENSO_ENCRYPTION_KEY) {
    throw new Error('Missing NEXT_PRIVATE_ENCRYPTION_KEY');
  }

  return bytesToHex(hmac(sha256, DOCUMENSO_ENCRYPTION_KEY, `signing-gate-session|v1|${recipientToken}|${expiresAt}`));
};

// The cookie name carries a hash of the token, never the token itself.
const getCookieName = (recipientToken: string) =>
  `${SIGNING_GATE_COOKIE_PREFIX}${bytesToHex(sha256(recipientToken)).slice(0, 16)}`;

const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;

  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
};

export const buildSigningGateCookieHeader = (recipientToken: string) => {
  const expiresAt = Date.now() + SIGNING_GATE_SESSION_HOURS * 60 * 60 * 1000;
  const value = `${expiresAt}.${sign(recipientToken, expiresAt)}`;
  const isSecure = NEXT_PUBLIC_WEBAPP_URL().startsWith('https://');

  return [
    `${getCookieName(recipientToken)}=${value}`,
    'Path=/',
    `Max-Age=${SIGNING_GATE_SESSION_HOURS * 60 * 60}`,
    'HttpOnly',
    'SameSite=Lax',
    isSecure ? 'Secure' : null,
  ]
    .filter(Boolean)
    .join('; ');
};

export const hasValidSigningGateCookie = (request: Request, recipientToken: string) => {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const name = getCookieName(recipientToken);

  const value = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);

  if (!value) {
    return false;
  }

  const [expiresAtRaw, signature] = value.split('.');
  const expiresAt = Number(expiresAtRaw);

  if (!signature || !Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  return timingSafeEqual(signature, sign(recipientToken, expiresAt));
};
