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
  const newsWithPreviews = news.map((item) => ({
    item,
    preview: firstLocalImage(item.coverImage ?? firstImage(item.content)),
  }));
  const firstPreviewIndex = newsWithPreviews.findIndex(({ preview }) => preview !== null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="eyebrow">Aus dem Vereinsleben</div>
      <h1 className="mt-2 font-serif text-3xl md:text-4xl">Aktuelles</h1>
      <p className="mb-8 mt-2 max-w-2xl font-serif text-lg italic text-muted sm:mb-10">
        Neuigkeiten aus der Kolpingsfamilie Ramsen.
      </p>

      {news.length === 0 ? (
        <p className="text-muted">Aktuell sind keine News veröffentlicht.</p>
      ) : (
        <ul className="space-y-5">
          {newsWithPreviews.map(({ item: n, preview }, index) => {
            return (
              <li key={n.id}>
                <article
                  className={`group overflow-hidden border border-border bg-surface shadow-[0_8px_30px_rgba(31,26,20,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-rule hover:shadow-[0_12px_34px_rgba(31,26,20,0.08)] ${
                    preview ? "sm:grid sm:grid-cols-[14rem_minmax(0,1fr)]" : ""
                  }`}
                >
                  {preview ? (
                    <Link
                      href={`/aktuelles/${n.slug}`}
                      aria-label={`Beitrag „${n.title}“ lesen`}
                      className="relative block aspect-[16/9] overflow-hidden bg-brand-soft sm:h-full sm:min-h-52 sm:aspect-auto"
                    >
                      <Image
                        src={preview}
                        alt=""
                        fill
                        sizes="(max-width: 639px) calc(100vw - 2rem), 224px"
                        loading={index === firstPreviewIndex ? "eager" : "lazy"}
                        decoding="async"
                        className="object-cover transition duration-300 group-hover:scale-[1.025]"
                      />
                    </Link>
                  ) : null}
                  <div className="min-w-0 p-5 sm:p-6">
                    <div className="mb-2 text-xs uppercase tracking-[0.13em] text-muted">
                      <time dateTime={n.date.toISOString()}>
                        {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(
                          n.date,
                        )}
                      </time>
                    </div>
                    <h2 className="font-serif text-xl font-semibold leading-snug sm:text-2xl">
                      <Link
                        href={`/aktuelles/${n.slug}`}
                        className="transition-colors hover:text-brand-dark"
                      >
                        {n.title}
                      </Link>
                      {!n.published ? (
                        <span className="ml-2 inline-block border border-amber-300 bg-amber-100 px-1.5 py-0.5 align-middle text-[0.65rem] uppercase tracking-wider text-amber-900">
                          Entwurf
                        </span>
                      ) : null}
                    </h2>
                    <p className="mt-3 line-clamp-3 font-serif leading-relaxed text-muted">
                      {n.teaser}
                    </p>
                    <Link
                      href={`/aktuelles/${n.slug}`}
                      aria-label={`„${n.title}“ weiterlesen`}
                      className="mt-4 inline-flex min-h-10 items-center text-sm font-medium text-brand-dark underline decoration-transparent underline-offset-4 transition hover:decoration-current"
                    >
                      Weiterlesen <span aria-hidden="true" className="ml-1">→</span>
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
