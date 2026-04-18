import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { firstImage } from "@/lib/extract-image";
import { firstLocalImage } from "@/lib/local-image";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Aktuelles",
  description: "Neuigkeiten und Berichte aus der Kolpingsfamilie Ramsen.",
};

export default async function NewsListPage() {
  const session = await getSession();
  const news = await prisma.news.findMany({
    where: session ? {} : { published: true },
    orderBy: { date: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="eyebrow">Aus dem Vereinsleben</div>
      <h1 className="mt-2 font-serif text-3xl md:text-4xl">Aktuelles</h1>
      <p className="text-muted mt-2 mb-8 font-serif italic">
        Neuigkeiten aus der Kolpingsfamilie Ramsen.
      </p>

      {news.length === 0 ? (
        <p className="text-muted">Aktuell sind keine News veröffentlicht.</p>
      ) : (
        <ul className="space-y-6">
          {news.map((n) => {
            const preview = firstLocalImage(n.coverImage ?? firstImage(n.content));
            return (
              <li
                key={n.id}
                className="border-b border-border pb-6 last:border-0"
              >
                <article className="flex gap-5">
                  {preview ? (
                    <Link
                      href={`/aktuelles/${n.slug}`}
                      className="shrink-0 block rounded-md overflow-hidden border border-border hover:border-brand transition"
                    >
                      <Image
                        src={preview}
                        alt=""
                        width={160}
                        height={120}
                        className="w-32 h-24 sm:w-40 sm:h-28 object-cover block"
                      />
                    </Link>
                  ) : (
                    <div
                      aria-hidden
                      className="shrink-0 w-32 h-24 sm:w-40 sm:h-28"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted mb-1 uppercase tracking-wider">
                      <time dateTime={n.date.toISOString()}>
                        {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(
                          n.date,
                        )}
                      </time>
                    </div>
                    <h2 className="font-serif text-xl">
                      <Link
                        href={`/aktuelles/${n.slug}`}
                        className="hover:text-brand-dark"
                      >
                        {n.title}
                      </Link>
                      {!n.published ? (
                        <span className="ml-2 align-middle text-[0.65rem] uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded px-1.5 py-0.5">
                          Entwurf
                        </span>
                      ) : null}
                    </h2>
                    <p className="mt-2 text-muted font-serif line-clamp-2">
                      {n.teaser}
                    </p>
                    <Link
                      href={`/aktuelles/${n.slug}`}
                      className="mt-2 inline-block text-sm text-brand-dark hover:underline"
                    >
                      Weiterlesen →
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
