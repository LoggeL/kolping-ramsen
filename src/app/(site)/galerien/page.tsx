import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Galerien",
  description: "Bildergalerien der Kolpingsfamilie Ramsen.",
};

export default async function GalleriesPage() {
  const session = await getSession();
  const galleries = await prisma.gallery.findMany({
    where: session ? {} : { published: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Galerien</h1>
      <p className="text-muted mb-8">Bilder aus dem Vereinsleben.</p>

      {galleries.length === 0 ? (
        <p className="text-muted">Noch keine Galerien.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {galleries.map((g) => {
            const cover = g.images[0];
            return (
              <li key={g.id}>
                <Link
                  href={`/galerien/${g.slug}`}
                  className="block group rounded-lg overflow-hidden border border-border hover:border-brand transition"
                >
                  <div className="aspect-[4/3] bg-zinc-100 relative">
                    {cover ? (
                      <Image
                        src={`/uploads/${cover.filename}`}
                        alt={cover.alt || g.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted">
                        Keine Bilder
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="font-semibold group-hover:text-brand-dark">
                      {g.title}
                      {!g.published ? (
                        <span className="ml-2 align-middle text-[0.65rem] uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded px-1.5 py-0.5">
                          Entwurf
                        </span>
                      ) : null}
                    </h2>
                    {g.date ? (
                      <div className="text-xs text-muted mt-1">
                        {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(g.date)}
                      </div>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
