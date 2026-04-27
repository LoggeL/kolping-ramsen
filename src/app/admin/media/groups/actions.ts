"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { slugify } from "@/lib/slug";

const createSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  slug: z.string().max(120).trim().optional(),
});

export async function createGroup(formData: FormData) {
  await requireSession();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const name = parsed.data.name;
  const rawSlug = parsed.data.slug && parsed.data.slug.length > 0 ? parsed.data.slug : name;
  let slug = slugify(rawSlug);
  // ensure unique
  let i = 1;
  while (await prisma.mediaGroup.findUnique({ where: { slug } })) {
    i++;
    slug = `${slugify(rawSlug)}-${i}`;
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
  const existing = await prisma.mediaGroup.findUnique({ where: { slug } });
  if (existing && existing.id !== id) {
    throw new Error(`Slug "${slug}" ist bereits vergeben`);
  }
  await prisma.mediaGroup.update({ where: { id }, data: { name, slug } });
  revalidatePath("/admin/media/groups");
  revalidatePath(`/admin/media/groups/${id}`);
  revalidatePath("/", "layout");
}

export async function deleteGroup(id: string) {
  await requireSession();
  await prisma.mediaGroup.delete({ where: { id } });
  redirect("/admin/media/groups");
}

const addItemSchema = z.object({
  paths: z.string().min(1),
});

export async function addItems(groupId: string, formData: FormData) {
  await requireSession();
  const parsed = addItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const paths = JSON.parse(parsed.data.paths) as string[];
  if (!Array.isArray(paths) || paths.length === 0) return;
  const offset = await prisma.mediaGroupItem.count({ where: { groupId } });
  await prisma.$transaction(
    paths.map((p, i) =>
      prisma.mediaGroupItem.create({
        data: { groupId, path: p, sortOrder: (offset + i) * 10 },
      }),
    ),
  );
  revalidatePath(`/admin/media/groups/${groupId}`);
  revalidatePath("/", "layout");
}

export async function removeItem(itemId: string) {
  await requireSession();
  const item = await prisma.mediaGroupItem.findUnique({
    where: { id: itemId },
    select: { groupId: true },
  });
  if (!item) return;
  await prisma.mediaGroupItem.delete({ where: { id: itemId } });
  revalidatePath(`/admin/media/groups/${item.groupId}`);
  revalidatePath("/", "layout");
}

export async function reorderItems(groupId: string, orderedIds: string[]) {
  await requireSession();
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;
  const items = await prisma.mediaGroupItem.findMany({
    where: { groupId },
    select: { id: true },
  });
  const owned = new Set(items.map((i) => i.id));
  if (!orderedIds.every((id) => owned.has(id))) return;
  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.mediaGroupItem.update({
        where: { id },
        data: { sortOrder: i * 10 },
      }),
    ),
  );
  revalidatePath(`/admin/media/groups/${groupId}`);
  revalidatePath("/", "layout");
}
