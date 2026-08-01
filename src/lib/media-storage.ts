import "server-only";

import { existsSync } from "node:fs";
import { access, link, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { normalizeMediaPath } from "./media-paths";
import { withDirectoryLock } from "./directory-lock";

export { normalizeMediaPath } from "./media-paths";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_OUTPUT_EDGE = 2560;
const SUPPORTED_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);

export type PreparedMedia = {
  bytes: Buffer;
  filename: string;
  originalName: string;
  relPath: string;
  url: string;
  mimeType: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
  sha256: string;
};

function uploadRoot(): string {
  if (process.env.MEDIA_UPLOAD_DIR) {
    return path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_UPLOAD_DIR);
  }
  if (process.env.NODE_ENV === "production") return "/data/uploads";
  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "public",
    "uploads",
  );
}

export function configuredUploadRoot(): string {
  return uploadRoot();
}

export function uploadLibraryRoot(): string {
  return path.join(/* turbopackIgnore: true */ uploadRoot(), "library");
}

export async function withMediaOperationLock<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const root = uploadRoot();
  await mkdir(/* turbopackIgnore: true */ root, { recursive: true });
  return withDirectoryLock(
    path.join(/* turbopackIgnore: true */ root, ".media-operation.lock"),
    operation,
    { busyMessage: "Die Mediathek wird gerade aktualisiert. Bitte erneut versuchen." },
  );
}

export function mediaUrl(relPath: string): string {
  return `/${normalizeMediaPath(relPath)}`;
}

export function isManagedUpload(relPath: string): boolean {
  return normalizeMediaPath(relPath).startsWith("uploads/");
}

export function resolveUploadPath(relPath: string): string {
  const normalized = normalizeMediaPath(relPath);
  if (!normalized.startsWith("uploads/")) throw new Error("Kein verwalteter Upload");
  const relative = normalized.slice("uploads/".length);
  const root = uploadRoot();
  const resolved = path.resolve(/* turbopackIgnore: true */ root, relative);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("Medienpfad nicht erlaubt");
  }
  return resolved;
}

export async function resolveReadableUpload(relPath: string): Promise<string | null> {
  const normalized = normalizeMediaPath(relPath);
  if (!normalized.startsWith("uploads/")) return null;
  const primary = resolveUploadPath(normalized);
  try {
    await access(/* turbopackIgnore: true */ primary);
    return primary;
  } catch {}

  // Production prestart migrates legacy in-image uploads into the persistent
  // root. Falling back afterwards would make a deleted legacy file reappear.
  if (process.env.NODE_ENV === "production") return null;

  // Compatibility with uploads made before they moved onto the persistent
  // volume while running the local development server.
  const publicRoot = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    "public",
    "uploads",
  );
  const legacy = path.resolve(
    /* turbopackIgnore: true */ publicRoot,
    normalized.slice("uploads/".length),
  );
  if (legacy !== publicRoot && !legacy.startsWith(publicRoot + path.sep)) return null;
  try {
    await access(/* turbopackIgnore: true */ legacy);
    return legacy;
  } catch {
    return null;
  }
}

export function resolveReadableUploadSync(relPath: string): string | null {
  const normalized = normalizeMediaPath(relPath);
  if (!normalized.startsWith("uploads/")) return null;
  const primary = resolveUploadPath(normalized);
  if (existsSync(/* turbopackIgnore: true */ primary)) return primary;

  if (process.env.NODE_ENV === "production") return null;
  const publicRoot = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    "public",
    "uploads",
  );
  const legacy = path.resolve(
    /* turbopackIgnore: true */ publicRoot,
    normalized.slice("uploads/".length),
  );
  if (legacy !== publicRoot && !legacy.startsWith(publicRoot + path.sep)) return null;
  return existsSync(/* turbopackIgnore: true */ legacy) ? legacy : null;
}

function slugifyBase(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 56) || "bild"
  );
}

export async function prepareMediaFile(file: File): Promise<PreparedMedia> {
  if (file.size <= 0) throw new Error(`Leere Datei: ${file.name}`);
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Datei größer als 15 MB: ${file.name}`);
  }

  const input = Buffer.from(await file.arrayBuffer());
  const metadata = await (async () => {
    try {
      return await sharp(input, {
        failOn: "warning",
        limitInputPixels: MAX_INPUT_PIXELS,
        animated: false,
      }).metadata();
    } catch {
      throw new Error(`Bilddatei kann nicht sicher gelesen werden: ${file.name}`);
    }
  })();
  if (!metadata.format || !SUPPORTED_FORMATS.has(metadata.format)) {
    throw new Error(`Bildformat nicht unterstützt: ${file.name}`);
  }

  const result = await sharp(input, {
    failOn: "warning",
    limitInputPixels: MAX_INPUT_PIXELS,
    animated: false,
  })
    .rotate()
    .resize({
      width: MAX_OUTPUT_EDGE,
      height: MAX_OUTPUT_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 84, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  const sha256 = createHash("sha256").update(result.data).digest("hex");
  const filename = `${slugifyBase(path.parse(file.name).name)}-${sha256.slice(0, 12)}.webp`;
  const relPath = `uploads/library/${filename}`;
  return {
    bytes: result.data,
    filename,
    originalName: path.basename(file.name).slice(0, 240),
    relPath,
    url: `/${relPath}`,
    mimeType: "image/webp",
    width: result.info.width,
    height: result.info.height,
    sizeBytes: result.info.size,
    sha256,
  };
}

export async function persistPreparedMedia(
  media: PreparedMedia,
): Promise<{ created: boolean }> {
  const target = resolveUploadPath(media.relPath);
  await mkdir(/* turbopackIgnore: true */ path.dirname(target), { recursive: true });
  try {
    await access(/* turbopackIgnore: true */ target);
    return { created: false };
  } catch {}

  const temporary = `${target}.tmp-${randomBytes(6).toString("hex")}`;
  await writeFile(/* turbopackIgnore: true */ temporary, media.bytes, { flag: "wx" });
  try {
    // A hard link publishes the fully written inode without replacing a file
    // created concurrently by another request. Content-hash names guarantee
    // that an existing target represents the same normalized bytes.
    await link(/* turbopackIgnore: true */ temporary, target);
    await unlink(/* turbopackIgnore: true */ temporary);
  } catch (error) {
    await unlink(/* turbopackIgnore: true */ temporary).catch(() => undefined);
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      return { created: false };
    }
    throw error;
  }
  return { created: true };
}

export async function removeManagedUpload(relPath: string): Promise<void> {
  const target = resolveUploadPath(relPath);
  await unlink(/* turbopackIgnore: true */ target).catch((error) => {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  });
}

export async function stageManagedUploadDeletion(relPath: string): Promise<{
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
} | null> {
  const target = resolveUploadPath(relPath);
  try {
    await access(/* turbopackIgnore: true */ target);
  } catch {
    return null;
  }
  const staged = `${target}.delete-${randomBytes(6).toString("hex")}`;
  await rename(/* turbopackIgnore: true */ target, staged);
  return {
    commit: async () => {
      await unlink(/* turbopackIgnore: true */ staged).catch((error) => {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      });
    },
    rollback: async () => {
      await rename(/* turbopackIgnore: true */ staged, target);
    },
  };
}

export async function readManagedUpload(relPath: string): Promise<Buffer | null> {
  const readable = await resolveReadableUpload(relPath);
  if (!readable) return null;
  return readFile(/* turbopackIgnore: true */ readable);
}
