import assert from "node:assert/strict";
import test from "node:test";
import { MemoryRateLimiter } from "./rate-limit-core";

test("enforces a fixed-window limit and resets after expiry", () => {
  let now = 1_000;
  const limiter = new MemoryRateLimiter({ now: () => now });

  assert.deepEqual(limiter.check("contact:client", 2, 5_000), { ok: true, retryIn: 0 });
  assert.deepEqual(limiter.check("contact:client", 2, 5_000), { ok: true, retryIn: 0 });
  assert.deepEqual(limiter.check("contact:client", 2, 5_000), { ok: false, retryIn: 5 });

  now = 6_000;
  assert.deepEqual(limiter.check("contact:client", 2, 5_000), { ok: true, retryIn: 0 });
});

test("bounds attacker-controlled identities and fails closed at capacity", () => {
  let now = 10_000;
  const limiter = new MemoryRateLimiter({ maxBuckets: 2, now: () => now });

  assert.equal(limiter.check("scope:first", 1, 60_000).ok, true);
  assert.equal(limiter.check("scope:second", 1, 30_000).ok, true);
  assert.deepEqual(limiter.check("scope:third", 1, 60_000), {
    ok: false,
    retryIn: 30,
  });
  assert.equal(limiter.size, 2);

  now = 40_000;
  assert.equal(limiter.check("scope:third", 1, 60_000).ok, true);
  assert.equal(limiter.size, 2);
});

test("rejects invalid limiter parameters", () => {
  assert.throws(() => new MemoryRateLimiter({ maxBuckets: 0 }), /maxBuckets/);
  const limiter = new MemoryRateLimiter();
  assert.throws(() => limiter.check("", 1, 1_000), /key/);
  assert.throws(() => limiter.check("key", 0, 1_000), /limit/);
  assert.throws(() => limiter.check("key", 1, 0), /windowMs/);
});
