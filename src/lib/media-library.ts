import "server-only";

import { prisma } from "./prisma";
import {
  persistPreparedMedia,
  prepareMediaFile,
  removeManagedUpload,
  withMediaOperationLock,
  type PreparedMedia,
} from "./media-storage";

export type StoredMedia = {
  id: string;
  url: string;
  filename: string;
  alt: string;
};

export async function storeMediaFiles(files: File[]): Promise<StoredMedia[]> {
  if (files.length === 0) throw new Error("Keine Dateien ausgewählt");
  if (files.length > 20) throw new Error("Maximal 20 Dateien pro Upload");
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > 80 * 1024 * 1024) {
    throw new Error("Ein Upload darf insgesamt höchstens 80 MB groß sein");
  }

  // Decode and validate the whole batch before writing a single file. Process
  // sequentially so several high-resolution images cannot exhaust container
  // memory through concurrent Sharp pixel buffers.
  const unique = new Map<string, PreparedMedia>();
  for (const file of files) {
    const item = await prepareMediaFile(file);
    unique.set(item.sha256, item);
  }

  return withMediaOperationLock(async () => {
    const createdPaths: string[] = [];
    try {
      for (const item of unique.values()) {
        const { created } = await persistPreparedMedia(item);
        if (created) createdPaths.push(item.relPath);
      }

      const assets = await prisma.$transaction(
        Array.from(unique.values()).map((item) =>
          prisma.mediaAsset.upsert({
            where: { path: item.relPath },
            update: {
              originalName: item.originalName,
              mimeType: item.mimeType,
              width: item.width,
              height: item.height,
              sizeBytes: item.sizeBytes,
              sha256: item.sha256,
            },
            create: {
              path: item.relPath,
              originalName: item.originalName,
              mimeType: item.mimeType,
              width: item.width,
              height: item.height,
              sizeBytes: item.sizeBytes,
              sha256: item.sha256,
              alt: "",
            },
          }),
        ),
      );

      return assets.map((asset) => ({
        id: asset.id,
        url: `/${asset.path}`,
        filename: asset.path.split("/").at(-1) ?? asset.path,
        alt: asset.alt,
      }));
    } catch (error) {
      // Only remove files that this request created and that no successful DB
      // transaction registered. The cross-process lock keeps this decision
      // from racing another upload or deletion of the same content hash.
      try {
        const registered = new Set(
          (
            await prisma.mediaAsset.findMany({
              where: { path: { in: createdPaths } },
              select: { path: true },
            })
          ).map((asset) => asset.path),
        );
        await Promise.all(
          createdPaths
            .filter((relPath) => !registered.has(relPath))
            .map((relPath) => removeManagedUpload(relPath)),
        );
      } catch {
        // A file without a catalog row is safe and is recovered by media:sync;
        // deleting it after an uncertain DB failure could lose a valid upload.
      }
      throw error;
    }
  });
}
