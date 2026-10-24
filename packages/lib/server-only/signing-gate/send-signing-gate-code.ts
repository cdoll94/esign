import { SigningGateCodeEmailTemplate } from '@documenso/email/templates/signing-gate-code';
import { prisma } from '@documenso/prisma';
import { msg } from '@lingui/core/macro';
import { createElement } from 'react';

import { getI18nInstance } from '../../client-only/providers/i18n-server';
import { NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';
import { AppError, AppErrorCode } from '../../errors/app-error';
import { DOCUMENT_AUDIT_LOG_TYPE } from '../../types/document-audit-logs';
import type { RequestMetadata } from '../../universal/extract-request-metadata';
import { createDocumentAuditLogData } from '../../utils/document-audit-logs';
import { isRecipientEmailValidForSending } from '../../utils/recipients';
import { renderEmailWithI18N } from '../../utils/render-email-with-i18n';
import { getEmailContext } from '../email/get-email-context';
import { getProviderMessageId } from '../email/get-provider-message-id';
import { generateSigningGateCode } from './code';
import { SIGNING_GATE_CODE_EXPIRATION_MINUTES } from './constants';
import { getSigningGateRecipient } from './get-gate-recipient';

export type SendSigningGateCodeOptions = {
  recipientToken: string;
  requestMetadata?: RequestMetadata;
};

export const sendSigningGateCode = async ({ recipientToken, requestMetadata }: SendSigningGateCodeOptions) => {
  const recipient = await getSigningGateRecipient(recipientToken);
  const { envelope } = recipient;

  if (!isRecipientEmailValidForSending(recipient)) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, { message: 'Recipient is missing email address' });
  }

  const code = await generateSigningGateCode(recipientToken);

  const { branding, emailLanguage, senderEmail, replyToEmail, emailTransport } = await getEmailContext({
    emailType: 'RECIPIENT',
    source: {
      type: 'team',
      teamId: envelope.teamId,
    },
    meta: envelope.documentMeta,
  });

  const i18n = await getI18nInstance(emailLanguage);

  const template = createElement(SigningGateCodeEmailTemplate, {
    documentTitle: envelope.title,
    userName: recipient.name,
    code,
    expiresInMinutes: SIGNING_GATE_CODE_EXPIRATION_MINUTES,
    assetBaseUrl: NEXT_PUBLIC_WEBAPP_URL(),
  });

  const [html, text] = await Promise.all([
    renderEmailWithI18N(template, { lang: emailLanguage, branding }),
    renderEmailWithI18N(template, { lang: emailLanguage, branding, plainText: true }),
  ]);

  const sentEmail = await emailTransport.sendMail({
    to: {
      address: recipient.email,
      name: recipient.name,
    },
    from: senderEmail,
    replyTo: replyToEmail,
    subject: i18n._(msg`Your code to open "${envelope.title}"`),
    html,
    text,
  });

  await prisma.documentAuditLog.create({
    data: createDocumentAuditLogData({
      type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_ACCESS_AUTH_2FA_REQUESTED,
      envelopeId: envelope.id,
      user: {
        name: recipient.name,
        email: recipient.email,
      },
      requestMetadata,
      data: {
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        recipientId: recipient.id,
        providerMessageId: getProviderMessageId(sentEmail),
      },
    }),
  });

  return { email: recipient.email };
};
