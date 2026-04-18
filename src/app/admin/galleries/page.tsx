import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminThumb } from "@/components/admin/admin-thumb";

export default async function AdminGalleriesList() {
  if (!(await getSession())) redirect("/admin/login");
  const galleries = await prisma.gallery.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { images: true } },
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { filename: true } },
    },
  });
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Galerien</h1>
        <Link href="/admin/galleries/new"
          className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark">
          + Neue Galerie
        </Link>
      </div>
      {galleries.length === 0 ? (
        <p className="text-muted">Noch keine Galerien.</p>
      ) : (
        <table className="w-full text-sm border border-border rounded-md overflow-hidden">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <th className="px-3 py-2 w-20">Bild</th>
              <th className="px-3 py-2">Titel</th>
              <th className="px-3 py-2">Bilder</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {galleries.map((g) => {
              const cover = g.images[0];
              const thumb = cover ? `/uploads/${cover.filename}` : null;
              return (
                <tr key={g.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <AdminThumb src={thumb} alt={g.title} />
                  </td>
                  <td className="px-3 py-2">{g.title}</td>
                  <td className="px-3 py-2">{g._count.images}</td>
                  <td className="px-3 py-2">
                    {g.published ? <span className="text-green-700">veröffentlicht</span> : <span className="text-muted">Entwurf</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/admin/galleries/${g.id}`} className="text-brand-dark hover:underline">
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
