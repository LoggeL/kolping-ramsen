"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { slugify } from "@/lib/slug";

const pageSchema = z.object({
  title: z.string().min(2).max(200).trim(),
  slug: z.string().max(140).trim().optional(),
  parent: z.string().max(140).optional(),
  content: z.string(),
  metaTitle: z.string().max(160).optional(),
  metaDesc: z.string().max(300).optional(),
  sortOrder: z.string().optional(),
  published: z.string().optional(),
});

function pickSlug(slug: string | undefined, title: string, parent?: string) {
  const base = slug && slug.trim().length > 0 ? slug : title;
  const own = slugify(base);
  if (parent && parent.trim()) return `${parent.replace(/^\/+|\/+$/g, "")}/${own}`;
  return own;
}

export async function createPage(formData: FormData) {
  const session = await requireSession();
  const parsed = pageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const data = parsed.data;
  const slug = pickSlug(data.slug, data.title, data.parent);
  await prisma.page.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      metaTitle: data.metaTitle || null,
      metaDesc: data.metaDesc || null,
      parent: data.parent || null,
      sortOrder: data.sortOrder ? Number(data.sortOrder) : 0,
      published: data.published === "on",
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
      published: data.published === "on",
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

export async function movePage(id: string, direction: "up" | "down") {
  await requireSession();
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return;

  // Siblings share the same parent, ordered by sortOrder then title.
  const siblings = await prisma.page.findMany({
    where: { parent: page.parent },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
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
