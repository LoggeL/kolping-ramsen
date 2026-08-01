import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_TRUSTED_PROXY_HOPS,
  getClientIp,
  parseTrustedProxyHops,
  rateLimitKey,
  UNKNOWN_CLIENT_IP,
} from "./client-ip";

test("uses one trusted proxy hop by default", () => {
  assert.equal(parseTrustedProxyHops(undefined), DEFAULT_TRUSTED_PROXY_HOPS);
  assert.equal(parseTrustedProxyHops("invalid"), DEFAULT_TRUSTED_PROXY_HOPS);
  assert.equal(parseTrustedProxyHops("2"), 2);
  assert.equal(parseTrustedProxyHops("0"), 0);
});

test("reads forwarded addresses from the trusted side of the chain", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.99, 198.51.100.24",
  });

  // With one proxy, the right-most value is the socket address it appended;
  // the caller-controlled first value cannot bypass the limiter.
  assert.equal(getClientIp(headers, 1), "198.51.100.24");
  assert.equal(getClientIp(headers, 2), "203.0.113.99");
  assert.equal(rateLimitKey("contact", headers, 1), "contact:198.51.100.24");
});

test("fails closed for untrusted, missing or malformed addresses", () => {
  assert.equal(
    getClientIp(new Headers({ "x-forwarded-for": "198.51.100.24" }), 0),
    UNKNOWN_CLIENT_IP,
  );
  assert.equal(getClientIp(new Headers(), 1), UNKNOWN_CLIENT_IP);
  assert.equal(
    getClientIp(new Headers({ "x-forwarded-for": "spoofed" }), 1),
    UNKNOWN_CLIENT_IP,
  );
  assert.equal(
    getClientIp(new Headers({ "x-forwarded-for": "2001:db8::42" }), 1),
    "2001:db8::42",
  );
});
