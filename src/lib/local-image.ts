import "server-only";
import fs from "node:fs";
import path from "node:path";
import { normalizeMediaPath } from "./media-paths";
import { resolveReadableUploadSync } from "./media-storage";

export function localImageExists(src: string | null | undefined): boolean {
  if (!src) return false;
  if (!src.startsWith("/")) return true; // remote or data URL — trust caller
  try {
    const normalized = normalizeMediaPath(src);
    if (normalized.startsWith("uploads/")) {
      return resolveReadableUploadSync(normalized) !== null;
    }
    const publicRoot = path.resolve(process.cwd(), "public");
    const filePath = path.resolve(publicRoot, normalized);
    if (filePath !== publicRoot && !filePath.startsWith(publicRoot + path.sep)) {
      return false;
    }
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

export function firstLocalImage(src: string | null | undefined): string | null {
  return src && localImageExists(src) ? src : null;
}
