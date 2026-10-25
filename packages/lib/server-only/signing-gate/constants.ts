export const SIGNING_GATE_CODE_EXPIRATION_MINUTES = 10;

// Marks the gate's audit entries so they never mix with the built-in email 2FA entries of the same types.
export const SIGNING_GATE_AUDIT_SOURCE = 'signing-gate';

// Wrong guesses allowed against one emailed code before a new code must be requested.
export const SIGNING_GATE_MAX_FAILURES_PER_CODE = 5;

// Wrong guesses allowed per recipient in a rolling day before the gate locks for that day.
export const SIGNING_GATE_MAX_FAILURES_PER_DAY = 20;

export const SIGNING_GATE_SESSION_HOURS = 12;

export const SIGNING_GATE_COOKIE_PREFIX = 'signing_gate_';

// Bump when the consent wording in the signing gate changes, so each record says which text was agreed to.
export const SIGNING_GATE_DISCLOSURE_VERSION = '2026-10-25';
