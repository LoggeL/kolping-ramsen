import type { LegacyHttp, LegacyHttpResponse } from "./types";

const USER_AGENT = "KolpingRamsenContentMigration/2.0 (+https://kolping-ramsen.logge.top)";

async function readLimited(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error(`Response überschreitet das Limit von ${maxBytes} Bytes.`);
  }
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxBytes) {
      await reader.cancel();
      throw new Error(`Response überschreitet das Limit von ${maxBytes} Bytes.`);
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export const fetchLegacyHttp: LegacyHttp = {
  async get({ url, signal, maxBytes }): Promise<LegacyHttpResponse> {
    const timeout = AbortSignal.timeout(20_000);
    const combinedSignal = AbortSignal.any([signal, timeout]);
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,image/avif,image/webp,image/*;q=0.8,*/*;q=0.5",
        "User-Agent": USER_AGENT,
      },
      redirect: "follow",
      signal: combinedSignal,
    });
    return {
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
      retryAfter: response.headers.get("retry-after") ?? undefined,
      body: await readLimited(response, maxBytes),
    };
  },
};
