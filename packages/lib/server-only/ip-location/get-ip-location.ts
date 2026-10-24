import { readFileSync } from 'node:fs';

import type { CityResponse } from 'maxmind';
import { Reader } from 'maxmind';

import { env } from '../../utils/env';

// Attribution required by the DB-IP Lite licence (CC BY 4.0).
export const IP_LOCATION_ATTRIBUTION = 'IP geolocation by DB-IP (db-ip.com)';

let reader: Reader<CityResponse> | null | undefined;

const getReader = () => {
  if (reader !== undefined) {
    return reader;
  }

  const path = env('NEXT_PRIVATE_IP_LOCATION_DB_PATH');

  try {
    reader = path ? new Reader<CityResponse>(readFileSync(path)) : null;
  } catch (error) {
    console.error('Unable to load the IP location database', error);
    reader = null;
  }

  return reader;
};

/**
 * Approximate city, region and country for an IP address, or null when unknown.
 * Synchronous so it can be used while rendering certificate pages.
 */
export const getIpLocation = (ipAddress?: string | null) => {
  if (!ipAddress) {
    return null;
  }

  try {
    const result = getReader()?.get(ipAddress);

    if (!result) {
      return null;
    }

    const parts = [
      result.city?.names?.en,
      result.subdivisions?.[0]?.names?.en,
      result.country?.iso_code ?? result.country?.names?.en,
    ].filter((part, index, all): part is string => !!part && all.indexOf(part) === index);

    return parts.length > 0 ? parts.join(', ') : null;
  } catch {
    return null;
  }
};

export const formatIpWithLocation = (ipAddress?: string | null) => {
  if (!ipAddress) {
    return null;
  }

  const location = getIpLocation(ipAddress);

  return location ? `${ipAddress} (approx. ${location})` : ipAddress;
};
