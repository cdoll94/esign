import { createMiddleware } from 'hono/factory';

import type { HonoEnv } from './router';

/**
 * Upstream features this instance does not offer. Embedded signing, multi-sign embeds and
 * public direct-template links let someone open or sign a document without the signing
 * gate's e-records consent and emailed code, so they are switched off at the edge.
 */
const DISABLED_PAGE_PREFIXES = ['/embed', '/d/', '/share/'];

const DISABLED_TRPC_PROCEDURES = ['embeddingPresign.', 'template.createDocumentFromDirectTemplate', 'document.share'];

const DISABLED_API_PREFIXES = ['/api/v1/embedding', '/api/v2/embedding', '/api/v2-beta/embedding'];

const isDisabledTrpcCall = (path: string) => {
  const procedures = decodeURIComponent(path.slice('/api/trpc/'.length)).split(',');

  return procedures.some((procedure) =>
    DISABLED_TRPC_PROCEDURES.some((disabled) =>
      disabled.endsWith('.') ? procedure.startsWith(disabled) : procedure === disabled,
    ),
  );
};

export const createDisabledSurfacesMiddleware = (basePath: string) =>
  createMiddleware<HonoEnv>(async (c, next) => {
    const path = basePath && c.req.path.startsWith(basePath) ? c.req.path.slice(basePath.length) : c.req.path;

    // Certificate QR links (/share/qr_...) stay available; only social sharing is off.
    const isQrShareLink = path.startsWith('/share/qr_') && !path.endsWith('/opengraph');

    const isDisabledPage =
      !isQrShareLink &&
      DISABLED_PAGE_PREFIXES.some((prefix) => path === prefix.replace(/\/$/, '') || path.startsWith(prefix));

    const isDisabledApi =
      (path.startsWith('/api/trpc/') && isDisabledTrpcCall(path)) ||
      DISABLED_API_PREFIXES.some((prefix) => path.startsWith(prefix));

    if (isDisabledPage || isDisabledApi) {
      return c.json({ message: 'Not Found', statusCode: 404 }, 404);
    }

    return await next();
  });
