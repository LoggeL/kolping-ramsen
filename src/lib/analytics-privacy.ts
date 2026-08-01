const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_REFERRER_LENGTH = 2_048;
const MAX_STORED_ORIGIN_LENGTH = 250;

export const DEFAULT_ANALYTICS_RETENTION_DAYS = 180;
const MAX_ANALYTICS_RETENTION_DAYS = 10 * 365;

type HeaderReader = Pick<Headers, "get">;

/**
 * Privacy preference signals are checked on the server as the final authority.
 * Client-side checks only avoid an unnecessary request and are not sufficient.
 */
export function hasAnalyticsOptOut(headers: HeaderReader): boolean {
  return (
    headers.get("dnt")?.trim() === "1" ||
    headers.get("sec-gpc")?.trim() === "1"
  );
}

/**
 * Retain only a referrer's HTTP(S) origin. Paths, queries, fragments and
 * credentials can contain personal data and must never enter the analytics DB.
 */
export function sanitizeAnalyticsReferrer(referrer: string): string | null {
  const candidate = referrer.trim();
  if (!candidate || candidate.length > MAX_REFERRER_LENGTH) return null;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname || url.username || url.password) return null;

    const origin = url.origin;
    return origin.length <= MAX_STORED_ORIGIN_LENGTH ? origin : null;
  } catch {
    return null;
  }
}

export function resolveAnalyticsRetentionDays(
  configuredDays: string | undefined,
): number {
  const value = configuredDays?.trim();
  if (!value || !/^\d+$/.test(value)) {
    return DEFAULT_ANALYTICS_RETENTION_DAYS;
  }

  const days = Number(value);
  return Number.isSafeInteger(days) &&
    days >= 1 &&
    days <= MAX_ANALYTICS_RETENTION_DAYS
    ? days
    : DEFAULT_ANALYTICS_RETENTION_DAYS;
}

export function analyticsRetentionCutoff(now: Date, retentionDays: number): Date {
  return new Date(now.getTime() - retentionDays * DAY_MS);
}
