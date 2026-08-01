"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  isManagedUpload,
  normalizeMediaPath,
  stageManagedUploadDeletion,
  withMediaOperationLock,
} from "@/lib/media-storage";
import { buildReferenceMap, mediaReferenceKey } from "@/lib/media-references";

function broadRevalidate() {
  revalidatePath("/admin/media");
  revalidatePath("/", "layout");
}

export async function updateMediaAlt(relPath: string, formData: FormData) {
  await requireSession();
  const normalized = normalizeMediaPath(relPath);
  const alt = String(formData.get("alt") ?? "").slice(0, 250).trim();
  const caption = String(formData.get("caption") ?? "").slice(0, 500).trim();

  const result = await prisma.mediaAsset.updateMany({
    where: { path: normalized },
    data: { alt, caption: caption || null },
  });
  if (result.count !== 1) throw new Error("Bild nicht im Medienkatalog gefunden.");
  revalidatePath("/admin/media");
  revalidatePath("/", "layout");
}

export async function deleteMediaFile(relPath: string) {
  await requireSession();
  const normalized = normalizeMediaPath(relPath);
  if (!isManagedUpload(normalized)) {
    throw new Error("Versionierte Website-Bilder können nicht in der Mediathek gelöscht werden.");
  }

  await withMediaOperationLock(async () => {
    const referenceMap = await buildReferenceMap();
    const references = referenceMap.get(mediaReferenceKey(normalized)) ?? [];
    if (references.length > 0) {
      throw new Error(`Das Bild wird noch ${references.length}-mal verwendet.`);
    }

    const staged = await stageManagedUploadDeletion(normalized);
    try {
      await prisma.mediaAsset.deleteMany({ where: { path: normalized } });
      await staged?.commit();
    } catch (error) {
      await staged?.rollback();
      throw error;
    }
  });
  broadRevalidate();
}
