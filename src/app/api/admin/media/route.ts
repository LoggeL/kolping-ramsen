import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { scanMedia, listBuckets } from "@/lib/media-scan";
import { prisma } from "@/lib/prisma";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOAD_LIBRARY_ABS = path.join(PUBLIC_DIR, "uploads", "library");
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const MAX_BYTES = 10 * 1024 * 1024;

function slugifyBase(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "bild"
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const files = await scanMedia();
  const buckets = listBuckets(files);
  return NextResponse.json({
    files: files.map((f) => ({
      url: f.url,
      bucket: f.bucket,
      filename: f.filename,
      size: f.size,
      mtime: f.mtime.toISOString(),
    })),
    buckets,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) {
      return NextResponse.json({ error: "Keine Dateien" }, { status: 400 });
    }
    await mkdir(UPLOAD_LIBRARY_ABS, { recursive: true });
    const saved: { url: string; filename: string }[] = [];
    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { error: `Dateityp nicht erlaubt: ${file.type}` },
          { status: 400 },
        );
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: `Datei größer als 10 MB: ${file.name}` },
          { status: 400 },
        );
      }
      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) {
        return NextResponse.json(
          { error: `Dateiendung nicht erlaubt: ${ext}` },
          { status: 400 },
        );
      }
      const base = slugifyBase(path.basename(file.name, ext));
      const safeName = `${base}-${Date.now()}-${crypto
        .randomBytes(3)
        .toString("hex")}${ext}`;
      const abs = path.join(UPLOAD_LIBRARY_ABS, safeName);
      await writeFile(abs, Buffer.from(await file.arrayBuffer()));
      const rel = path.relative(PUBLIC_DIR, abs).replace(/\\/g, "/");
      await prisma.mediaAsset.create({ data: { path: rel, alt: "" } });
      saved.push({ url: "/" + rel, filename: safeName });
    }
    revalidatePath("/admin/media");
    return NextResponse.json({ ok: true, saved });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload fehlgeschlagen";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
