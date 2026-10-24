import { prisma } from '@documenso/prisma';
import { DocumentStatus, EnvelopeType } from '@prisma/client';

import { AppError, AppErrorCode } from '../../errors/app-error';

export const getSigningGateRecipient = async (recipientToken: string) => {
  const recipient = await prisma.recipient.findFirst({
    where: {
      token: recipientToken,
      envelope: {
        type: EnvelopeType.DOCUMENT,
        status: DocumentStatus.PENDING,
      },
    },
    include: {
      envelope: {
        include: {
          documentMeta: true,
        },
      },
    },
  });

  if (!recipient) {
    throw new AppError(AppErrorCode.NOT_FOUND, { message: 'Recipient not found' });
  }

  return recipient;
};
