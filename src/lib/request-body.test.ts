import assert from "node:assert/strict";
import test from "node:test";
import {
  readFormDataBody,
  readJsonBody,
  readRequestBody,
  RequestBodyTooLargeError,
} from "./request-body";

test("reads bounded JSON and rejects an advertised oversized body", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
    body: JSON.stringify({ path: "/kontakt" }),
  });
  assert.deepEqual(await readJsonBody(request, 100), { path: "/kontakt" });

  const oversized = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-length": "101" },
    body: "small",
  });
  await assert.rejects(
    () => readRequestBody(oversized, 100),
    RequestBodyTooLargeError,
  );
});

test("stops a chunked body as soon as it crosses the limit", async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("12345"));
      controller.enqueue(encoder.encode("67890"));
      controller.close();
    },
  });
  const request = new Request("https://example.test/api", {
    method: "POST",
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  await assert.rejects(
    () => readRequestBody(request, 8),
    RequestBodyTooLargeError,
  );
});

test("parses multipart form data inside the configured limit", async () => {
  const source = new FormData();
  source.append("files", new File(["image"], "example.png", { type: "image/png" }));
  const request = new Request("https://example.test/upload", {
    method: "POST",
    body: source,
  });
  const parsed = await readFormDataBody(request, 10_000);
  const file = parsed.get("files");
  assert.ok(file instanceof File);
  assert.equal(file.name, "example.png");
});
