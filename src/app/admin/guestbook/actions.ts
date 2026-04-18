"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function approveEntry(id: string) {
  await requireSession();
  await prisma.guestbookEntry.update({ where: { id }, data: { approved: true } });
  revalidatePath("/gaestebuch");
  revalidatePath("/admin/guestbook");
  revalidatePath("/admin");
}

export async function deleteEntry(id: string) {
  await requireSession();
  await prisma.guestbookEntry.delete({ where: { id } });
  revalidatePath("/gaestebuch");
  revalidatePath("/admin/guestbook");
  revalidatePath("/admin");
}
