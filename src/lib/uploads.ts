import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function saveUpload(file: File, subdir: string): Promise<{ filename: string; size: number }> {
  if (!ALLOWED.has(file.type)) {
    throw new Error(`Dateityp ${file.type} nicht erlaubt`);
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Datei größer als 10 MB");
  }
  const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? ".bin").toLowerCase();
  const safeName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const dir = path.join(UPLOAD_ROOT, subdir.replace(/[^a-z0-9-_]/gi, ""));
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, safeName), buf);
  return { filename: `${subdir}/${safeName}`, size: file.size };
}
