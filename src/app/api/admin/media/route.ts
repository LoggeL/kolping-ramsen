import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { listMediaFiles } from "@/lib/media-catalog";
import { buildReferenceMap, mediaReferenceKey } from "@/lib/media-references";
import { storeMediaFiles } from "@/lib/media-library";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-url";
import { hasExactOrigin } from "@/lib/request-origin";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitKey } from "@/lib/client-ip";
import {
  readFormDataBody,
  RequestBodyTooLargeError,
} from "@/lib/request-body";

const MAX_MULTIPART_BODY_BYTES = 82 * 1024 * 1024;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [files, referenceMap, groups] = await Promise.all([
    listMediaFiles(),
    buildReferenceMap(),
    prisma.mediaGroup.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          include: { asset: { select: { path: true, alt: true } } },
        },
        _count: { select: { items: true } },
      },
    }),
  ]);
  return NextResponse.json({
    files: files.map((file) => {
      const refs = referenceMap.get(mediaReferenceKey(file.url)) ?? [];
      return {
        id: file.id,
        url: file.url,
        filename: file.filename,
        size: file.size,
        mtime: file.mtime.toISOString(),
        orphan: refs.length === 0,
        alt: file.alt,
        width: file.width,
        height: file.height,
        mimeType: file.mimeType,
      };
    }),
    groups: groups.map((group) => ({
      id: group.id,
      slug: group.slug,
      name: group.name,
      itemCount: group._count.items,
      thumb: group.items[0] ? `/${group.items[0].asset.path}` : null,
      thumbAlt: group.items[0]
        ? group.items[0].alt ?? group.items[0].asset.alt
        : "",
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const expectedOrigin =
    process.env.NODE_ENV === "production"
      ? SITE_URL
      : new URL(request.url).origin;
  if (!hasExactOrigin(request, expectedOrigin)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const limited = rateLimit(
    `${rateLimitKey("admin-media-upload", request.headers)}:${session.userId}`,
    10,
    10 * 60 * 1000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Zu viele Uploads. Bitte später erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(limited.retryIn) } },
    );
  }
  try {
    const formData = await readFormDataBody(request, MAX_MULTIPART_BODY_BYTES);
    const files = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File && file.size > 0);
    const saved = await storeMediaFiles(files);
    revalidatePath("/admin/media");
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, saved });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { error: "Upload größer als 80 MB" },
        { status: 413 },
      );
    }
    const message = error instanceof Error ? error.message : "Upload fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
