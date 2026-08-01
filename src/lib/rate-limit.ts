import "server-only";
import { MemoryRateLimiter, type RateLimitResult } from "./rate-limit-core";

function configuredMaxBuckets(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 100 && parsed <= 100_000
    ? parsed
    : 10_000;
}

const limiter = new MemoryRateLimiter({
  maxBuckets: configuredMaxBuckets(process.env.RATE_LIMIT_MAX_BUCKETS),
});

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  return limiter.check(key, limit, windowMs);
}
