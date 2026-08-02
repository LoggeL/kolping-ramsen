import Image from "next/image";
import Link from "next/link";
import { extractImageUrls } from "@/lib/media-paths";
import { firstLocalImage } from "@/lib/local-image";
import { archivePageHref, pageArchiveExcerpt } from "@/lib/page-archive";

export type PageChildArchiveItem = {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaDesc: string | null;
  archiveDate: Date | null;
};

function previewImage(content: string): string | null {
  return firstLocalImage(extractImageUrls(content)[0]);
}

export function PageChildArchive({
  pages,
  parentPath,
  currentPage,
  totalPages,
  totalCount,
}: {
  pages: PageChildArchiveItem[];
  parentPath: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}) {
  if (pages.length === 0) return null;

  const cards = pages.map((page) => ({
    page,
    excerpt: pageArchiveExcerpt(page),
    image: previewImage(page.content),
  }));

  return (
    <section
      aria-labelledby="page-child-archive-title"
      className="mt-14 border-t border-rule pt-9 sm:mt-16 sm:pt-10"
    >
      <p className="eyebrow">Aus dem Archiv</p>
      <h2
        id="page-child-archive-title"
        className="mt-2 font-serif text-2xl font-semibold sm:text-3xl"
      >
        Weitere Beiträge
      </h2>
      <p className="mt-2 max-w-2xl font-serif leading-relaxed text-muted">
        Berichte, Bilder und Erinnerungen zu diesem Thema.
      </p>
      <p className="mt-3 text-sm font-medium text-muted">
        {totalCount === 1 ? "1 Beitrag" : `${totalCount} Beiträge`}
        {totalPages > 1 ? ` · Seite ${currentPage} von ${totalPages}` : null}
      </p>

      <ul className="mt-6 grid gap-5 sm:grid-cols-2">
        {cards.map(({ page, excerpt, image }) => (
          <li key={page.id}>
            <article className="group flex h-full flex-col overflow-hidden border border-border bg-surface shadow-[0_8px_30px_rgba(31,26,20,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-rule hover:shadow-[0_12px_34px_rgba(31,26,20,0.08)]">
              {image ? (
                <Link
                  href={`/${page.slug}`}
                  aria-label={`Beitrag „${page.title}“ öffnen`}
                  className="relative block aspect-[16/10] overflow-hidden bg-brand-soft"
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 639px) calc(100vw - 2rem), 352px"
                    loading="lazy"
                    decoding="async"
                    unoptimized={image.split(/[?#]/, 1)[0].toLowerCase().endsWith(".svg")}
                    className="object-cover transition duration-300 group-hover:scale-[1.025]"
                  />
                </Link>
              ) : null}

              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-serif text-xl font-semibold leading-snug">
                  <Link
                    href={`/${page.slug}`}
                    className="transition-colors hover:text-brand-dark"
                  >
                    {page.title}
                  </Link>
                </h3>
                {page.archiveDate ? (
                  <time
                    dateTime={page.archiveDate.toISOString().slice(0, 10)}
                    className="mt-2 text-xs font-medium uppercase tracking-wide text-muted"
                  >
                    {new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeZone: "UTC" }).format(page.archiveDate)}
                  </time>
                ) : null}
                {excerpt ? (
                  <p className="mt-3 line-clamp-3 font-serif leading-relaxed text-muted">
                    {excerpt}
                  </p>
                ) : null}
                <Link
                  href={`/${page.slug}`}
                  aria-label={`„${page.title}“ weiterlesen`}
                  className="mt-auto inline-flex min-h-10 items-center pt-4 text-sm font-medium text-brand-dark underline decoration-transparent underline-offset-4 transition hover:decoration-current"
                >
                  Beitrag ansehen <span aria-hidden="true" className="ml-1">→</span>
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {totalPages > 1 ? (
        <nav
          aria-label="Seitennavigation im Archiv"
          className="mt-8 flex items-center justify-between gap-3 border-t border-rule pt-5"
        >
          <span className="flex-1">
            {currentPage > 1 ? (
              <Link
                href={archivePageHref(parentPath, currentPage - 1)}
                rel="prev"
                className="inline-flex min-h-11 items-center text-sm font-medium text-brand-dark underline decoration-transparent underline-offset-4 transition hover:decoration-current"
              >
                <span aria-hidden="true" className="mr-1">←</span> Neuere
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex min-h-11 items-center text-sm font-medium text-muted opacity-50"
              >
                <span aria-hidden="true" className="mr-1">←</span> Neuere
              </span>
            )}
          </span>

          <span aria-current="page" className="shrink-0 text-sm text-muted">
            Seite {currentPage} von {totalPages}
          </span>

          <span className="flex flex-1 justify-end">
            {currentPage < totalPages ? (
              <Link
                href={archivePageHref(parentPath, currentPage + 1)}
                rel="next"
                className="inline-flex min-h-11 items-center text-sm font-medium text-brand-dark underline decoration-transparent underline-offset-4 transition hover:decoration-current"
              >
                Ältere <span aria-hidden="true" className="ml-1">→</span>
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex min-h-11 items-center text-sm font-medium text-muted opacity-50"
              >
                Ältere <span aria-hidden="true" className="ml-1">→</span>
              </span>
            )}
          </span>
        </nav>
      ) : null}
    </section>
  );
}
