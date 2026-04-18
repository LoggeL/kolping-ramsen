import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const PATH_RE = /^\/[A-Za-z0-9._\-/?=&%]{0,300}$/;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limited = rateLimit(`track:${ip}`, 60, 60 * 1000);
  if (!limited.ok) return new Response(null, { status: 204 });

  let body: unknown;
  try {
    body = await req.json();
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
  if (path.startsWith("/admin") || path.startsWith("/api")) {
    return new Response(null, { status: 204 });
  }

  const cleanPath = stripQuery(path).slice(0, 300);
  const cleanRef =
    typeof referrer === "string" && referrer
      ? sanitizeReferrer(referrer)
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

function sanitizeReferrer(ref: string): string | null {
  try {
    const u = new URL(ref);
    return `${u.protocol}//${u.host}${u.pathname}`.slice(0, 250);
  } catch {
    return null;
  }
}
