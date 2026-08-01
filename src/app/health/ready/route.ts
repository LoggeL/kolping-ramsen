import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function GET() {
  try {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      throw new Error("SESSION_SECRET is not configured");
    }
    if (!process.env.DATABASE_URL?.startsWith("file:")) {
      throw new Error("DATABASE_URL is not a persistent SQLite URL");
    }

    // Select migration-critical fields even when the tables are empty. SQLite
    // then rejects a partially migrated schema instead of reporting readiness.
    await Promise.all([
      prisma.user.findFirst({ select: { id: true, updatedAt: true } }),
      prisma.event.findFirst({
        select: { id: true, startTime: true, allDay: true, timeZone: true },
      }),
      prisma.mediaAsset.findFirst({
        select: { id: true, sha256: true, sizeBytes: true },
      }),
      prisma.page.findFirst({ select: { id: true, gallerySlug: true } }),
    ]);
    return Response.json({ status: "ready" }, { headers });
  } catch {
    return Response.json(
      { status: "not_ready" },
      { status: 503, headers },
    );
  }
}
