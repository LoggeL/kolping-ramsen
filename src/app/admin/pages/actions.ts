"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { isCivilDate, todayInTimeZone } from "@/lib/event-time";

const optionalArchiveDate = z.string().trim().refine(
  (value) => value === "" || isCivilDate(value),
  "Ungültiges Archivdatum",
);

const pageSchema = z.object({
  title: z.string().min(2).max(200).trim(),
  slug: z.string().max(140).trim().optional(),
  parent: z.string().max(140).optional(),
  content: z.string(),
  metaTitle: z.string().max(160).optional(),
  metaDesc: z.string().max(300).optional(),
  sortOrder: z.string().optional(),
  archiveDate: optionalArchiveDate.optional(),
  published: z.string().optional(),
  gallerySlug: z.string().max(140).optional(),
});

function pickSlug(slug: string | undefined, title: string, parent?: string) {
  const base = slug && slug.trim().length > 0 ? slug : title;
  const own = slugify(base);
  if (parent && parent.trim()) return `${parent.replace(/^\/+|\/+$/g, "")}/${own}`;
  return own;
}

function archiveDate(value: string | undefined, fallbackToToday = false): Date | null {
  if (value) return new Date(`${value}T00:00:00.000Z`);
  if (!fallbackToToday) return null;
  const today = todayInTimeZone();
  return new Date(`${today}T00:00:00.000Z`);
}

async function pickGallerySlug(value: string | undefined): Promise<string | null> {
  if (!value?.trim()) return null;
  const gallerySlug = slugify(value);
  if (!gallerySlug) throw new Error("Ungültige Galerie");
  const gallery = await prisma.mediaGroup.findUnique({
    where: { slug: gallerySlug },
    select: { id: true },
  });
  if (!gallery) throw new Error("Galerie nicht gefunden");
  return gallerySlug;
}

export async function createPage(formData: FormData) {
  const session = await requireSession();
  const parsed = pageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const data = parsed.data;
  const slug = pickSlug(data.slug, data.title, data.parent);
  const gallerySlug = await pickGallerySlug(data.gallerySlug);
  await prisma.page.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      metaTitle: data.metaTitle || null,
      metaDesc: data.metaDesc || null,
      parent: data.parent || null,
      sortOrder: data.sortOrder ? Number(data.sortOrder) : 0,
      archiveDate: archiveDate(data.archiveDate, true),
      published: data.published === "on",
      gallerySlug,
      authorId: session.userId,
    },
  });
  revalidatePath(`/${slug}`);
  redirect("/admin/pages");
}

export async function updatePage(id: string, formData: FormData) {
  await requireSession();
  const parsed = pageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const data = parsed.data;
  const slug = pickSlug(data.slug, data.title, data.parent);
  const gallerySlug = await pickGallerySlug(data.gallerySlug);
  await prisma.page.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      content: data.content,
      metaTitle: data.metaTitle || null,
      metaDesc: data.metaDesc || null,
      parent: data.parent || null,
      sortOrder: data.sortOrder ? Number(data.sortOrder) : 0,
      archiveDate: archiveDate(data.archiveDate),
      published: data.published === "on",
      gallerySlug,
    },
  });
  revalidatePath(`/${slug}`);
  redirect("/admin/pages");
}

export async function deletePage(id: string) {
  await requireSession();
  await prisma.page.delete({ where: { id } });
  redirect("/admin/pages");
}

export async function reorderSiblings(orderedIds: string[]) {
  await requireSession();
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;
  // Guard: all ids exist and share the same slug-path prefix (same depth/parent).
  const rows = await prisma.page.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true, slug: true },
  });
  if (rows.length !== orderedIds.length) return;
  const prefixOf = (slug: string) => {
    const parts = slug.split("/");
    return parts.slice(0, -1).join("/");
  };
  const prefix = prefixOf(rows[0].slug);
  const depth = rows[0].slug.split("/").length;
  const consistent = rows.every(
    (r) => prefixOf(r.slug) === prefix && r.slug.split("/").length === depth,
  );
  if (!consistent) return;

  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.page.update({ where: { id }, data: { sortOrder: i * 10 } }),
    ),
  );
  revalidatePath("/admin/pages");
}

export async function movePage(id: string, direction: "up" | "down") {
  await requireSession();
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return;

  // Siblings share the same slug-path prefix (depth). "foo/bar/baz" has
  // prefix "foo/bar"; top-level pages have no slash. We can't rely on the
  // legacy `parent` column because older rows left it null.
  const segments = page.slug.split("/");
  const prefix = segments.slice(0, -1).join("/");
  const allAtLevel = await prisma.page.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
  const siblings = allAtLevel.filter((p) => {
    const parts = p.slug.split("/");
    if (parts.length !== segments.length) return false;
    return parts.slice(0, -1).join("/") === prefix;
  });
  const idx = siblings.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) return;

  // Normalize sortOrder across all siblings to their current positions,
  // then swap the two we care about. This fixes inherited "everyone is 0".
  const normalized = siblings.map((s, i) => ({ id: s.id, sortOrder: i * 10 }));
  const a = normalized[idx];
  const b = normalized[swapIdx];
  [a.sortOrder, b.sortOrder] = [b.sortOrder, a.sortOrder];

  await prisma.$transaction(
    normalized.map((n) =>
      prisma.page.update({ where: { id: n.id }, data: { sortOrder: n.sortOrder } }),
    ),
  );
  revalidatePath("/admin/pages");
}
