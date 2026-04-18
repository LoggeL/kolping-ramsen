import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { firstImage } from "@/lib/extract-image";
import { AdminThumb } from "@/components/admin/admin-thumb";
import { movePage } from "./actions";

export default async function AdminPagesList() {
  if (!(await getSession())) redirect("/admin/login");
  const pages = await prisma.page.findMany({
    orderBy: [{ parent: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
  });

  // group by parent so up/down only swaps siblings
  const groups = new Map<string, typeof pages>();
  for (const p of pages) {
    const k = p.parent ?? "";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(p);
  }
  const orderedGroups = Array.from(groups.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Seiten</h1>
        <Link
          href="/admin/pages/new"
          className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark"
        >
          + Neue Seite
        </Link>
      </div>

      {pages.length === 0 ? (
        <p className="text-muted">Noch keine Seiten vorhanden.</p>
      ) : (
        <div className="space-y-8">
          {orderedGroups.map(([parent, items]) => (
            <section key={parent}>
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted mb-2">
                {parent ? `/${parent}` : "Top-Ebene"}
                <span className="ml-2 text-xs font-normal normal-case">
                  ({items.length})
                </span>
              </h2>
              <ul className="border border-border rounded-md overflow-hidden divide-y divide-border bg-surface">
                {items.map((p, i) => {
                  const thumb = firstImage(p.content);
                  const isFirst = i === 0;
                  const isLast = i === items.length - 1;
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <form action={movePage.bind(null, p.id, "up")}>
                          <button
                            type="submit"
                            aria-label="Nach oben"
                            disabled={isFirst}
                            className="w-7 h-5 text-xs rounded border border-border hover:border-brand hover:bg-brand-soft disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            ▲
                          </button>
                        </form>
                        <form action={movePage.bind(null, p.id, "down")}>
                          <button
                            type="submit"
                            aria-label="Nach unten"
                            disabled={isLast}
                            className="w-7 h-5 text-xs rounded border border-border hover:border-brand hover:bg-brand-soft disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            ▼
                          </button>
                        </form>
                      </div>
                      <AdminThumb src={thumb} alt={p.title} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{p.title}</div>
                        <div className="text-xs text-muted font-mono truncate">
                          /{p.slug}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-xs rounded-full px-2 py-0.5 border ${
                          p.published
                            ? "text-green-800 border-green-300 bg-green-50"
                            : "text-amber-900 border-amber-300 bg-amber-50"
                        }`}
                      >
                        {p.published ? "veröffentlicht" : "Entwurf"}
                      </span>
                      <Link
                        href={`/admin/pages/${p.id}`}
                        className="shrink-0 text-sm text-brand-dark hover:underline"
                      >
                        Bearbeiten
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
