import {
  recordResendEmailEvent,
  ZResendEmailEventSchema,
} from '@documenso/lib/server-only/email-events/record-resend-email-event';
import { verifySvixSignature } from '@documenso/lib/server-only/email-events/verify-svix-signature';
import { env } from '@documenso/lib/utils/env';
import { Hono } from 'hono';

import type { HonoEnv } from '../../router';

export const emailEventsRoute = new Hono<HonoEnv>().post('/resend', async (c) => {
  const secret = env('NEXT_PRIVATE_RESEND_WEBHOOK_SECRET');

  if (!secret) {
    return c.json({ error: 'Not configured' }, 404);
  }

  const body = await c.req.text();
  const providerEventId = c.req.header('svix-id');

  const isValid = verifySvixSignature({
    secret,
    id: providerEventId,
    timestamp: c.req.header('svix-timestamp'),
    signature: c.req.header('svix-signature'),
    body,
  });

  if (!isValid || !providerEventId) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  let json: unknown;

  try {
    json = JSON.parse(body);
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const parsed = ZResendEmailEventSchema.safeParse(json);

  if (!parsed.success) {
    return c.json({ received: true, recorded: false });
  }

  try {
    const result = await recordResendEmailEvent({ providerEventId, payload: parsed.data });

    return c.json({ received: true, ...result });
  } catch (error) {
    c.get('logger').error({ event: 'email_events.resend_error', error: String(error) });

    return c.json({ error: 'Failed to record event' }, 500);
  }
});
