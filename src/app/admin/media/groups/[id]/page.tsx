import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MediaGroupEditor } from "@/components/admin/media-group-editor";
import { renameGroup, deleteGroup } from "../actions";

export const metadata = {
  title: "Galerie-Gruppe",
  robots: { index: false, follow: false },
};

export default async function MediaGroupDetail(
  { params }: PageProps<"/admin/media/groups/[id]">,
) {
  if (!(await getSession())) redirect("/admin/login");
  const { id } = await params;
  const group = await prisma.mediaGroup.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!group) notFound();

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link
          href="/admin/media/groups"
          className="text-brand-dark hover:underline"
        >
          ← Alle Gruppen
        </Link>
      </div>

      <form
        action={renameGroup.bind(null, group.id)}
        className="flex flex-wrap items-end gap-3 border border-border rounded-md bg-surface p-4"
      >
        <div className="flex-1 min-w-[12rem]">
          <label className="block text-xs font-medium mb-1">Name</label>
          <input
            name="name"
            required
            defaultValue={group.name}
            className="w-full border border-border rounded-md px-3 py-1.5 text-sm"
          />
        </div>
        <div className="min-w-[12rem]">
          <label className="block text-xs font-medium mb-1">Slug</label>
          <input
            name="slug"
            required
            defaultValue={group.slug}
            className="w-full border border-border rounded-md px-3 py-1.5 text-sm font-mono"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand text-white px-4 py-1.5 text-sm font-medium hover:bg-brand-dark"
        >
          Speichern
        </button>
      </form>

      <MediaGroupEditor
        group={{
          id: group.id,
          slug: group.slug,
          name: group.name,
          items: group.items.map((i) => ({
            id: i.id,
            path: i.path,
            sortOrder: i.sortOrder,
          })),
        }}
      />

      <form
        action={deleteGroup.bind(null, group.id)}
        className="border-t border-border pt-6"
      >
        <button
          type="submit"
          className="text-sm text-red-700 border border-red-300 rounded-md px-4 py-2 hover:bg-red-50"
        >
          Gruppe löschen
        </button>
      </form>
    </div>
  );
}
