import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { firstImage } from "@/lib/extract-image";
import { AdminThumb } from "@/components/admin/admin-thumb";

export default async function AdminEventsList() {
  if (!(await getSession())) redirect("/admin/login");
  const events = await prisma.event.findMany({ orderBy: { startDate: "desc" } });
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Termine</h1>
        <Link href="/admin/events/new"
          className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark">
          + Neuer Termin
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="text-muted">Noch keine Termine vorhanden.</p>
      ) : (
        <table className="w-full text-sm border border-border rounded-md overflow-hidden">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <th className="px-3 py-2 w-20">Bild</th>
              <th className="px-3 py-2">Titel</th>
              <th className="px-3 py-2">Datum</th>
              <th className="px-3 py-2">Kategorie</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const thumb = firstImage(e.description);
              return (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <AdminThumb src={thumb} alt={e.title} />
                  </td>
                  <td className="px-3 py-2">{e.title}</td>
                  <td className="px-3 py-2">
                    {new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(e.startDate)}
                  </td>
                  <td className="px-3 py-2">{e.category}</td>
                  <td className="px-3 py-2">
                    {e.published ? <span className="text-green-700">veröffentlicht</span> : <span className="text-muted">Entwurf</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/admin/events/${e.id}`} className="text-brand-dark hover:underline">
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
