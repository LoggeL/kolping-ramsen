import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageForm } from "@/components/admin/page-form";
import { OpenLiveLink } from "@/components/admin/open-live-link";
import { buildParentOptions } from "@/lib/page-tree";
import { updatePage, deletePage } from "../actions";

export default async function EditPage(
  { params }: PageProps<"/admin/pages/[id]">,
) {
  if (!(await getSession())) redirect("/admin/login");
  const { id } = await params;
  const item = await prisma.page.findUnique({ where: { id } });
  if (!item) notFound();

  const rows = await prisma.page.findMany({
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  const parentOptions = buildParentOptions(
    rows.map((r) => r.slug),
    item.slug,
  );
  const galleries = await prisma.mediaGroup.findMany({
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Link href="/admin/pages" className="text-sm text-brand-dark">
        ← Zurück
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Seite bearbeiten</h1>
        <OpenLiveLink href={`/${item.slug}`} />
      </div>
      <PageForm
        action={updatePage.bind(null, id)}
        submitLabel="Speichern"
        parentOptions={parentOptions}
        galleryOptions={galleries}
        values={{
          title: item.title,
          slug: item.slug,
          parent: item.parent,
          content: item.content,
          metaTitle: item.metaTitle,
          metaDesc: item.metaDesc,
          sortOrder: item.sortOrder,
          published: item.published,
          gallerySlug: item.gallerySlug,
        }}
      />
      <form
        action={deletePage.bind(null, id)}
        className="mt-8 border-t border-border pt-6"
      >
        <button
          type="submit"
          className="text-sm text-red-700 border border-red-300 rounded-md px-4 py-2 hover:bg-red-50"
        >
          Seite löschen
        </button>
      </form>
    </div>
  );
}
