import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scanMedia } from "@/lib/media-scan";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    newsTotal,
    newsPublished,
    newsRecent30,
    eventTotal,
    eventUpcoming,
    pageTotal,
    pagePublished,
    guestApproved,
    guestPending,
    recentNews,
    upcomingEvents,
    pendingGuestbookEntries,
    media,
    hitsToday,
    hits7d,
  ] = await Promise.all([
    prisma.news.count(),
    prisma.news.count({ where: { published: true } }),
    prisma.news.count({ where: { createdAt: { gte: last30 } } }),
    prisma.event.count(),
    prisma.event.count({ where: { startDate: { gte: now } } }),
    prisma.page.count(),
    prisma.page.count({ where: { published: true } }),
    prisma.guestbookEntry.count({ where: { approved: true } }),
    prisma.guestbookEntry.count({ where: { approved: false } }),
    prisma.news.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, slug: true, title: true, updatedAt: true, published: true },
    }),
    prisma.event.findMany({
      where: { startDate: { gte: now } },
      orderBy: { startDate: "asc" },
      take: 5,
      select: { id: true, slug: true, title: true, startDate: true, location: true },
    }),
    prisma.guestbookEntry.findMany({
      where: { approved: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, message: true, createdAt: true },
    }),
    scanMedia(),
    prisma.pageHit.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.pageHit.count({ where: { createdAt: { gte: start7d } } }),
  ]);

  const mediaSize = media.reduce((s, f) => s + f.size, 0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Willkommen, {session.name}</h1>
        <p className="text-muted mt-1">Übersicht der redaktionellen Inhalte.</p>
      </div>

      <section aria-label="Kennzahlen">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="News"
            value={newsTotal}
            sub={`${newsPublished} veröffentlicht · ${newsRecent30} neu (30 T.)`}
            href="/admin/news"
          />
          <StatCard
            label="Termine"
            value={eventTotal}
            sub={`${eventUpcoming} bevorstehend`}
            href="/admin/events"
          />
          <StatCard
            label="Seiten"
            value={pageTotal}
            sub={`${pagePublished} veröffentlicht`}
            href="/admin/pages"
          />
          <StatCard
            label="Mediathek"
            value={media.length}
            sub={formatBytes(mediaSize)}
            href="/admin/media"
          />
          <StatCard
            label="Gästebuch"
            value={guestApproved + guestPending}
            sub={`${guestPending} unmoderiert`}
            href="/admin/guestbook"
            highlight={guestPending > 0}
          />
        </div>
      </section>

      <section
        aria-label="Aufrufe"
        className="rounded-md border border-border bg-surface p-4 flex flex-wrap items-baseline justify-between gap-3"
      >
        <div className="flex flex-wrap gap-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">
              Aufrufe heute
            </div>
            <div className="text-2xl font-semibold">
              {hitsToday.toLocaleString("de-DE")}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">
              Aufrufe letzte 7 Tage
            </div>
            <div className="text-2xl font-semibold">
              {hits7d.toLocaleString("de-DE")}
            </div>
          </div>
        </div>
        <Link
          href="/admin/analytics"
          className="text-sm text-brand-dark hover:underline"
        >
          Vollständige Statistik →
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Zuletzt bearbeitete News"
          empty="Noch keine News."
          href="/admin/news"
          hrefLabel="Alle News"
        >
          {recentNews.length > 0 && (
            <ul className="divide-y divide-border">
              {recentNews.map((n) => (
                <li key={n.id} className="py-2 flex items-baseline gap-3">
                  <Link
                    href={`/admin/news/${n.id}`}
                    className="flex-1 truncate hover:text-brand-dark"
                  >
                    {n.title}
                  </Link>
                  {!n.published && (
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted border border-border rounded px-1.5">
                      Entwurf
                    </span>
                  )}
                  <time className="text-xs text-muted shrink-0">
                    {new Intl.DateTimeFormat("de-DE", {
                      dateStyle: "short",
                    }).format(n.updatedAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Nächste Termine"
          empty="Keine bevorstehenden Termine."
          href="/admin/events"
          hrefLabel="Alle Termine"
        >
          {upcomingEvents.length > 0 && (
            <ul className="divide-y divide-border">
              {upcomingEvents.map((e) => (
                <li key={e.id} className="py-2 flex items-baseline gap-3">
                  <Link
                    href={`/admin/events/${e.id}`}
                    className="flex-1 truncate hover:text-brand-dark"
                  >
                    {e.title}
                    {e.location ? (
                      <span className="text-xs text-muted ml-2 italic">
                        {e.location}
                      </span>
                    ) : null}
                  </Link>
                  <time className="text-xs text-muted shrink-0">
                    {new Intl.DateTimeFormat("de-DE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(e.startDate)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      {pendingGuestbookEntries.length > 0 && (
        <section>
          <Panel
            title={`Unmoderierte Gästebucheinträge (${guestPending})`}
            empty=""
            href="/admin/guestbook"
            hrefLabel="Moderieren"
            tone="warn"
          >
            <ul className="divide-y divide-border">
              {pendingGuestbookEntries.map((g) => (
                <li key={g.id} className="py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{g.name}</span>
                    <time className="text-xs text-muted">
                      {new Intl.DateTimeFormat("de-DE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(g.createdAt)}
                    </time>
                  </div>
                  <p className="text-sm text-muted mt-0.5 line-clamp-2">
                    {g.message}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
  highlight,
}: {
  label: string;
  value: number;
  sub?: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-md border p-4 hover:border-brand transition ${
        highlight ? "border-brand bg-brand-soft" : "border-border bg-surface"
      }`}
    >
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {sub ? <div className="text-xs text-muted mt-1">{sub}</div> : null}
    </Link>
  );
}

function Panel({
  title,
  empty,
  href,
  hrefLabel,
  tone,
  children,
}: {
  title: string;
  empty: string;
  href: string;
  hrefLabel: string;
  tone?: "warn";
  children: React.ReactNode;
}) {
  const hasChildren =
    Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div
      className={`rounded-md border p-4 bg-surface ${
        tone === "warn" ? "border-brand" : "border-border"
      }`}
    >
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="font-semibold">{title}</h2>
        <Link href={href} className="text-xs text-brand-dark hover:underline">
          {hrefLabel} →
        </Link>
      </div>
      {hasChildren ? children : <p className="text-sm text-muted">{empty}</p>}
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
