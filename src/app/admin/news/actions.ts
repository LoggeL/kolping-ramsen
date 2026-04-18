"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { slugify } from "@/lib/slug";

const newsSchema = z.object({
  title: z.string().min(2).max(200).trim(),
  slug: z.string().max(140).trim().optional(),
  date: z.string(),
  teaser: z.string().min(2).max(500).trim(),
  content: z.string().min(2),
  coverImage: z.string().max(500).optional(),
  published: z.string().optional(),
});

export async function createNews(formData: FormData) {
  const session = await requireSession();
  const parsed = newsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const data = parsed.data;
  const slug = slugify(data.slug || data.title);

  await prisma.news.create({
    data: {
      title: data.title,
      slug,
      date: new Date(data.date),
      teaser: data.teaser,
      content: data.content,
      coverImage: data.coverImage || null,
      published: data.published === "on",
      authorId: session.userId,
    },
  });
  revalidatePath("/aktuelles");
  revalidatePath("/");
  redirect("/admin/news");
}

export async function updateNews(id: string, formData: FormData) {
  await requireSession();
  const parsed = newsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const data = parsed.data;
  const slug = slugify(data.slug || data.title);

  await prisma.news.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      date: new Date(data.date),
      teaser: data.teaser,
      content: data.content,
      coverImage: data.coverImage || null,
      published: data.published === "on",
    },
  });
  revalidatePath("/aktuelles");
  revalidatePath(`/aktuelles/${slug}`);
  revalidatePath("/");
  redirect("/admin/news");
}

export async function deleteNews(id: string) {
  await requireSession();
  await prisma.news.delete({ where: { id } });
  revalidatePath("/aktuelles");
  revalidatePath("/");
  redirect("/admin/news");
}
