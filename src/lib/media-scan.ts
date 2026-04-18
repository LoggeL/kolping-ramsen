import "server-only";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ROOTS = ["uploads", "images"];
const EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"]);

export type MediaFile = {
  url: string;
  relPath: string;
  bucket: string;
  filename: string;
  size: number;
  mtime: Date;
};

export async function scanMedia(): Promise<MediaFile[]> {
  const out: MediaFile[] = [];
  for (const root of ROOTS) {
    await walk(path.join(PUBLIC_DIR, root), out);
  }
  out.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  return out;
}

async function walk(dir: string, out: MediaFile[]) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(abs, out);
    } else if (
      e.isFile() &&
      EXT.has(path.extname(e.name).toLowerCase()) &&
      !e.name.startsWith(".")
    ) {
      const s = await stat(abs);
      const rel = path.relative(PUBLIC_DIR, abs).replace(/\\/g, "/");
      const segments = rel.split("/");
      out.push({
        url: "/" + rel,
        relPath: rel,
        bucket: segments.slice(0, -1).join("/"),
        filename: segments[segments.length - 1],
        size: s.size,
        mtime: s.mtime,
      });
    }
  }
}

export function listBuckets(files: MediaFile[]): { bucket: string; count: number }[] {
  const map = new Map<string, number>();
  for (const f of files) {
    map.set(f.bucket, (map.get(f.bucket) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([bucket, count]) => ({ bucket, count }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));
}
