import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Markdown } from "@/components/markdown";
import { DraftBanner } from "@/components/draft-banner";
import { isReservedContentSlug } from "@/lib/legacy-routing";
import { findPublishedRedirect } from "@/lib/legacy-redirect";
import {
  cleanLegacyMetaDescription,
  preparePublicMarkdown,
} from "@/lib/public-content";

async function loadPage(slug: string) {
  if (isReservedContentSlug(slug)) return null;
  return prisma.page.findUnique({ where: { slug } });
}

export async function generateMetadata(
  { params }: PageProps<"/[...slug]">,
): Promise<Metadata> {
  const { slug } = await params;
  const path = slug.join("/");
  const page = await loadPage(path);
  if (!page) return { title: "Nicht gefunden" };
  return {
    title: page.metaTitle ?? page.title,
    description: cleanLegacyMetaDescription(page.metaDesc),
  };
}

export default async function CmsPage(
  { params, searchParams }: PageProps<"/[...slug]">,
) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const path = slug.join("/");
  const requestPath = `/${path}`;

  const redirectTarget = await findPublishedRedirect(requestPath, query);
  if (redirectTarget) redirect(redirectTarget);

  const page = await loadPage(path);
  if (!page) notFound();
  const session = await getSession();
  if (!page.published && !session) notFound();

  const content = preparePublicMarkdown(page.content, page.title);
  const source = page.gallerySlug
    ? `${content}\n\n::gallery[${page.gallerySlug}]::\n`
    : content;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {!page.published ? <DraftBanner /> : null}
      <h1 className="text-3xl md:text-4xl font-bold mb-6">{page.title}</h1>
      <Markdown source={source} />
    </article>
  );
}
