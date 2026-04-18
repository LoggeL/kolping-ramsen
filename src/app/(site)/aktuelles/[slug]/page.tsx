import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { getSession } from "@/lib/session";
import { Markdown } from "@/components/markdown";
import { DraftBanner } from "@/components/draft-banner";

export async function generateMetadata(
  { params }: PageProps<"/aktuelles/[slug]">,
): Promise<Metadata> {
  const { slug } = await params;
  const item = await prisma.news.findUnique({ where: { slug } });
  if (!item) return { title: "Nicht gefunden" };
  return {
    title: item.title,
    description: item.teaser,
    openGraph: {
      title: item.title,
      description: item.teaser,
      type: "article",
      publishedTime: item.date.toISOString(),
    },
  };
}

export default async function NewsDetailPage(
  { params }: PageProps<"/aktuelles/[slug]">,
) {
  const { slug } = await params;
  const item = await prisma.news.findUnique({
    where: { slug },
    include: { author: true },
  });
  if (!item) notFound();
  const session = await getSession();
  if (!item.published && !session) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.title,
    datePublished: item.date.toISOString(),
    author: item.author?.name ?? SITE.name,
    publisher: {
      "@type": "Organization",
      name: SITE.name,
    },
    description: item.teaser,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/aktuelles" className="text-sm text-brand-dark hover:underline">
        ← Zurück zur Übersicht
      </Link>
      {!item.published ? <DraftBanner label="News-Entwurf" /> : null}
      <header className="mt-4 mb-8">
        <div className="text-sm text-muted">
          <time dateTime={item.date.toISOString()}>
            {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(item.date)}
          </time>
          {item.author ? <> · {item.author.name}</> : null}
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold">{item.title}</h1>
        <p className="mt-3 text-lg text-muted">{item.teaser}</p>
      </header>
      <Markdown source={item.content} />
    </article>
  );
}
