import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { generateHOTP } from 'oslo/otp';

import { DOCUMENSO_ENCRYPTION_KEY } from '../../constants/crypto';
import { SIGNING_GATE_CODE_PERIOD_MS, SIGNING_GATE_CODE_WINDOW } from './constants';

const getSecret = (recipientToken: string) => {
  if (!DOCUMENSO_ENCRYPTION_KEY) {
    throw new Error('Missing NEXT_PRIVATE_ENCRYPTION_KEY');
  }

  return hmac(sha256, DOCUMENSO_ENCRYPTION_KEY, `signing-gate|v1|recipient:${recipientToken}`);
};

export const generateSigningGateCode = async (recipientToken: string) => {
  const counter = Math.floor(Date.now() / SIGNING_GATE_CODE_PERIOD_MS);

  return await generateHOTP(getSecret(recipientToken), counter);
};

export const validateSigningGateCode = async (recipientToken: string, code: string) => {
  const secret = getSecret(recipientToken);
  const currentCounter = Math.floor(Date.now() / SIGNING_GATE_CODE_PERIOD_MS);

  for (let offset = 0; offset < SIGNING_GATE_CODE_WINDOW; offset++) {
    const expected = await generateHOTP(secret, currentCounter - offset);

    if (expected === code) {
      return true;
    }
  }

  return false;
};
