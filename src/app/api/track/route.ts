import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitKey } from "@/lib/client-ip";
import {
  hasAnalyticsOptOut,
  sanitizeAnalyticsReferrer,
} from "@/lib/analytics-privacy";
import { normalizeInternalPathname } from "@/lib/legacy-routing";
import { readJsonBody } from "@/lib/request-body";

const PATH_RE = /^\/[A-Za-z0-9._\-/?=&%]{0,300}$/;
const MAX_TRACKING_BODY_BYTES = 4 * 1024;

export async function POST(req: NextRequest) {
  if (hasAnalyticsOptOut(req.headers)) {
    return new Response(null, { status: 204 });
  }

  const limited = rateLimit(rateLimitKey("track", req.headers), 60, 60 * 1000);
  if (!limited.ok) return new Response(null, { status: 204 });

  let body: unknown;
  try {
    body = await readJsonBody(req, MAX_TRACKING_BODY_BYTES);
  } catch {
    return new Response(null, { status: 204 });
  }
  const { path, referrer } = (body ?? {}) as {
    path?: unknown;
    referrer?: unknown;
  };
  if (typeof path !== "string" || !PATH_RE.test(path)) {
    return new Response(null, { status: 204 });
  }
  const cleanPath = normalizeInternalPathname(stripQuery(path));
  if (
    !cleanPath ||
    cleanPath === "/admin" ||
    cleanPath.startsWith("/admin/") ||
    cleanPath === "/api" ||
    cleanPath.startsWith("/api/")
  ) {
    return new Response(null, { status: 204 });
  }

  const cleanRef =
    typeof referrer === "string" && referrer
      ? sanitizeAnalyticsReferrer(referrer)
      : null;

  await prisma.pageHit.create({
    data: { path: cleanPath, referrer: cleanRef },
  });

  return new Response(null, { status: 204 });
}

function stripQuery(p: string): string {
  const i = p.indexOf("?");
  return i === -1 ? p : p.slice(0, i);
}
