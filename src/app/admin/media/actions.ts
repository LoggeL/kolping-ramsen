"use server";

import { mkdir, rename, unlink, writeFile, access } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOAD_LIBRARY_REL = "uploads/library";
const UPLOAD_LIBRARY_ABS = path.join(PUBLIC_DIR, "uploads", "library");
const SAFE_ROOTS = ["uploads", "images"].map((r) =>
  path.join(PUBLIC_DIR, r),
);

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const ALLOWED_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
]);
const MAX_BYTES = 10 * 1024 * 1024;
const FILENAME_RE = /^[a-z0-9._-]+$/i;

function isSafe(abs: string) {
  return SAFE_ROOTS.some(
    (root) => abs === root || abs.startsWith(root + path.sep),
  );
}

function relFromAbs(abs: string) {
  return path.relative(PUBLIC_DIR, abs).replace(/\\/g, "/");
}

function slugifyBase(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "bild"
  );
}

function broadRevalidate() {
  revalidatePath("/admin/media");
  revalidatePath("/", "layout");
}

export async function uploadMediaFiles(formData: FormData) {
  await requireSession();
  await mkdir(UPLOAD_LIBRARY_ABS, { recursive: true });

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) {
      throw new Error(`Dateityp nicht erlaubt: ${file.type}`);
    }
    if (file.size > MAX_BYTES) {
      throw new Error(`Datei größer als 10 MB: ${file.name}`);
    }
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      throw new Error(`Dateiendung nicht erlaubt: ${ext}`);
    }
    const base = slugifyBase(path.basename(file.name, ext));
    const safeName = `${base}-${Date.now()}-${crypto
      .randomBytes(3)
      .toString("hex")}${ext}`;
    const abs = path.join(UPLOAD_LIBRARY_ABS, safeName);
    await writeFile(abs, Buffer.from(await file.arrayBuffer()));
    const rel = relFromAbs(abs);
    await prisma.mediaAsset.create({
      data: { path: rel, alt: "" },
    });
  }

  broadRevalidate();
}

export async function updateMediaAlt(relPath: string, formData: FormData) {
  await requireSession();
  const alt = String(formData.get("alt") ?? "").slice(0, 250).trim();

  await prisma.mediaAsset.upsert({
    where: { path: relPath },
    update: { alt },
    create: { path: relPath, alt },
  });

  revalidatePath("/admin/media");
}

export async function renameMediaFile(relPath: string, formData: FormData) {
  await requireSession();
  const newName = String(formData.get("newName") ?? "").trim();

  if (!FILENAME_RE.test(newName)) {
    throw new Error(
      "Ungültiger Dateiname (erlaubt: Buchstaben, Ziffern, Punkt, Bindestrich, Unterstrich)",
    );
  }
  const oldExt = path.extname(relPath).toLowerCase();
  const newExt = path.extname(newName).toLowerCase();
  if (newExt !== oldExt) {
    throw new Error(`Dateiendung muss ${oldExt} bleiben`);
  }

  const oldAbs = path.resolve(PUBLIC_DIR, relPath);
  if (!isSafe(oldAbs)) throw new Error("Pfad nicht erlaubt");

  const newAbs = path.join(path.dirname(oldAbs), newName);
  if (!isSafe(newAbs)) throw new Error("Zielpfad nicht erlaubt");
  if (newAbs === oldAbs) return;

  let exists = false;
  try {
    await access(newAbs);
    exists = true;
  } catch {}
  if (exists) throw new Error(`Datei existiert schon: ${newName}`);

  await rename(oldAbs, newAbs);

  const newRel = relFromAbs(newAbs);
  const oldUrl = "/" + relPath;
  const newUrl = "/" + newRel;

  await prisma.mediaAsset.updateMany({
    where: { path: relPath },
    data: { path: newRel },
  });

  await prisma.news.updateMany({
    where: { coverImage: oldUrl },
    data: { coverImage: newUrl },
  });

  const like = `%${oldUrl}%`;
  await prisma.$executeRaw`UPDATE "News" SET "content" = REPLACE("content", ${oldUrl}, ${newUrl}) WHERE "content" LIKE ${like}`;
  await prisma.$executeRaw`UPDATE "Page" SET "content" = REPLACE("content", ${oldUrl}, ${newUrl}) WHERE "content" LIKE ${like}`;
  await prisma.$executeRaw`UPDATE "Event" SET "description" = REPLACE("description", ${oldUrl}, ${newUrl}) WHERE "description" LIKE ${like}`;

  broadRevalidate();
}

export async function deleteMediaFile(relPath: string) {
  await requireSession();
  const abs = path.resolve(PUBLIC_DIR, relPath);
  if (!isSafe(abs)) throw new Error("Pfad nicht erlaubt");

  await unlink(abs).catch((err) => {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  });

  await prisma.mediaAsset.deleteMany({ where: { path: relPath } });

  broadRevalidate();
}
