import "server-only";
import { prisma } from "@/lib/prisma";
import {
  analyticsRetentionCutoff,
  resolveAnalyticsRetentionDays,
} from "@/lib/analytics-privacy";

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

type RetentionState = {
  start?: Promise<void>;
  timer?: ReturnType<typeof setInterval>;
};

const globalForRetention = globalThis as typeof globalThis & {
  __kolpingAnalyticsRetention?: RetentionState;
};

const state = (globalForRetention.__kolpingAnalyticsRetention ??= {});

async function removeExpiredPageHits(): Promise<void> {
  const retentionDays = resolveAnalyticsRetentionDays(
    process.env.ANALYTICS_RETENTION_DAYS,
  );
  const cutoff = analyticsRetentionCutoff(new Date(), retentionDays);

  try {
    const result = await prisma.pageHit.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (result.count > 0) {
      console.info(
        `[analytics] Removed ${result.count} page hits older than ${retentionDays} days.`,
      );
    }
  } catch (error) {
    console.error(
      "[analytics] Retention cleanup failed; it will be retried automatically.",
      error,
    );
  }
}

/**
 * Run once on process startup and then daily. The singleton interval is bounded
 * process state and deliberately lives outside the request path.
 */
export function startAnalyticsRetention(): Promise<void> {
  if (state.start) return state.start;

  state.start = (async () => {
    await removeExpiredPageHits();

    state.timer = setInterval(() => {
      void removeExpiredPageHits();
    }, CLEANUP_INTERVAL_MS);
    state.timer.unref();
  })();

  return state.start;
}
