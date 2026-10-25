import { prisma } from '@documenso/prisma';
import { DateTime } from 'luxon';
import { z } from 'zod';

import { AppError, AppErrorCode } from '../../errors/app-error';
import { DOCUMENT_AUDIT_LOG_TYPE } from '../../types/document-audit-logs';
import type { RequestMetadata } from '../../universal/extract-request-metadata';
import { createDocumentAuditLogData } from '../../utils/document-audit-logs';
import { validateSigningGateCode } from './code';
import {
  SIGNING_GATE_AUDIT_SOURCE,
  SIGNING_GATE_CODE_EXPIRATION_MINUTES,
  SIGNING_GATE_DISCLOSURE_VERSION,
  SIGNING_GATE_MAX_FAILURES_PER_CODE,
  SIGNING_GATE_MAX_FAILURES_PER_DAY,
} from './constants';
import { getSigningGateRecipient } from './get-gate-recipient';

export const SIGNING_GATE_ERROR = {
  NO_ACTIVE_CODE: 'SIGNING_GATE_NO_ACTIVE_CODE',
  CODE_ATTEMPTS_EXCEEDED: 'SIGNING_GATE_CODE_ATTEMPTS_EXCEEDED',
  LOCKED_FOR_DAY: 'SIGNING_GATE_LOCKED_FOR_DAY',
  INVALID_CODE: 'SIGNING_GATE_INVALID_CODE',
} as const;

export type VerifySigningGateOptions = {
  recipientToken: string;
  code: string;
  hasConsented: boolean;
  requestMetadata?: RequestMetadata;
};

// Gate entries for this recipient at their current address: attempts made while the recipient had
// another email (before the sender corrected it) never count against, or unlock, the new address.
const gateLogWhere = (envelopeId: string, recipientId: number, recipientEmail: string) => ({
  envelopeId,
  AND: [
    { data: { path: ['recipientId'], equals: recipientId } },
    { data: { path: ['recipientEmail'], equals: recipientEmail } },
    { data: { path: ['source'], equals: SIGNING_GATE_AUDIT_SOURCE } },
  ],
});

/**
 * Records the signer's consent to electronic records (ESIGN Act / UETA) and checks the code
 * from the most recent code email. Returns the recipient's email for binding the gate session.
 */
export const verifySigningGate = async ({
  recipientToken,
  code,
  hasConsented,
  requestMetadata,
}: VerifySigningGateOptions) => {
  if (!hasConsented) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, { message: 'Consent is required' });
  }

  const recipient = await getSigningGateRecipient(recipientToken);
  const { envelope } = recipient;

  const recipientData = {
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    recipientId: recipient.id,
    source: SIGNING_GATE_AUDIT_SOURCE,
  };

  const auditUser = { name: recipient.name, email: recipient.email };

  const failuresToday = await prisma.documentAuditLog.count({
    where: {
      ...gateLogWhere(envelope.id, recipient.id, recipient.email),
      type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_ACCESS_AUTH_2FA_FAILED,
      createdAt: { gte: DateTime.now().minus({ days: 1 }).toJSDate() },
    },
  });

  if (failuresToday >= SIGNING_GATE_MAX_FAILURES_PER_DAY) {
    throw new AppError(SIGNING_GATE_ERROR.LOCKED_FOR_DAY, { message: 'Too many incorrect codes today' });
  }

  const latestRequest = await prisma.documentAuditLog.findFirst({
    where: {
      ...gateLogWhere(envelope.id, recipient.id, recipient.email),
      type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_ACCESS_AUTH_2FA_REQUESTED,
      createdAt: { gte: DateTime.now().minus({ minutes: SIGNING_GATE_CODE_EXPIRATION_MINUTES }).toJSDate() },
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, data: true },
  });

  const requestId = z.object({ gateRequestId: z.string() }).safeParse(latestRequest?.data);

  if (!latestRequest || !requestId.success) {
    throw new AppError(SIGNING_GATE_ERROR.NO_ACTIVE_CODE, { message: 'No active code; request a new one' });
  }

  const failuresForThisCode = await prisma.documentAuditLog.count({
    where: {
      ...gateLogWhere(envelope.id, recipient.id, recipient.email),
      type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_ACCESS_AUTH_2FA_FAILED,
      createdAt: { gte: latestRequest.createdAt },
    },
  });

  if (failuresForThisCode >= SIGNING_GATE_MAX_FAILURES_PER_CODE) {
    throw new AppError(SIGNING_GATE_ERROR.CODE_ATTEMPTS_EXCEEDED, { message: 'Too many attempts; request a new code' });
  }

  const isValid = await validateSigningGateCode(
    { recipientToken, recipientEmail: recipient.email, requestId: requestId.data.gateRequestId },
    code,
  );

  if (!isValid) {
    await prisma.documentAuditLog.create({
      data: createDocumentAuditLogData({
        type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_ACCESS_AUTH_2FA_FAILED,
        envelopeId: envelope.id,
        user: auditUser,
        requestMetadata,
        data: recipientData,
      }),
    });

    throw new AppError(SIGNING_GATE_ERROR.INVALID_CODE, { message: 'Invalid code' });
  }

  await prisma.documentAuditLog.create({
    data: createDocumentAuditLogData({
      type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_ACCESS_AUTH_2FA_VALIDATED,
      envelopeId: envelope.id,
      user: auditUser,
      requestMetadata,
      data: recipientData,
    }),
  });

  // One consent record per recipient per disclosure version, so a re-consent to new wording is on record.
  const existingConsent = await prisma.documentAuditLog.findFirst({
    where: {
      envelopeId: envelope.id,
      type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_ESIGN_CONSENTED,
      AND: [
        { data: { path: ['recipientId'], equals: recipient.id } },
        { data: { path: ['disclosureVersion'], equals: SIGNING_GATE_DISCLOSURE_VERSION } },
      ],
    },
    select: { id: true },
  });

  if (!existingConsent) {
    await prisma.documentAuditLog.create({
      data: createDocumentAuditLogData({
        type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_ESIGN_CONSENTED,
        envelopeId: envelope.id,
        user: auditUser,
        requestMetadata,
        data: {
          ...recipientData,
          disclosureVersion: SIGNING_GATE_DISCLOSURE_VERSION,
        },
      }),
    });
  }

  return { recipientEmail: recipient.email };
};
