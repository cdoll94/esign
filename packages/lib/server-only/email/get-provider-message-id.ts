/**
 * The email provider's ID for a sent message (Resend returns `{ id }`, SMTP returns `messageId`).
 * Stored on the EMAIL_SENT audit entry so delivery webhooks can be matched back to a recipient.
 */
export const getProviderMessageId = (sendResult: unknown): string | undefined => {
  if (!sendResult || typeof sendResult !== 'object') {
    return undefined;
  }

  if ('id' in sendResult && typeof sendResult.id === 'string') {
    return sendResult.id;
  }

  if ('messageId' in sendResult && typeof sendResult.messageId === 'string') {
    return sendResult.messageId;
  }

  return undefined;
};
