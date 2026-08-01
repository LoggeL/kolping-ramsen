import { NextRequest, NextResponse } from "next/server";
import { findPublishedRedirect } from "@/lib/legacy-redirect";
import type { LegacySearchParams } from "@/lib/legacy-routing";

function legacySearchParams(searchParams: URLSearchParams): LegacySearchParams {
  const values: LegacySearchParams = {};
  for (const key of new Set(searchParams.keys())) {
    const all = searchParams.getAll(key);
    values[key] = all.length > 1 ? all : all[0];
  }
  return values;
}

export async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  try {
    const destination = await findPublishedRedirect(
      request.nextUrl.pathname,
      legacySearchParams(request.nextUrl.searchParams),
    );
    if (destination) {
      return NextResponse.redirect(new URL(destination, request.url), 308);
    }
  } catch {
    // A redirect lookup must never make the canonical site unavailable.
    console.error("[legacy-redirect] Lookup failed; continuing without redirect.");
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/index.php/:path*", "/ueber-uns/geschichte-pfarrheim"],
};
