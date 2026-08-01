import { randomUUID } from "node:crypto";
import {
  mkdir,
  readdir,
  rename,
  rm,
  rmdir,
  stat,
  utimes,
} from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

type DirectoryLockOptions = {
  retryMs?: number;
  timeoutMs?: number;
  staleAfterMs?: number;
  busyMessage?: string;
};

function isErrorCode(error: unknown, code: string): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === code
  );
}

async function latestLeaseTimestamp(lockPath: string): Promise<number | null> {
  try {
    const entries = await readdir(lockPath, { withFileTypes: true });
    let latest = (await stat(lockPath)).mtimeMs;
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith("owner-")) continue;
      latest = Math.max(latest, (await stat(`${lockPath}/${entry.name}`)).mtimeMs);
    }
    return latest;
  } catch (error) {
    // The holder may release or a reaper may rename the lease at any point
    // during inspection. That is a normal retry signal, not an I/O failure.
    if (isErrorCode(error, "ENOENT")) return null;
    throw error;
  }
}

async function reclaimStaleLock(
  lockPath: string,
  staleAfterMs: number,
): Promise<boolean> {
  // All stale decisions happen behind a second atomic gate and are re-read
  // after acquiring it. This prevents two reapers from acting on the same old
  // observation and deleting a newly acquired lock (the classic ABA race).
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

    // A unique tombstone keeps cleanup away from a replacement lock. If a
    // reaper crashes, its gate intentionally remains and future callers fail
    // closed instead of guessing about ownership.
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

async function releaseOwnedLock(lockPath: string, ownerPath: string) {
  try {
    await rmdir(ownerPath);
  } catch (error) {
    if (isErrorCode(error, "ENOENT")) return;
    throw error;
  }

  try {
    await rmdir(lockPath);
  } catch (error) {
    // ENOTEMPTY means this path is no longer our empty lock directory. Never
    // remove it recursively: it may already belong to a replacement holder.
    if (!isErrorCode(error, "ENOENT") && !isErrorCode(error, "ENOTEMPTY")) {
      throw error;
    }
  }
}

/**
 * Serialize an operation across Node processes using an atomic directory
 * lease. The owner heartbeat prevents a long operation from looking stale;
 * the unique owner directory makes late cleanup safe after crash recovery.
 */
export async function withDirectoryLock<T>(
  lockPath: string,
  operation: () => Promise<T>,
  options: DirectoryLockOptions = {},
): Promise<T> {
  const retryMs = options.retryMs ?? 75;
  const timeoutMs = options.timeoutMs ?? 15_000;
  const staleAfterMs = options.staleAfterMs ?? 120_000;
  const deadline = Date.now() + timeoutMs;
  const ownerPath = `${lockPath}/owner-${randomUUID()}`;

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
        throw new Error(options.busyMessage ?? "Operation is currently busy");
      }
      await delay(retryMs);
    }
  }

  const heartbeatEveryMs = Math.max(
    25,
    Math.min(30_000, Math.floor(staleAfterMs / 3)),
  );
  const heartbeatController = new AbortController();
  let heartbeatError: unknown;
  const heartbeat = (async () => {
    while (!heartbeatController.signal.aborted) {
      try {
        await delay(heartbeatEveryMs, undefined, {
          signal: heartbeatController.signal,
        });
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
      throw new Error("Directory lock heartbeat failed", {
        cause: heartbeatError,
      });
    }
    return result;
  } finally {
    heartbeatController.abort();
    await heartbeat;
    await releaseOwnedLock(lockPath, ownerPath);
  }
}
