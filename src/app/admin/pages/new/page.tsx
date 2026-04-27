import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageForm } from "@/components/admin/page-form";
import { buildParentOptions } from "@/lib/page-tree";
import { createPage } from "../actions";

export default async function NewPagePage(
  { searchParams }: PageProps<"/admin/pages/new">,
) {
  if (!(await getSession())) redirect("/admin/login");
  const sp = await searchParams;
  const preselectParent =
    typeof sp.parent === "string" ? sp.parent : "";

  const rows = await prisma.page.findMany({
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  const parentOptions = buildParentOptions(rows.map((r) => r.slug));
  const galleries = await prisma.mediaGroup.findMany({
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Link href="/admin/pages" className="text-sm text-brand-dark">
        ← Zurück
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Neue Seite</h1>
      <PageForm
        action={createPage}
        submitLabel="Anlegen"
        parentOptions={parentOptions}
        galleryOptions={galleries}
        values={{ parent: preselectParent }}
      />
    </div>
  );
}
