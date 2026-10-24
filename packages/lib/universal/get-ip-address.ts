export const getIpAddress = (req: Request) => {
  // The client can send its own x-forwarded-for; when the host's edge proxy sets a header
  // the client cannot forge (Railway: x-real-ip), trust only that one for audit records.
  const trustedHeader = typeof process !== 'undefined' ? process.env.NEXT_PRIVATE_TRUSTED_IP_HEADER : undefined;

  if (trustedHeader) {
    const trustedIp = req.headers.get(trustedHeader);

    if (trustedIp) {
      return trustedIp.split(',')[0].trim();
    }
  }

  // Check for forwarded headers first (common in proxy setups)
  const forwarded = req.headers.get('x-forwarded-for');

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  // Check for real IP header (used by some proxies)
  const realIp = req.headers.get('x-real-ip');

  if (realIp) {
    return realIp;
  }

  // Check for client IP header
  const clientIp = req.headers.get('x-client-ip');

  if (clientIp) {
    return clientIp;
  }

  // Check for CF-Connecting-IP (Cloudflare)
  const cfConnectingIp = req.headers.get('cf-connecting-ip');

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Check for True-Client-IP (Akamai and Cloudflare)
  const trueClientIp = req.headers.get('true-client-ip');

  if (trueClientIp) {
    return trueClientIp;
  }

  throw new Error('No IP address found');
};
