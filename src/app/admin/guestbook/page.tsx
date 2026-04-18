import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { approveEntry, deleteEntry } from "./actions";

export default async function AdminGuestbookPage() {
  if (!(await getSession())) redirect("/admin/login");
  const [pending, approved] = await Promise.all([
    prisma.guestbookEntry.findMany({ where: { approved: false }, orderBy: { createdAt: "desc" } }),
    prisma.guestbookEntry.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-2">Gästebuch-Moderation</h1>
        <p className="text-muted">Neue Einträge prüfen und freigeben.</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Wartet auf Freigabe ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted text-sm">Keine offenen Einträge.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((e) => (
              <li key={e.id} className="border border-brand bg-brand-soft rounded-lg p-4">
                <div className="flex justify-between items-baseline">
                  <strong>{e.name}</strong>
                  <time className="text-xs text-muted">
                    {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(e.createdAt)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap">{e.message}</p>
                <div className="mt-3 flex gap-2">
                  <form action={approveEntry.bind(null, e.id)}>
                    <button type="submit"
                      className="text-sm rounded-md bg-green-600 text-white px-3 py-1.5 hover:bg-green-700">
                      Freigeben
                    </button>
                  </form>
                  <form action={deleteEntry.bind(null, e.id)}>
                    <button type="submit"
                      className="text-sm rounded-md border border-red-300 text-red-700 px-3 py-1.5 hover:bg-red-50">
                      Löschen
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Freigegeben</h2>
        {approved.length === 0 ? (
          <p className="text-muted text-sm">Noch keine freigegebenen Einträge.</p>
        ) : (
          <ul className="space-y-3">
            {approved.map((e) => (
              <li key={e.id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-baseline">
                  <strong>{e.name}</strong>
                  <time className="text-xs text-muted">
                    {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(e.createdAt)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap">{e.message}</p>
                <form action={deleteEntry.bind(null, e.id)} className="mt-3">
                  <button type="submit"
                    className="text-xs text-red-700 border border-red-200 rounded px-2 py-1 hover:bg-red-50">
                    Löschen
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
