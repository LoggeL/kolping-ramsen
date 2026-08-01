import "server-only";

import { prisma } from "./prisma";

export type CatalogMediaFile = {
  id: string;
  url: string;
  relPath: string;
  bucket: string;
  filename: string;
  size: number;
  mtime: Date;
  managed: boolean;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
};

/**
 * Return the media catalog populated during deployment and on every upload.
 *
 * Runtime directory walks made Next's file tracer pull the whole project into
 * route bundles. Keeping filesystem discovery in the prestart sync gives the
 * application one stable, queryable source of truth instead.
 */
export async function listMediaFiles(): Promise<CatalogMediaFile[]> {
  const assets = await prisma.mediaAsset.findMany({
    where: { sizeBytes: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      path: true,
      sizeBytes: true,
      updatedAt: true,
      alt: true,
      caption: true,
      width: true,
      height: true,
      mimeType: true,
    },
  });

  return assets.map((asset) => {
    const segments = asset.path.split("/");
    return {
      id: asset.id,
      url: `/${asset.path}`,
      relPath: asset.path,
      bucket: segments.slice(0, -1).join("/"),
      filename: segments.at(-1) ?? asset.path,
      size: asset.sizeBytes ?? 0,
      mtime: asset.updatedAt,
      managed: asset.path.startsWith("uploads/"),
      alt: asset.alt,
      caption: asset.caption,
      width: asset.width,
      height: asset.height,
      mimeType: asset.mimeType,
    };
  });
}
