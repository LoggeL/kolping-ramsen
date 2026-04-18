import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Markdown } from "@/components/markdown";
import { DraftBanner } from "@/components/draft-banner";

const RESERVED = new Set([
  "admin",
  "aktuelles",
  "termine",
  "termine.ics",
  "kontakt",
  "gaestebuch",
  "api",
]);

async function loadPage(slug: string) {
  if (RESERVED.has(slug.split("/")[0])) return null;
  return prisma.page.findUnique({ where: { slug } });
}

async function loadRedirect(path: string) {
  return prisma.redirect.findUnique({ where: { fromPath: path } });
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
    description: page.metaDesc ?? undefined,
  };
}

export default async function CmsPage(
  { params }: PageProps<"/[...slug]">,
) {
  const { slug } = await params;
  const path = slug.join("/");

  const redirectEntry = await loadRedirect("/" + path);
  if (redirectEntry) redirect(redirectEntry.toPath);

  const page = await loadPage(path);
  if (!page) notFound();
  const session = await getSession();
  if (!page.published && !session) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {!page.published ? <DraftBanner /> : null}
      <h1 className="text-3xl md:text-4xl font-bold mb-6">{page.title}</h1>
      <Markdown source={page.content} />
    </article>
  );
}
