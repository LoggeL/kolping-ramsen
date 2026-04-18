import "server-only";
import fs from "node:fs";
import path from "node:path";

export function localImageExists(src: string | null | undefined): boolean {
  if (!src) return false;
  if (!src.startsWith("/")) return true; // remote or data URL — trust caller
  try {
    const filePath = path.join(process.cwd(), "public", decodeURIComponent(src));
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

export function firstLocalImage(src: string | null | undefined): string | null {
  return src && localImageExists(src) ? src : null;
}
