import { isDisabledTrpcProcedure } from '@documenso/lib/constants/disabled-surfaces';
import { createMiddleware } from 'hono/factory';

import type { HonoEnv } from './router';

// Page and API prefixes for the features listed in constants/disabled-surfaces. The procedures
// themselves also refuse in the tRPC middleware; this edge check covers pages and REST routes.
const DISABLED_PAGE_PREFIXES = ['/embed', '/d/', '/share/'];

const DISABLED_API_PREFIXES = ['/api/v1/embedding', '/api/v2/embedding', '/api/v2-beta/embedding'];

/**
 * React Router and the OpenAPI handler match paths case-insensitively and after decoding, so
 * compare against a decoded, lower-cased path with repeated and trailing slashes collapsed.
 */
const normalizePath = (rawPath: string) => {
  let decoded = rawPath;

  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    // Keep the raw path if it is not valid percent-encoding.
  }

  const collapsed = decoded.toLowerCase().replace(/\/{2,}/g, '/');

  return collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed;
};

const isDisabledTrpcCall = (path: string) => {
  const procedures = path.slice('/api/trpc/'.length).split(',');

  return procedures.some((procedure) => isDisabledTrpcProcedure(procedure));
};

export const createDisabledSurfacesMiddleware = (basePath: string) =>
  createMiddleware<HonoEnv>(async (c, next) => {
    const normalizedBasePath = normalizePath(basePath || '/');
    let path = normalizePath(c.req.path);

    if (normalizedBasePath !== '/' && path.startsWith(normalizedBasePath)) {
      path = path.slice(normalizedBasePath.length) || '/';
    }

    // Certificate QR links (/share/qr_...) stay available; only social sharing is off.
    const isQrShareLink = path.startsWith('/share/qr_') && !path.includes('/opengraph');

    const isDisabledPage =
      !isQrShareLink &&
      DISABLED_PAGE_PREFIXES.some((prefix) => {
        const bare = prefix.replace(/\/$/, '');

        return path === bare || path.startsWith(`${bare}/`) || path.startsWith(`${bare}.`) || path.startsWith(prefix);
      });

    const isDisabledApi =
      (path.startsWith('/api/trpc/') && isDisabledTrpcCall(path)) ||
      DISABLED_API_PREFIXES.some((prefix) => path.startsWith(prefix));

    if (isDisabledPage || isDisabledApi) {
      return c.json({ message: 'Not Found', statusCode: 404 }, 404);
    }

    return await next();
  });
