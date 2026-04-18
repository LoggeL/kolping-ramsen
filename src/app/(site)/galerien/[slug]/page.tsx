import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Lightbox } from "@/components/lightbox";
import { DraftBanner } from "@/components/draft-banner";

export async function generateMetadata(
  { params }: PageProps<"/galerien/[slug]">,
): Promise<Metadata> {
  const { slug } = await params;
  const g = await prisma.gallery.findUnique({ where: { slug } });
  if (!g) return { title: "Nicht gefunden" };
  return { title: g.title, description: g.description ?? undefined };
}

export default async function GalleryPage(
  { params }: PageProps<"/galerien/[slug]">,
) {
  const { slug } = await params;
  const gallery = await prisma.gallery.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!gallery) notFound();
  const session = await getSession();
  if (!gallery.published && !session) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href="/galerien" className="text-sm text-brand-dark hover:underline">
        ← Alle Galerien
      </Link>
      {!gallery.published ? <DraftBanner label="Galerie-Entwurf" /> : null}
      <h1 className="mt-3 text-3xl md:text-4xl font-bold">{gallery.title}</h1>
      {gallery.date ? (
        <div className="text-sm text-muted mt-1">
          {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(gallery.date)}
        </div>
      ) : null}
      {gallery.description ? (
        <p className="mt-4 text-muted max-w-2xl">{gallery.description}</p>
      ) : null}

      {gallery.images.length === 0 ? (
        <p className="mt-8 text-muted">Diese Galerie enthält noch keine Bilder.</p>
      ) : (
        <Lightbox
          images={gallery.images.map((img) => ({
            src: `/uploads/${img.filename}`,
            alt: img.alt,
          }))}
        />
      )}
    </div>
  );
}
