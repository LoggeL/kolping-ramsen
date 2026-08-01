import Link from "next/link";
import type { Metadata } from "next";
import {
  SITE_SECTIONS,
  type SiteSectionKey,
} from "@/lib/site";

export function sectionOverviewMetadata(sectionKey: SiteSectionKey): Metadata {
  const section = SITE_SECTIONS[sectionKey];

  return {
    title: section.label,
    description: section.description,
  };
}

export function SectionOverview({
  sectionKey,
}: {
  sectionKey: SiteSectionKey;
}) {
  const section = SITE_SECTIONS[sectionKey];

  return (
    <article className="mx-auto max-w-5xl px-4 py-12">
      <header className="max-w-3xl mb-10">
        <p className="eyebrow mb-3">{section.eyebrow}</p>
        <h1 className="text-3xl md:text-4xl font-bold">{section.label}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          {section.description}
        </p>
      </header>

      <nav aria-label={`${section.label}: Themen`}>
        <ul className="grid gap-4 md:grid-cols-2">
          {section.links.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group block h-full rounded-lg border border-border bg-surface p-5 transition-colors hover:border-brand hover:bg-brand-soft"
              >
                <span className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block font-serif text-xl font-semibold text-foreground group-hover:text-brand-dark">
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="mt-2 block leading-relaxed text-muted">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  <span
                    aria-hidden
                    className="mt-1 shrink-0 text-xl text-brand-dark transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
