import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { IconPlus } from "@/components/admin/icons";
import { createGroup } from "./actions";

export const metadata = {
  title: "Galerie-Gruppen",
  robots: { index: false, follow: false },
};

export default async function MediaGroupsList() {
  if (!(await getSession())) redirect("/admin/login");
  const groups = await prisma.mediaGroup.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        take: 4,
        include: { asset: { select: { path: true, alt: true } } },
      },
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm">
            <Link href="/admin/media" className="text-brand-dark hover:underline">
              ← Zurück zur Mediathek
            </Link>
          </div>
          <h1 className="text-2xl font-bold mt-2">Galerie-Gruppen</h1>
          <p className="text-sm text-muted mt-1">
            Bündele Bilder aus der Mediathek zu wiederverwendbaren
            Mini-Galerien. In Seiten &amp; News einfügbar per{" "}
            <code className="bg-brand-soft px-1 rounded">
              ::gallery[slug]::
            </code>
            .
          </p>
        </div>
      </header>

      <section
        aria-label="Neue Gruppe anlegen"
        className="border border-border rounded-md bg-surface p-4"
      >
        <h2 className="font-semibold mb-2">Neue Gruppe</h2>
        <form
          action={createGroup}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[14rem]">
            <label className="block text-xs font-medium mb-1">Name</label>
            <input
              name="name"
              required
              placeholder="z.B. Prunksitzung 2026"
              className="w-full border border-border rounded-md px-3 py-1.5 text-sm"
            />
          </div>
          <div className="min-w-[12rem]">
            <label className="block text-xs font-medium mb-1">
              Slug (optional)
            </label>
            <input
              name="slug"
              placeholder="prunksitzung-2026"
              className="w-full border border-border rounded-md px-3 py-1.5 text-sm font-mono"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand text-white px-4 py-1.5 text-sm font-medium hover:bg-brand-dark"
          >
            <IconPlus width={14} height={14} />
            Anlegen
          </button>
        </form>
      </section>

      {groups.length === 0 ? (
        <p className="text-muted">Noch keine Gruppen.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <li
              key={g.id}
              className="border border-border rounded-md overflow-hidden bg-surface hover:border-brand transition"
            >
              <Link href={`/admin/media/groups/${g.id}`} className="block">
                <div className="grid grid-cols-2 gap-px bg-rule aspect-[4/3]">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const item = g.items[i];
                    return (
                      <div
                        key={i}
                        className="bg-surface flex items-center justify-center overflow-hidden"
                      >
                        {item ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={`/${item.asset.path}`}
                            alt={item.alt ?? item.asset.alt}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="p-3">
                  <div className="font-medium truncate">{g.name}</div>
                  <div className="text-xs text-muted font-mono truncate">
                    {g.slug} · {g._count.items} Bilder
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
