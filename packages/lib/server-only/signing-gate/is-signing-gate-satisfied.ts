import { prisma } from '@documenso/prisma';
import { DocumentStatus, RecipientRole, SigningStatus } from '@prisma/client';

import { hasValidSigningGateCookie } from './session-cookie';

export type IsSigningGateSatisfiedOptions = {
  request: Request;
  recipientToken: string;
  sessionEmail?: string | null;
};

/**
 * For routes that serve or act on a document by recipient token outside the signing
 * page. Only recipients still due to act need to have passed the gate; completed
 * documents and QR share tokens are unaffected.
 */
export const isSigningGateSatisfied = async ({
  request,
  recipientToken,
  sessionEmail,
}: IsSigningGateSatisfiedOptions) => {
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

  const isAwaitingRecipient =
    recipient.envelope.status === DocumentStatus.PENDING &&
    recipient.signingStatus === SigningStatus.NOT_SIGNED &&
    recipient.role !== RecipientRole.CC;

  if (!isAwaitingRecipient) {
    return true;
  }

  if (sessionEmail && sessionEmail === recipient.email) {
    return true;
  }

  return hasValidSigningGateCookie(request, recipientToken);
};
