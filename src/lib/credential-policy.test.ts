import assert from "node:assert/strict";
import test from "node:test";
import { requiresPasswordReset } from "./credential-policy";

test("locks only the compromised bootstrap account before the reset cutoff", () => {
  assert.equal(
    requiresPasswordReset({
      email: "ADMIN@kolping-ramsen.de",
      updatedAt: new Date("2026-08-01T15:09:59.999Z"),
    }),
    true,
  );
  assert.equal(
    requiresPasswordReset({
      email: "admin@kolping-ramsen.de",
      updatedAt: new Date("2026-08-01T15:10:00.000Z"),
    }),
    false,
  );
  assert.equal(
    requiresPasswordReset({
      email: "redaktion@example.org",
      updatedAt: new Date("2020-01-01T00:00:00.000Z"),
    }),
    false,
  );
});
