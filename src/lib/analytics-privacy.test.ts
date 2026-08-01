import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ANALYTICS_RETENTION_DAYS,
  analyticsRetentionCutoff,
  hasAnalyticsOptOut,
  resolveAnalyticsRetentionDays,
  sanitizeAnalyticsReferrer,
} from "./analytics-privacy";

test("honors DNT and Global Privacy Control server-side", () => {
  assert.equal(hasAnalyticsOptOut(new Headers({ DNT: "1" })), true);
  assert.equal(hasAnalyticsOptOut(new Headers({ "Sec-GPC": "1" })), true);
  assert.equal(
    hasAnalyticsOptOut(new Headers({ DNT: "0", "Sec-GPC": "0" })),
    false,
  );
  assert.equal(hasAnalyticsOptOut(new Headers()), false);
});

test("stores only normalized HTTP(S) referrer origins", () => {
  assert.equal(
    sanitizeAnalyticsReferrer(
      "https://Example.COM:443/private/member?id=42#profile",
    ),
    "https://example.com",
  );
  assert.equal(
    sanitizeAnalyticsReferrer("http://example.com:8080/a/b?token=secret"),
    "http://example.com:8080",
  );
});

test("rejects unsafe or ambiguous referrers", () => {
  assert.equal(sanitizeAnalyticsReferrer("javascript:alert(1)"), null);
  assert.equal(sanitizeAnalyticsReferrer("data:text/plain,secret"), null);
  assert.equal(sanitizeAnalyticsReferrer("https://user:secret@example.com/a"), null);
  assert.equal(sanitizeAnalyticsReferrer("not a URL"), null);
  assert.equal(sanitizeAnalyticsReferrer(""), null);
});

test("uses a bounded, configurable retention period", () => {
  assert.equal(resolveAnalyticsRetentionDays("30"), 30);
  assert.equal(
    resolveAnalyticsRetentionDays(undefined),
    DEFAULT_ANALYTICS_RETENTION_DAYS,
  );
  assert.equal(
    resolveAnalyticsRetentionDays("0"),
    DEFAULT_ANALYTICS_RETENTION_DAYS,
  );
  assert.equal(
    resolveAnalyticsRetentionDays("999999"),
    DEFAULT_ANALYTICS_RETENTION_DAYS,
  );
  assert.equal(
    resolveAnalyticsRetentionDays("180.5"),
    DEFAULT_ANALYTICS_RETENTION_DAYS,
  );
});

test("calculates the retention cutoff as an exact UTC duration", () => {
  const now = new Date("2026-08-01T12:00:00.000Z");
  assert.equal(
    analyticsRetentionCutoff(now, 180).toISOString(),
    "2026-02-02T12:00:00.000Z",
  );
});
