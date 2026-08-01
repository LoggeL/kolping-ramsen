import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { serializeJsonLd } from "./json-ld";

describe("serializeJsonLd", () => {
  it("prevents a closing script tag from reaching the HTML parser", () => {
    const attack = '</script><script>globalThis.__jsonLdXss = true</script>';
    const serialized = serializeJsonLd({ headline: attack });

    assert.equal(serialized.includes("</script"), false);
    assert.equal(serialized.includes("<script"), false);
    assert.deepEqual(JSON.parse(serialized), { headline: attack });
  });

  it("escapes HTML-significant characters and JavaScript line separators", () => {
    const value = { text: "<tag>&value>\u2028next\u2029line" };
    const serialized = serializeJsonLd(value);

    assert.equal(serialized.includes("<"), false);
    assert.equal(serialized.includes(">"), false);
    assert.equal(serialized.includes("&"), false);
    assert.equal(serialized.includes("\u2028"), false);
    assert.equal(serialized.includes("\u2029"), false);
    assert.deepEqual(JSON.parse(serialized), value);
  });

  it("rejects top-level values JSON cannot serialize", () => {
    assert.throws(
      () => serializeJsonLd(undefined),
      new TypeError("JSON-LD value is not serializable"),
    );
  });
});
