import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, rm, stat, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { withDirectoryLock } from "./directory-lock";

test("serializes overlapping operations and removes the lock", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-lock-"));
  const lockPath = path.join(root, "operation.lock");
  const order: string[] = [];
  try {
    await Promise.all([
      withDirectoryLock(lockPath, async () => {
        order.push("first:start");
        await delay(30);
        order.push("first:end");
      }),
      (async () => {
        await delay(5);
        await withDirectoryLock(lockPath, async () => {
          order.push("second:start");
          order.push("second:end");
        });
      })(),
    ]);
    assert.deepEqual(order, [
      "first:start",
      "first:end",
      "second:start",
      "second:end",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("recovers a stale empty lock directory", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-lock-stale-"));
  const lockPath = path.join(root, "operation.lock");
  try {
    await mkdir(lockPath);
    const stale = new Date(Date.now() - 60_000);
    await utimes(lockPath, stale, stale);
    const result = await withDirectoryLock(
      lockPath,
      async () => "recovered",
      { staleAfterMs: 10_000 },
    );
    assert.equal(result, "recovered");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("heartbeats keep a long operation from being reclaimed", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-lock-lease-"));
  const lockPath = path.join(root, "operation.lock");
  const order: string[] = [];
  const options = { staleAfterMs: 90, retryMs: 10, timeoutMs: 1_000 };
  try {
    await Promise.all([
      withDirectoryLock(
        lockPath,
        async () => {
          order.push("first:start");
          await delay(240);
          order.push("first:end");
        },
        options,
      ),
      (async () => {
        await delay(140);
        await withDirectoryLock(
          lockPath,
          async () => {
            order.push("second:start");
            order.push("second:end");
          },
          options,
        );
      })(),
    ]);
    assert.deepEqual(order, [
      "first:start",
      "first:end",
      "second:start",
      "second:end",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("recovers a stale owner lease without leaving tombstones", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-lock-owner-"));
  const lockPath = path.join(root, "operation.lock");
  const ownerPath = path.join(lockPath, "owner-abandoned");
  try {
    await mkdir(ownerPath, { recursive: true });
    const stale = new Date(Date.now() - 60_000);
    await utimes(lockPath, stale, stale);
    await utimes(ownerPath, stale, stale);
    const result = await withDirectoryLock(
      lockPath,
      async () => "recovered",
      { staleAfterMs: 10_000 },
    );
    assert.equal(result, "recovered");
    await assert.rejects(stat(lockPath), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("serializes a burst of contenders recovering the same stale lease", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-lock-burst-"));
  let active = 0;
  let maximumActive = 0;
  try {
    for (let round = 0; round < 8; round += 1) {
      const lockPath = path.join(root, `operation-${round}.lock`);
      const ownerPath = path.join(lockPath, "owner-abandoned");
      await mkdir(ownerPath, { recursive: true });
      const stale = new Date(Date.now() - 60_000);
      await utimes(lockPath, stale, stale);
      await utimes(ownerPath, stale, stale);

      await Promise.all(
        Array.from({ length: 20 }, () =>
          withDirectoryLock(
            lockPath,
            async () => {
              active += 1;
              maximumActive = Math.max(maximumActive, active);
              try {
                await delay(2);
              } finally {
                active -= 1;
              }
            },
            { staleAfterMs: 10_000, retryMs: 1, timeoutMs: 5_000 },
          ),
        ),
      );
    }
    assert.equal(maximumActive, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
