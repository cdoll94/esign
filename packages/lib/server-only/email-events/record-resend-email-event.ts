import { prisma } from '@documenso/prisma';
import { z } from 'zod';
import type { ZEmailDeliveryEventTypeSchema } from '../../types/document-audit-logs';
import { DOCUMENT_AUDIT_LOG_TYPE } from '../../types/document-audit-logs';
import { createDocumentAuditLogData } from '../../utils/document-audit-logs';

const EVENT_TYPE_MAP: Record<string, { event: z.infer<typeof ZEmailDeliveryEventTypeSchema>; detail?: string }> = {
  'email.delivered': { event: 'DELIVERED' },
  'email.delivery_delayed': { event: 'DELAYED' },
  'email.bounced': { event: 'BOUNCED' },
  'email.failed': { event: 'BOUNCED', detail: 'Sending failed' },
  'email.suppressed': { event: 'BOUNCED', detail: 'Address is on the suppression list' },
  'email.complained': { event: 'COMPLAINED' },
  'email.opened': { event: 'OPENED' },
  'email.clicked': { event: 'CLICKED' },
};

export const ZResendEmailEventSchema = z.object({
  type: z.string(),
  created_at: z.string().optional(),
  data: z
    .object({
      email_id: z.string(),
      to: z.array(z.string()).optional(),
      subject: z.string().optional(),
      bounce: z.object({ message: z.string().optional(), type: z.string().optional() }).passthrough().optional(),
      click: z
        .object({ link: z.string().optional(), ipAddress: z.string().optional(), userAgent: z.string().optional() })
        .passthrough()
        .optional(),
    })
    .passthrough(),
});

export type RecordResendEmailEventOptions = {
  providerEventId: string;
  payload: z.infer<typeof ZResendEmailEventSchema>;
};

/**
 * Adds a delivery event to the audit trail of the document whose email it was.
 * Emails that are not about a document (account emails) are ignored.
 */
export const recordResendEmailEvent = async ({ providerEventId, payload }: RecordResendEmailEventOptions) => {
  const mapped = EVENT_TYPE_MAP[payload.type];

  if (!mapped) {
    return { recorded: false, reason: 'ignored-event-type' } as const;
  }

  const sentLog = await prisma.documentAuditLog.findFirst({
    where: {
      type: {
        in: [DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT, DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_ACCESS_AUTH_2FA_REQUESTED],
      },
      data: {
        path: ['providerMessageId'],
        equals: payload.data.email_id,
      },
    },
    select: { envelopeId: true, data: true },
  });

  if (!sentLog?.envelopeId) {
    return { recorded: false, reason: 'unknown-email' } as const;
  }

  const alreadyRecorded = await prisma.documentAuditLog.findFirst({
    where: {
      envelopeId: sentLog.envelopeId,
      type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_DELIVERY_EVENT,
      data: {
        path: ['providerEventId'],
        equals: providerEventId,
      },
    },
    select: { id: true },
  });

  if (alreadyRecorded) {
    return { recorded: false, reason: 'duplicate' } as const;
  }

  const sentData = z
    .object({ recipientEmail: z.string(), recipientId: z.number().optional(), recipientName: z.string().optional() })
    .passthrough()
    .safeParse(sentLog.data);

  const recipientEmail = sentData.success ? sentData.data.recipientEmail : (payload.data.to?.[0] ?? 'unknown');

  const detail = mapped.detail ?? payload.data.bounce?.message ?? payload.data.click?.link;

  await prisma.documentAuditLog.create({
    data: createDocumentAuditLogData({
      type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_DELIVERY_EVENT,
      envelopeId: sentLog.envelopeId,
      user: {
        email: recipientEmail,
        name: sentData.success ? sentData.data.recipientName : undefined,
      },
      // A click comes from the recipient's own device, so its IP and browser are evidence too.
      requestMetadata: payload.data.click
        ? { ipAddress: payload.data.click.ipAddress, userAgent: payload.data.click.userAgent }
        : undefined,
      data: {
        event: mapped.event,
        recipientEmail,
        recipientId: sentData.success ? sentData.data.recipientId : undefined,
        emailId: payload.data.email_id,
        subject: payload.data.subject,
        detail,
        providerEventId,
      },
    }),
  });

  return { recorded: true } as const;
};
