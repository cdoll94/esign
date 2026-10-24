import { prisma } from '@documenso/prisma';

import { AppError, AppErrorCode } from '../../errors/app-error';
import { DOCUMENT_AUDIT_LOG_TYPE } from '../../types/document-audit-logs';
import type { RequestMetadata } from '../../universal/extract-request-metadata';
import { createDocumentAuditLogData } from '../../utils/document-audit-logs';
import { validateSigningGateCode } from './code';
import { SIGNING_GATE_DISCLOSURE_VERSION } from './constants';
import { getSigningGateRecipient } from './get-gate-recipient';

export type VerifySigningGateOptions = {
  recipientToken: string;
  code: string;
  hasConsented: boolean;
  requestMetadata?: RequestMetadata;
};

/**
 * Records the signer's consent to electronic records (ESIGN Act / UETA) and
 * checks the emailed code. Consent is recorded once per recipient even if they
 * come back on another device.
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
  };

  const isValid = await validateSigningGateCode(recipientToken, code);

  if (!isValid) {
    await prisma.documentAuditLog.create({
      data: createDocumentAuditLogData({
        type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_ACCESS_AUTH_2FA_FAILED,
        envelopeId: envelope.id,
        user: {
          name: recipient.name,
          email: recipient.email,
        },
        requestMetadata,
        data: recipientData,
      }),
    });

    throw new AppError(AppErrorCode.INVALID_BODY, { message: 'Invalid code' });
  }

  await prisma.documentAuditLog.create({
    data: createDocumentAuditLogData({
      type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_ACCESS_AUTH_2FA_VALIDATED,
      envelopeId: envelope.id,
      user: {
        name: recipient.name,
        email: recipient.email,
      },
      requestMetadata,
      data: recipientData,
    }),
  });

  const existingConsent = await prisma.documentAuditLog.findFirst({
    where: {
      envelopeId: envelope.id,
      type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_ESIGN_CONSENTED,
      data: {
        path: ['recipientId'],
        equals: recipient.id,
      },
    },
    select: { id: true },
  });

  if (!existingConsent) {
    await prisma.documentAuditLog.create({
      data: createDocumentAuditLogData({
        type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_ESIGN_CONSENTED,
        envelopeId: envelope.id,
        user: {
          name: recipient.name,
          email: recipient.email,
        },
        requestMetadata,
        data: {
          ...recipientData,
          disclosureVersion: SIGNING_GATE_DISCLOSURE_VERSION,
        },
      }),
    });
  }
};
