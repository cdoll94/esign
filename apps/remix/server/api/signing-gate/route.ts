import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { assertRateLimit } from '@documenso/lib/server-only/rate-limit/rate-limit-middleware';
import {
  signingGateSendCodeRateLimit,
  signingGateVerifyRateLimit,
} from '@documenso/lib/server-only/rate-limit/rate-limits';
import { sendSigningGateCode } from '@documenso/lib/server-only/signing-gate/send-signing-gate-code';
import { buildSigningGateCookieHeader } from '@documenso/lib/server-only/signing-gate/session-cookie';
import { SIGNING_GATE_ERROR, verifySigningGate } from '@documenso/lib/server-only/signing-gate/verify-signing-gate';
import { sValidator } from '@hono/standard-validator';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';

import type { HonoEnv } from '../../router';

const ZSendCodeRequestSchema = z.object({
  token: z.string().min(1),
});

const ZVerifyRequestSchema = z.object({
  token: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
  hasConsented: z.literal(true),
});

// Rate-limit rows are stored in plain text, so key them by a hash of the signing token.
const hashToken = (token: string) => bytesToHex(sha256(`signing-gate|${token}`));

const toErrorResponse = (c: Context<HonoEnv>, error: unknown) => {
  const appError = AppError.parseError(error);

  const status = (() => {
    switch (appError.code) {
      case AppErrorCode.TOO_MANY_REQUESTS:
        return 429;
      case AppErrorCode.NOT_FOUND:
        return 404;
      case AppErrorCode.INVALID_BODY:
      case AppErrorCode.INVALID_REQUEST:
      case SIGNING_GATE_ERROR.INVALID_CODE:
      case SIGNING_GATE_ERROR.NO_ACTIVE_CODE:
      case SIGNING_GATE_ERROR.CODE_ATTEMPTS_EXCEEDED:
      case SIGNING_GATE_ERROR.LOCKED_FOR_DAY:
        return 400;
      default:
        return 500;
    }
  })();

  if (status === 500) {
    c.get('logger').error({ event: 'signing_gate.error', error: appError.message });
  }

  return c.json({ code: appError.code }, status);
};

export const signingGateRoute = new Hono<HonoEnv>()
  .post('/send-code', sValidator('json', ZSendCodeRequestSchema), async (c) => {
    const { token } = c.req.valid('json');
    const { requestMetadata } = c.get('context');

    try {
      assertRateLimit(
        await signingGateSendCodeRateLimit.check({
          ip: requestMetadata.ipAddress ?? 'unknown',
          identifier: hashToken(token),
        }),
      );

      await sendSigningGateCode({ recipientToken: token, requestMetadata });

      return c.json({ success: true });
    } catch (error) {
      return toErrorResponse(c, error);
    }
  })
  .post('/verify', sValidator('json', ZVerifyRequestSchema), async (c) => {
    const { token, code, hasConsented } = c.req.valid('json');
    const { requestMetadata } = c.get('context');

    try {
      assertRateLimit(
        await signingGateVerifyRateLimit.check({
          ip: requestMetadata.ipAddress ?? 'unknown',
          identifier: hashToken(token),
        }),
      );

      const { recipientEmail } = await verifySigningGate({
        recipientToken: token,
        code,
        hasConsented,
        requestMetadata,
      });

      c.header('Set-Cookie', buildSigningGateCookieHeader(token, recipientEmail));

      return c.json({ success: true });
    } catch (error) {
      return toErrorResponse(c, error);
    }
  });
