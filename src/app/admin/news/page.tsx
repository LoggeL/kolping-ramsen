import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { firstImage } from "@/lib/extract-image";
import { AdminThumb } from "@/components/admin/admin-thumb";

export default async function AdminNewsList() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const news = await prisma.news.findMany({
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">News</h1>
        <Link
          href="/admin/news/new"
          className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark"
        >
          + Neue News
        </Link>
      </div>
      {news.length === 0 ? (
        <p className="text-muted">Noch keine News vorhanden.</p>
      ) : (
        <table className="w-full text-sm border border-border rounded-md overflow-hidden">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <th className="px-3 py-2 w-20">Bild</th>
              <th className="px-3 py-2">Titel</th>
              <th className="px-3 py-2">Datum</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {news.map((n) => {
              const thumb = n.coverImage ?? firstImage(n.content);
              return (
                <tr key={n.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <AdminThumb src={thumb} alt={n.title} />
                  </td>
                  <td className="px-3 py-2">{n.title}</td>
                  <td className="px-3 py-2">
                    {new Intl.DateTimeFormat("de-DE").format(n.date)}
                  </td>
                  <td className="px-3 py-2">
                    {n.published ? (
                      <span className="text-green-700">veröffentlicht</span>
                    ) : (
                      <span className="text-muted">Entwurf</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/news/${n.id}`}
                      className="text-brand-dark hover:underline"
                    >
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
