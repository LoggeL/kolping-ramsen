"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { saveUpload } from "@/lib/uploads";

const gallerySchema = z.object({
  title: z.string().min(2).max(200).trim(),
  slug: z.string().max(140).optional(),
  description: z.string().max(2000).optional(),
  date: z.string().optional(),
  published: z.string().optional(),
});

export async function createGallery(formData: FormData) {
  const session = await requireSession();
  const parsed = gallerySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const data = parsed.data;
  const slug = slugify(data.slug || data.title);
  const created = await prisma.gallery.create({
    data: {
      title: data.title,
      slug,
      description: data.description || null,
      date: data.date ? new Date(data.date) : null,
      published: data.published === "on",
      authorId: session.userId,
    },
  });
  revalidatePath("/galerien");
  redirect(`/admin/galleries/${created.id}`);
}

export async function updateGallery(id: string, formData: FormData) {
  await requireSession();
  const parsed = gallerySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const data = parsed.data;
  const slug = slugify(data.slug || data.title);
  await prisma.gallery.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      description: data.description || null,
      date: data.date ? new Date(data.date) : null,
      published: data.published === "on",
    },
  });
  revalidatePath("/galerien");
  revalidatePath(`/galerien/${slug}`);
  redirect(`/admin/galleries/${id}`);
}

export async function deleteGallery(id: string) {
  await requireSession();
  await prisma.gallery.delete({ where: { id } });
  revalidatePath("/galerien");
  redirect("/admin/galleries");
}

export async function uploadImages(galleryId: string, formData: FormData) {
  await requireSession();
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) throw new Error("Galerie nicht gefunden");

  const files = formData.getAll("files") as File[];
  const validFiles = files.filter((f) => f instanceof File && f.size > 0);

  let order = await prisma.image.count({ where: { galleryId } });
  for (const file of validFiles) {
    const { filename } = await saveUpload(file, gallery.slug);
    await prisma.image.create({
      data: {
        galleryId,
        filename,
        alt: gallery.title,
        sortOrder: order++,
      },
    });
  }
  revalidatePath(`/galerien/${gallery.slug}`);
  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath("/admin/media");
}

export async function deleteImage(imageId: string) {
  await requireSession();
  const img = await prisma.image.findUnique({ where: { id: imageId }, include: { gallery: true } });
  if (!img) return;
  await prisma.image.delete({ where: { id: imageId } });
  revalidatePath(`/galerien/${img.gallery.slug}`);
  revalidatePath(`/admin/galleries/${img.galleryId}`);
  revalidatePath("/admin/media");
}

export async function updateImageAlt(imageId: string, formData: FormData) {
  await requireSession();
  const alt = String(formData.get("alt") ?? "").slice(0, 200);
  const img = await prisma.image.update({
    where: { id: imageId },
    data: { alt },
    include: { gallery: true },
  });
  revalidatePath(`/galerien/${img.gallery.slug}`);
  revalidatePath(`/admin/galleries/${img.galleryId}`);
  revalidatePath("/admin/media");
}
