import { timingSafeEqual } from 'node:crypto';

import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { generateHOTP } from 'oslo/otp';

import { DOCUMENSO_ENCRYPTION_KEY } from '../../constants/crypto';

export type SigningGateCodeIdentity = {
  recipientToken: string;
  recipientEmail: string;
  // Random per send: only the most recently emailed code can work, and a code is never valid unless one was sent.
  requestId: string;
};

const getSecret = ({ recipientToken, recipientEmail, requestId }: SigningGateCodeIdentity) => {
  if (!DOCUMENSO_ENCRYPTION_KEY) {
    throw new Error('Missing NEXT_PRIVATE_ENCRYPTION_KEY');
  }

  return hmac(
    sha256,
    DOCUMENSO_ENCRYPTION_KEY,
    `signing-gate|v2|recipient:${recipientToken}|email:${recipientEmail.toLowerCase()}|request:${requestId}`,
  );
};

// The secret is unique per send (requestId), so a fixed HOTP counter gives exactly one code per
// email; its lifetime is enforced from the send time recorded in the audit trail.
const CODE_COUNTER = 0;

export const generateSigningGateCode = async (identity: SigningGateCodeIdentity) => {
  return await generateHOTP(getSecret(identity), CODE_COUNTER);
};

export const validateSigningGateCode = async (identity: SigningGateCodeIdentity, code: string) => {
  const expected = await generateHOTP(getSecret(identity), CODE_COUNTER);

  return expected.length === code.length && timingSafeEqual(Buffer.from(expected), Buffer.from(code));
};
