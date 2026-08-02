import { createHash } from "node:crypto";

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => left.localeCompare(right, "en"))
        .map(([key, child]) => [key, sortValue(child)]),
    );
  }
  return value;
}
export function stableJson(value: unknown): string {
  return `${JSON.stringify(sortValue(value), null, 2)}\n`;
}

export function sha256(value: string | Uint8Array): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "de"));
}
