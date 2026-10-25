import { prisma } from '@documenso/prisma';
import { DocumentStatus, RecipientRole, SigningStatus } from '@prisma/client';

import { hasValidSigningGateCookie } from './session-cookie';

export type IsSigningGateSatisfiedOptions = {
  request: Request;
  recipientToken: string;
};

/**
 * For routes that serve or act on a document by recipient token outside the signing page.
 * Only a recipient who has signed, a CC recipient, or a fully completed document is exempt;
 * pending, rejected and cancelled documents all need a valid gate session. QR share tokens
 * (certificate verification links for completed documents) are unaffected.
 */
export const isSigningGateSatisfied = async ({ request, recipientToken }: IsSigningGateSatisfiedOptions) => {
  if (recipientToken.startsWith('qr_')) {
    return true;
  }

  const recipient = await prisma.recipient.findFirst({
    where: { token: recipientToken },
    select: {
      email: true,
      role: true,
      signingStatus: true,
      envelope: { select: { status: true } },
    },
  });

  if (!recipient) {
    return true;
  }

  const isExempt =
    recipient.envelope.status === DocumentStatus.COMPLETED ||
    recipient.signingStatus === SigningStatus.SIGNED ||
    recipient.role === RecipientRole.CC;

  if (isExempt) {
    return true;
  }

  return hasValidSigningGateCookie(request, recipientToken, recipient.email);
};
