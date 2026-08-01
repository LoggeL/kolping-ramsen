export type RateLimitResult = {
  ok: boolean;
  retryIn: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimiterOptions = {
  maxBuckets?: number;
  now?: () => number;
  sweepIntervalMs?: number;
};

/**
 * A bounded, process-local fixed-window limiter. When capacity is exhausted,
 * unknown identities fail closed until an existing bucket expires; this keeps
 * attacker-controlled keys from growing memory without limit.
 */
export class MemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly maxBuckets: number;
  private readonly now: () => number;
  private readonly sweepIntervalMs: number;
  private nextSweepAt = 0;

  constructor(options: RateLimiterOptions = {}) {
    this.maxBuckets = options.maxBuckets ?? 10_000;
    this.now = options.now ?? Date.now;
    this.sweepIntervalMs = options.sweepIntervalMs ?? 60_000;

    if (!Number.isInteger(this.maxBuckets) || this.maxBuckets < 1) {
      throw new TypeError("maxBuckets must be a positive integer");
    }
    if (!Number.isFinite(this.sweepIntervalMs) || this.sweepIntervalMs < 1) {
      throw new TypeError("sweepIntervalMs must be positive");
    }
  }

  get size(): number {
    return this.buckets.size;
  }

  check(key: string, limit: number, windowMs: number): RateLimitResult {
    if (!key || key.length > 256) throw new TypeError("rate-limit key is invalid");
    if (!Number.isInteger(limit) || limit < 1) {
      throw new TypeError("limit must be a positive integer");
    }
    if (!Number.isFinite(windowMs) || windowMs < 1) {
      throw new TypeError("windowMs must be positive");
    }

    const now = this.now();
    if (now >= this.nextSweepAt) {
      this.deleteExpired(now);
      this.nextSweepAt = now + this.sweepIntervalMs;
    }

    const existing = this.buckets.get(key);
    if (existing && existing.resetAt > now) {
      if (existing.count >= limit) {
        return {
          ok: false,
          retryIn: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
        };
      }
      existing.count += 1;
      return { ok: true, retryIn: 0 };
    }

    if (existing) this.buckets.delete(key);
    if (this.buckets.size >= this.maxBuckets) this.deleteExpired(now);
    if (this.buckets.size >= this.maxBuckets) {
      return { ok: false, retryIn: this.retryUntilCapacity(now) };
    }

    this.buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryIn: 0 };
  }

  private deleteExpired(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }

  private retryUntilCapacity(now: number): number {
    let earliestReset = Number.POSITIVE_INFINITY;
    for (const bucket of this.buckets.values()) {
      earliestReset = Math.min(earliestReset, bucket.resetAt);
    }
    return Number.isFinite(earliestReset)
      ? Math.max(1, Math.ceil((earliestReset - now) / 1000))
      : 1;
  }
}
