"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { normalizeMediaPath } from "@/lib/media-storage";
import { extractGallerySlugs, renameGalleryTokens } from "@/lib/gallery-token";

const createSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  slug: z.string().max(120).trim().optional(),
});

function revalidateGroup(groupId: string) {
  revalidatePath(`/admin/media/groups/${groupId}`);
  revalidatePath("/", "layout");
}

export async function createGroup(formData: FormData) {
  await requireSession();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const name = parsed.data.name;
  const rawSlug = parsed.data.slug?.trim() || name;
  const baseSlug = slugify(rawSlug);
  if (!baseSlug) throw new Error("Bitte einen gültigen Namen eingeben.");
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.mediaGroup.findUnique({ where: { slug } })) {
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }
  const group = await prisma.mediaGroup.create({ data: { slug, name } });
  revalidatePath("/admin/media/groups");
  redirect(`/admin/media/groups/${group.id}`);
}

const renameSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  slug: z.string().min(1).max(120).trim(),
});

export async function renameGroup(id: string, formData: FormData) {
  await requireSession();
  const parsed = renameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const { name } = parsed.data;
  const slug = slugify(parsed.data.slug);
  if (!slug) throw new Error("Bitte einen gültigen Slug eingeben.");

  await prisma.$transaction(async (transaction) => {
    const current = await transaction.mediaGroup.findUnique({ where: { id } });
    if (!current) throw new Error("Galerie nicht gefunden");
    const existing = await transaction.mediaGroup.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      throw new Error(`Slug "${slug}" ist bereits vergeben`);
    }
    await transaction.mediaGroup.update({ where: { id }, data: { name, slug } });
    if (current.slug !== slug) {
      const [pages, news, events] = await Promise.all([
        transaction.page.findMany({
          where: {
            OR: [
              { gallerySlug: { not: null } },
              { content: { contains: "::gallery[" } },
            ],
          },
          select: { id: true, gallerySlug: true, content: true },
        }),
        transaction.news.findMany({
          where: { content: { contains: "::gallery[" } },
          select: { id: true, content: true },
        }),
        transaction.event.findMany({
          where: { description: { contains: "::gallery[" } },
          select: { id: true, description: true },
        }),
      ]);

      for (const page of pages) {
        const content = renameGalleryTokens(page.content, current.slug, slug);
        const gallerySlug = page.gallerySlug?.toLowerCase() === current.slug
          ? slug
          : page.gallerySlug;
        if (content !== page.content || gallerySlug !== page.gallerySlug) {
          await transaction.page.update({
            where: { id: page.id },
            data: { content, gallerySlug },
          });
        }
      }
      for (const item of news) {
        const content = renameGalleryTokens(item.content, current.slug, slug);
        if (content !== item.content) {
          await transaction.news.update({ where: { id: item.id }, data: { content } });
        }
      }
      for (const event of events) {
        const description = renameGalleryTokens(
          event.description,
          current.slug,
          slug,
        );
        if (description !== event.description) {
          await transaction.event.update({
            where: { id: event.id },
            data: { description },
          });
        }
      }
    }
  });

  revalidatePath("/admin/media/groups");
  revalidateGroup(id);
}

export async function deleteGroup(id: string) {
  await requireSession();
  const deleted = await prisma.$transaction(async (transaction) => {
    const group = await transaction.mediaGroup.findUnique({ where: { id } });
    if (!group) return false;
    const [pages, news, events] = await Promise.all([
      transaction.page.findMany({
        where: {
          OR: [
            { gallerySlug: { not: null } },
            { content: { contains: "::gallery[" } },
          ],
        },
        select: { gallerySlug: true, content: true },
      }),
      transaction.news.findMany({
        where: { content: { contains: "::gallery[" } },
        select: { content: true },
      }),
      transaction.event.findMany({
        where: { description: { contains: "::gallery[" } },
        select: { description: true },
      }),
    ]);
    const slug = group.slug.toLowerCase();
    const referenced =
      pages.some(
        (page) =>
          page.gallerySlug?.toLowerCase() === slug ||
          extractGallerySlugs(page.content).includes(slug),
      ) ||
      news.some((item) => extractGallerySlugs(item.content).includes(slug)) ||
      events.some((event) =>
        extractGallerySlugs(event.description).includes(slug),
      );
    if (referenced) {
      throw new Error(
        "Die Galerie ist noch in Inhalten eingebunden und kann nicht gelöscht werden.",
      );
    }
    await transaction.mediaGroup.delete({ where: { id } });
    return true;
  });
  if (!deleted) return;
  revalidatePath("/admin/media/groups");
  revalidatePath("/", "layout");
  redirect("/admin/media/groups");
}

const addItemSchema = z.object({ paths: z.string().min(1).max(50_000) });

export async function addItems(groupId: string, formData: FormData) {
  await requireSession();
  const parsed = addItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  let rawPaths: unknown;
  try {
    rawPaths = JSON.parse(parsed.data.paths);
  } catch {
    throw new Error("Ungültige Bildauswahl");
  }
  if (!Array.isArray(rawPaths) || rawPaths.length === 0) return [];
  if (rawPaths.length > 100 || !rawPaths.every((value) => typeof value === "string")) {
    throw new Error("Ungültige Bildauswahl");
  }
  const paths = [...new Set(rawPaths.map(normalizeMediaPath))];
  const assets = await prisma.mediaAsset.findMany({
    where: { path: { in: paths }, sizeBytes: { not: null } },
  });
  const byPath = new Map(assets.map((asset) => [asset.path, asset]));
  const missing = paths.filter((itemPath) => !byPath.has(itemPath));
  if (missing.length) throw new Error(`Nicht katalogisiertes Bild: /${missing[0]}`);

  const [existingItems, maximum] = await Promise.all([
    prisma.mediaGroupItem.findMany({
      where: { groupId },
      select: { assetId: true },
    }),
    prisma.mediaGroupItem.aggregate({
      where: { groupId },
      _max: { sortOrder: true },
    }),
  ]);
  const existingAssetIds = new Set(existingItems.map((item) => item.assetId));
  const selected = paths
    .map((itemPath) => byPath.get(itemPath)!)
    .filter((asset) => !existingAssetIds.has(asset.id));
  const offset = (maximum._max.sortOrder ?? -10) + 10;
  const created = await prisma.$transaction(
    selected.map((asset, index) =>
      prisma.mediaGroupItem.create({
        data: { groupId, assetId: asset.id, sortOrder: offset + index * 10 },
        select: {
          id: true,
          sortOrder: true,
          alt: true,
          caption: true,
          asset: { select: { path: true, alt: true } },
        },
      }),
    ),
  );
  revalidateGroup(groupId);
  return created.map((item) => ({
    id: item.id,
    path: `/${item.asset.path}`,
    alt: item.alt ?? item.asset.alt,
    caption: item.caption,
    sortOrder: item.sortOrder,
  }));
}

export async function removeItem(itemId: string) {
  await requireSession();
  const item = await prisma.mediaGroupItem.findUnique({
    where: { id: itemId },
    select: { groupId: true },
  });
  if (!item) return;
  await prisma.mediaGroupItem.delete({ where: { id: itemId } });
  revalidateGroup(item.groupId);
}

export async function reorderItems(groupId: string, orderedIds: string[]) {
  await requireSession();
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;
  const items = await prisma.mediaGroupItem.findMany({
    where: { groupId },
    select: { id: true },
  });
  const owned = new Set(items.map((item) => item.id));
  if (
    orderedIds.length !== owned.size ||
    new Set(orderedIds).size !== owned.size ||
    !orderedIds.every((id) => owned.has(id))
  ) {
    throw new Error("Die Galerie hat sich zwischenzeitlich geändert. Bitte neu laden.");
  }
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.mediaGroupItem.update({
        where: { id },
        data: { sortOrder: index * 10 },
      }),
    ),
  );
  revalidateGroup(groupId);
}
