import assert from "node:assert/strict";
import test from "node:test";
import { hasExactOrigin } from "./request-origin";

const expected = "https://kolping-ramsen.logge.top";

test("accepts only the exact mutation origin", () => {
  assert.equal(
    hasExactOrigin(
      new Request(`${expected}/api`, { headers: { origin: expected } }),
      expected,
    ),
    true,
  );
  assert.equal(
    hasExactOrigin(
      new Request(`${expected}/api`, {
        headers: { origin: "https://other.logge.top" },
      }),
      expected,
    ),
    false,
  );
});

test("rejects missing, opaque and malformed origin values", () => {
  assert.equal(hasExactOrigin(new Request(`${expected}/api`), expected), false);
  for (const origin of ["null", `${expected}/path`, "not a URL"]) {
    assert.equal(
      hasExactOrigin(
        new Request(`${expected}/api`, { headers: { origin } }),
        expected,
      ),
      false,
    );
  }
});
