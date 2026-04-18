"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { slugify } from "@/lib/slug";

const eventSchema = z.object({
  title: z.string().min(2).max(200).trim(),
  slug: z.string().max(140).trim().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  location: z.string().max(200).optional(),
  description: z.string().min(2),
  category: z.enum(["alle", "jugend", "familie", "verein"]),
  published: z.string().optional(),
});

export async function createEvent(formData: FormData) {
  const session = await requireSession();
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const data = parsed.data;
  const slug = slugify(data.slug || data.title);
  await prisma.event.create({
    data: {
      title: data.title,
      slug,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      location: data.location || null,
      description: data.description,
      category: data.category,
      published: data.published === "on",
      authorId: session.userId,
    },
  });
  revalidatePath("/termine");
  revalidatePath("/");
  redirect("/admin/events");
}

export async function updateEvent(id: string, formData: FormData) {
  await requireSession();
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validierung fehlgeschlagen");
  const data = parsed.data;
  const slug = slugify(data.slug || data.title);
  await prisma.event.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      location: data.location || null,
      description: data.description,
      category: data.category,
      published: data.published === "on",
    },
  });
  revalidatePath("/termine");
  revalidatePath(`/termine/${slug}`);
  revalidatePath("/");
  redirect("/admin/events");
}

export async function deleteEvent(id: string) {
  await requireSession();
  await prisma.event.delete({ where: { id } });
  revalidatePath("/termine");
  revalidatePath("/");
  redirect("/admin/events");
}
