import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { generateHOTP } from 'oslo/otp';

import { DOCUMENSO_ENCRYPTION_KEY } from '../../constants/crypto';
import { SIGNING_GATE_CODE_PERIOD_MS, SIGNING_GATE_CODE_WINDOW } from './constants';

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

export const generateSigningGateCode = async (identity: SigningGateCodeIdentity) => {
  const counter = Math.floor(Date.now() / SIGNING_GATE_CODE_PERIOD_MS);

  return await generateHOTP(getSecret(identity), counter);
};

export const validateSigningGateCode = async (identity: SigningGateCodeIdentity, code: string) => {
  const secret = getSecret(identity);
  const currentCounter = Math.floor(Date.now() / SIGNING_GATE_CODE_PERIOD_MS);

  for (let offset = 0; offset < SIGNING_GATE_CODE_WINDOW; offset++) {
    const expected = await generateHOTP(secret, currentCounter - offset);

    if (expected === code) {
      return true;
    }
  }

  return false;
};
