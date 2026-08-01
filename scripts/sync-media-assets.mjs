import "dotenv/config";

import { constants } from "node:fs";
import {
  copyFile,
  link,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  rmdir,
  unlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import Database from "better-sqlite3";
import sharp from "sharp";

function databasePath(databaseUrl) {
  if (!databaseUrl?.startsWith("file:")) {
    throw new Error("DATABASE_URL must point to a SQLite file");
  }
  const value = databaseUrl.slice("file:".length).split("?", 1)[0];
  if (!value || value === ":memory:") {
    throw new Error("DATABASE_URL must point to a persistent SQLite file");
  }
  return decodeURIComponent(value);
}

const database = new Database(databasePath(process.env.DATABASE_URL));

const MIME_TYPES = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const publicRoot = path.join(process.cwd(), "public");
const configuredUploadRoot = process.env.MEDIA_UPLOAD_DIR
  ? path.resolve(process.env.MEDIA_UPLOAD_DIR)
  : process.env.NODE_ENV === "production"
    ? "/data/uploads"
    : path.join(publicRoot, "uploads");
const legacyUploadRoot = path.join(publicRoot, "uploads");

function isErrorCode(error, code) {
  return error && typeof error === "object" && error.code === code;
}

async function latestLeaseTimestamp(lockPath) {
  try {
    const entries = await readdir(lockPath, { withFileTypes: true });
    let latest = (await stat(lockPath)).mtimeMs;
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith("owner-")) continue;
      latest = Math.max(
        latest,
        (await stat(path.join(lockPath, entry.name))).mtimeMs,
      );
    }
    return latest;
  } catch (error) {
    if (isErrorCode(error, "ENOENT")) return null;
    throw error;
  }
}

async function reclaimStaleLock(lockPath, staleAfterMs) {
  const reaperPath = `${lockPath}.reaper`;
  try {
    await mkdir(reaperPath);
  } catch (error) {
    if (isErrorCode(error, "EEXIST")) return false;
    throw error;
  }

  try {
    const latest = await latestLeaseTimestamp(lockPath);
    if (latest === null) return true;
    if (Date.now() - latest <= staleAfterMs) return false;

    const tombstone = `${lockPath}.stale-${randomUUID()}`;
    try {
      await rename(lockPath, tombstone);
    } catch (error) {
      if (isErrorCode(error, "ENOENT")) return true;
      throw error;
    }
    await rm(tombstone, { recursive: true, force: true });
    return true;
  } finally {
    await rmdir(reaperPath).catch((error) => {
      if (!isErrorCode(error, "ENOENT")) throw error;
    });
  }
}

async function releaseOwnedLock(lockPath, ownerPath) {
  try {
    await rmdir(ownerPath);
  } catch (error) {
    if (isErrorCode(error, "ENOENT")) return;
    throw error;
  }
  await rmdir(lockPath).catch((error) => {
    if (!isErrorCode(error, "ENOENT") && !isErrorCode(error, "ENOTEMPTY")) {
      throw error;
    }
  });
}

async function withMediaOperationLock(operation) {
  const lockPath = path.join(configuredUploadRoot, ".media-operation.lock");
  const ownerPath = path.join(lockPath, `owner-${randomUUID()}`);
  const staleAfterMs = 120_000;
  const deadline = Date.now() + 15_000;
  while (true) {
    try {
      await mkdir(lockPath);
      try {
        await mkdir(ownerPath);
      } catch (error) {
        await rmdir(lockPath).catch(() => undefined);
        throw error;
      }
      break;
    } catch (error) {
      if (!isErrorCode(error, "EEXIST")) throw error;
      if (await reclaimStaleLock(lockPath, staleAfterMs)) continue;
      if (Date.now() >= deadline) {
        throw new Error("Media catalog is currently locked by another process");
      }
      await delay(75);
    }
  }

  const heartbeatController = new AbortController();
  let heartbeatError;
  const heartbeat = (async () => {
    while (!heartbeatController.signal.aborted) {
      try {
        await delay(30_000, undefined, { signal: heartbeatController.signal });
      } catch (error) {
        if (heartbeatController.signal.aborted) return;
        heartbeatError = error;
        return;
      }
      try {
        const now = new Date();
        await utimes(ownerPath, now, now);
      } catch (error) {
        heartbeatError = error;
        return;
      }
    }
  })();

  try {
    const result = await operation();
    if (heartbeatError) {
      throw new Error("Media lock heartbeat failed", { cause: heartbeatError });
    }
    return result;
  } finally {
    heartbeatController.abort();
    await heartbeat;
    await releaseOwnedLock(lockPath, ownerPath);
  }
}

async function walk(absolute, prefix, output, { optional = false } = {}) {
  let entries;
  try {
    entries = await readdir(absolute, { withFileTypes: true });
  } catch (error) {
    if (optional && isErrorCode(error, "ENOENT")) return false;
    throw error;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const child = path.join(absolute, entry.name);
    const relPath = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      await walk(child, relPath, output);
    } else if (
      entry.isFile() &&
      MIME_TYPES[path.extname(entry.name).toLowerCase()]
    ) {
      output.set(relPath, child);
    }
  }
  return true;
}

async function migrateLegacyUploads() {
  if (path.resolve(legacyUploadRoot) === path.resolve(configuredUploadRoot)) {
    return 0;
  }

  const marker = path.join(configuredUploadRoot, ".legacy-import-v1.complete");
  try {
    await stat(marker);
    return 0;
  } catch (error) {
    if (!isErrorCode(error, "ENOENT")) throw error;
  }

  const legacyFiles = new Map();
  const exists = await walk(legacyUploadRoot, "uploads", legacyFiles, {
    optional: true,
  });
  if (!exists || legacyFiles.size === 0) return 0;

  await mkdir(configuredUploadRoot, { recursive: true });
  let copied = 0;
  for (const [relPath, source] of legacyFiles) {
    const relative = relPath.slice("uploads/".length);
    const target = path.resolve(configuredUploadRoot, relative);
    const root = path.resolve(configuredUploadRoot);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      throw new Error(`Unsafe legacy upload path: ${relPath}`);
    }
    await mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.legacy-${process.pid}-${randomUUID()}`;
    try {
      await copyFile(source, temporary, constants.COPYFILE_EXCL);
      try {
        await link(temporary, target);
        copied += 1;
      } catch (error) {
        if (!isErrorCode(error, "EEXIST")) throw error;
        const [sourceBytes, targetBytes] = await Promise.all([
          readFile(temporary),
          readFile(target),
        ]);
        const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");
        const targetHash = createHash("sha256").update(targetBytes).digest("hex");
        if (sourceHash !== targetHash) {
          throw new Error(`Conflicting persistent upload: ${relPath}`);
        }
      }
    } finally {
      await unlink(temporary).catch((error) => {
        if (!isErrorCode(error, "ENOENT")) throw error;
      });
    }
  }
  await writeFile(marker, `${new Date().toISOString()}\n`, { flag: "wx" }).catch(
    (error) => {
      if (!isErrorCode(error, "EEXIST")) throw error;
    },
  );
  return copied;
}

async function recoverStagedDeletions() {
  const assetExists = database.prepare(
    'SELECT 1 FROM "MediaAsset" WHERE "path" = ? LIMIT 1',
  );
  let restored = 0;
  let discarded = 0;

  async function visit(directory, prefix) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolute, `${prefix}/${entry.name}`);
        continue;
      }
      if (!entry.isFile()) continue;
      const match = entry.name.match(/^(.*)\.delete-[0-9a-f]{12}$/i);
      if (!match) continue;

      const originalName = match[1];
      const relPath = `${prefix}/${originalName}`;
      const target = path.join(directory, originalName);
      let targetExists = false;
      try {
        await stat(target);
        targetExists = true;
      } catch (error) {
        if (!isErrorCode(error, "ENOENT")) throw error;
      }

      if (assetExists.get(relPath) && !targetExists) {
        await rename(absolute, target);
        restored += 1;
      } else {
        await unlink(absolute);
        discarded += 1;
      }
    }
  }

  await visit(configuredUploadRoot, "uploads");
  return { restored, discarded };
}

async function inspect(relPath, absolute, fileStat) {
  const bytes = await readFile(absolute);
  const extension = path.extname(relPath).toLowerCase();
  let width = null;
  let height = null;
  try {
    const metadata = await sharp(bytes, { animated: false }).metadata();
    width = metadata.width ?? null;
    height = metadata.height ?? null;
  } catch (error) {
    if (extension !== ".svg") {
      throw new Error(`Unreadable media asset: ${relPath}`, { cause: error });
    }
  }
  return {
    path: relPath,
    originalName: path.basename(relPath),
    mimeType: MIME_TYPES[extension] ?? null,
    width,
    height,
    sizeBytes: fileStat.size,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

async function main() {
  await mkdir(configuredUploadRoot, { recursive: true });
  await withMediaOperationLock(async () => {
    const recovered = await recoverStagedDeletions();
    const copied = await migrateLegacyUploads();

    // Both roots are known to be readable before missing rows are marked. Any
    // permission or I/O error aborts the sync without changing the catalog.
    const files = new Map();
    await walk(path.join(publicRoot, "images"), "images", files);
    await walk(configuredUploadRoot, "uploads", files);

    const existing = new Map(
      database.prepare(
        'SELECT "path", "originalName", "sha256", "sizeBytes", "mimeType" FROM "MediaAsset"',
      ).all().map((asset) => [asset.path, asset]),
    );

    const pending = [];
    for (const [relPath, absolute] of files) {
      const current = existing.get(relPath);
      const fileStat = await stat(absolute);
      if (
        current?.sha256 &&
        current.sizeBytes === fileStat.size &&
        current.mimeType
      ) {
        continue;
      }
      pending.push(await inspect(relPath, absolute, fileStat));
    }

    const missingPaths = [...existing.entries()]
      .filter(([relPath, current]) => !files.has(relPath) && current.sizeBytes != null)
      .map(([relPath]) => relPath);

    const upsert = database.prepare(`
      INSERT INTO "MediaAsset" (
        "id", "path", "originalName", "mimeType", "width", "height",
        "sizeBytes", "sha256", "alt", "createdAt", "updatedAt"
      ) VALUES (
        @id, @path, @originalName, @mimeType, @width, @height,
        @sizeBytes, @sha256, '', @now, @now
      )
      ON CONFLICT("path") DO UPDATE SET
        "originalName" = COALESCE("originalName", excluded."originalName"),
        "mimeType" = excluded."mimeType",
        "width" = excluded."width",
        "height" = excluded."height",
        "sizeBytes" = excluded."sizeBytes",
        "sha256" = excluded."sha256",
        "updatedAt" = excluded."updatedAt"
    `);
    const markMissing = database.prepare(`
      UPDATE "MediaAsset"
      SET "mimeType" = NULL,
          "width" = NULL,
          "height" = NULL,
          "sizeBytes" = NULL,
          "sha256" = NULL,
          "updatedAt" = @now
      WHERE "path" = @path
    `);

    let created = 0;
    let enriched = 0;
    const applyChanges = database.transaction(() => {
      const now = new Date().toISOString();
      for (const metadata of pending) {
        const current = existing.get(metadata.path);
        upsert.run({
          id: `asset_${randomUUID().replaceAll("-", "")}`,
          ...metadata,
          now,
        });
        if (current) enriched += 1;
        else created += 1;
      }
      for (const relPath of missingPaths) markMissing.run({ path: relPath, now });
    });
    applyChanges();

    console.log(
      `Media catalog synchronized: ${created} created, ${enriched} enriched, ` +
        `${missingPaths.length} missing, ${copied} legacy uploads copied, ` +
        `${recovered.restored} staged deletions restored, ` +
        `${recovered.discarded} discarded.`,
    );
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => database.close());
