import { createHmac, timingSafeEqual } from 'node:crypto';

const TOLERANCE_SECONDS = 5 * 60;

export type VerifySvixSignatureOptions = {
  secret: string;
  id: string | undefined;
  timestamp: string | undefined;
  signature: string | undefined;
  body: string;
};

/**
 * Verifies a webhook signed with the Svix scheme, which Resend uses: base64 HMAC-SHA256 of
 * `${id}.${timestamp}.${body}` keyed with the base64 part of the `whsec_` secret.
 */
export const verifySvixSignature = ({ secret, id, timestamp, signature, body }: VerifySvixSignatureOptions) => {
  if (!id || !timestamp || !signature) {
    return false;
  }

  const timestampSeconds = Number(timestamp);

  if (!Number.isFinite(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > TOLERANCE_SECONDS) {
    return false;
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest();

  return signature.split(' ').some((entry) => {
    const [version, value] = entry.split(',');

    if (version !== 'v1' || !value) {
      return false;
    }

    const provided = Buffer.from(value, 'base64');

    return provided.length === expected.length && timingSafeEqual(provided, expected);
  });
};
