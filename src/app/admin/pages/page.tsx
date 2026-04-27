import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { firstImage } from "@/lib/extract-image";
import { firstLocalImage } from "@/lib/local-image";
import { IconPlus } from "@/components/admin/icons";
import { PagesTree, type PageTreeItem } from "@/components/admin/pages-tree";

export default async function AdminPagesList() {
  if (!(await getSession())) redirect("/admin/login");
  const rows = await prisma.page.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      published: true,
      sortOrder: true,
      content: true,
    },
  });
  const pages: PageTreeItem[] = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    published: p.published,
    sortOrder: p.sortOrder,
    firstImage: firstLocalImage(firstImage(p.content)),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Seiten</h1>
        <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark"
        >
          <IconPlus width={14} height={14} />
          Neue Seite
        </Link>
      </div>

      {pages.length === 0 ? (
        <p className="text-muted">Noch keine Seiten vorhanden.</p>
      ) : (
        <PagesTree pages={pages} />
      )}
    </div>
  );
}
