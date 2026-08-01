// The original production account was created from a publicly committed
// bootstrap database. It remains locked until its credential timestamp proves
// that an explicit password reset occurred after the incident cutoff.
const COMPROMISED_ACCOUNT_EMAIL = "admin@kolping-ramsen.de";
const COMPROMISED_ACCOUNT_CUTOFF_MS = Date.parse("2026-08-01T15:10:00.000Z");

export function requiresPasswordReset(user: {
  email: string;
  updatedAt: Date;
}): boolean {
  return (
    user.email.toLowerCase() === COMPROMISED_ACCOUNT_EMAIL &&
    user.updatedAt.getTime() < COMPROMISED_ACCOUNT_CUTOFF_MS
  );
}
