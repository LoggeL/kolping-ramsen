import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Statistik",
  robots: { index: false, follow: false },
};

const RANGE_OPTIONS = [
  { key: "7d", label: "7 Tage", days: 7 },
  { key: "30d", label: "30 Tage", days: 30 },
  { key: "90d", label: "90 Tage", days: 90 },
] as const;

type RangeKey = (typeof RANGE_OPTIONS)[number]["key"];

function pickRange(value: unknown): (typeof RANGE_OPTIONS)[number] {
  return RANGE_OPTIONS.find((r) => r.key === value) ?? RANGE_OPTIONS[1];
}

export default async function AnalyticsPage(
  { searchParams }: PageProps<"/admin/analytics">,
) {
  if (!(await getSession())) redirect("/admin/login");
  const sp = await searchParams;
  const range = pickRange(sp.range);

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startRange = new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000);

  const [
    totalAll,
    totalToday,
    total7d,
    totalRange,
    hitsInRange,
    topPagesRaw,
    topReferrersRaw,
    hourlyRaw,
  ] = await Promise.all([
    prisma.pageHit.count(),
    prisma.pageHit.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.pageHit.count({ where: { createdAt: { gte: start7d } } }),
    prisma.pageHit.count({ where: { createdAt: { gte: startRange } } }),
    prisma.pageHit.findMany({
      where: { createdAt: { gte: startRange } },
      select: { createdAt: true },
    }),
    prisma.pageHit.groupBy({
      by: ["path"],
      where: { createdAt: { gte: startRange } },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.pageHit.groupBy({
      by: ["referrer"],
      where: { createdAt: { gte: startRange }, referrer: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { referrer: "desc" } },
      take: 10,
    }),
    prisma.pageHit.findMany({
      where: { createdAt: { gte: startOfToday } },
      select: { createdAt: true },
    }),
  ]);

  const dailyBuckets = buildDailyBuckets(startRange, now);
  for (const h of hitsInRange) {
    const key = dayKey(h.createdAt);
    if (key in dailyBuckets) dailyBuckets[key]++;
  }
  const dailySeries = Object.entries(dailyBuckets);
  const dailyMax = Math.max(1, ...dailySeries.map(([, v]) => v));

  const hourlyBuckets = new Array(24).fill(0) as number[];
  for (const h of hourlyRaw) hourlyBuckets[h.createdAt.getHours()]++;
  const hourlyMax = Math.max(1, ...hourlyBuckets);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Statistik</h1>
          <p className="text-sm text-muted mt-1">
            Anonymisierte Seitenaufrufe (kein IP, kein User-Agent, kein
            Cookie). Aufrufe von angemeldeten Redakteur:innen werden nicht
            erfasst.
          </p>
        </div>
        <RangeSwitcher current={range.key} />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Stat label="Heute" value={totalToday} />
        <Stat label="7 Tage" value={total7d} />
        <Stat label={range.label} value={totalRange} />
        <Stat label="Gesamt" value={totalAll} />
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold">Aufrufe pro Tag</h2>
          <span className="text-xs text-muted">{range.label}</span>
        </div>
        <div className="border border-border rounded-md p-4 bg-surface">
          {dailySeries.length === 0 ? (
            <p className="text-sm text-muted">Keine Daten.</p>
          ) : (
            <div className="flex items-end gap-1 h-40 overflow-x-auto">
              {dailySeries.map(([key, count]) => (
                <div
                  key={key}
                  className="flex flex-col items-center gap-1 min-w-[14px] flex-1"
                  title={`${key}: ${count}`}
                >
                  <div
                    className="w-full bg-brand/80 rounded-sm"
                    style={{
                      height: `${(count / dailyMax) * 100}%`,
                      minHeight: count > 0 ? "4px" : "2px",
                      opacity: count > 0 ? 1 : 0.2,
                    }}
                    aria-label={`${count} Aufrufe am ${key}`}
                  />
                  {(range.days <= 30 ||
                    new Date(key).getDate() === 1) ? (
                    <div className="text-[0.6rem] text-muted whitespace-nowrap">
                      {formatDayShort(key)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel
          title={`Top-Seiten (${range.label})`}
          empty="Noch keine Aufrufe."
        >
          {topPagesRaw.length > 0 && (
            <ol className="text-sm divide-y divide-border">
              {topPagesRaw.map((p, i) => (
                <li
                  key={p.path}
                  className="py-2 flex items-baseline gap-3"
                >
                  <span className="text-muted text-xs w-5 text-right shrink-0">
                    {i + 1}.
                  </span>
                  <Link
                    href={p.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate hover:text-brand-dark font-mono text-xs"
                    title={p.path}
                  >
                    {p.path}
                  </Link>
                  <span className="font-mono text-sm shrink-0">
                    {p._count._all}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel
          title={`Top-Referrer (${range.label})`}
          empty="Noch keine externen Referrer (z. B. nur direkter Aufruf)."
        >
          {topReferrersRaw.length > 0 && (
            <ol className="text-sm divide-y divide-border">
              {topReferrersRaw.map((r, i) => (
                <li
                  key={r.referrer ?? i}
                  className="py-2 flex items-baseline gap-3"
                >
                  <span className="text-muted text-xs w-5 text-right shrink-0">
                    {i + 1}.
                  </span>
                  <span
                    className="flex-1 truncate text-xs"
                    title={r.referrer ?? ""}
                  >
                    {hostnameOf(r.referrer)}
                  </span>
                  <span className="font-mono text-sm shrink-0">
                    {r._count._all}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold">Aufrufe heute nach Stunde</h2>
          <span className="text-xs text-muted">
            {totalToday} Aufrufe gesamt
          </span>
        </div>
        <div className="border border-border rounded-md p-4 bg-surface">
          <div className="flex items-end gap-1 h-24">
            {hourlyBuckets.map((count, h) => (
              <div
                key={h}
                className="flex-1 flex flex-col items-center gap-1 min-w-0"
                title={`${h}:00 – ${count} Aufrufe`}
              >
                <div
                  className="w-full bg-brand/80 rounded-sm"
                  style={{
                    height: `${(count / hourlyMax) * 100}%`,
                    minHeight: count > 0 ? "4px" : "2px",
                    opacity: count > 0 ? 1 : 0.2,
                  }}
                  aria-label={`${count} Aufrufe um ${h} Uhr`}
                />
                {h % 3 === 0 ? (
                  <div className="text-[0.6rem] text-muted">{h}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="text-3xl font-semibold mt-1">
        {value.toLocaleString("de-DE")}
      </div>
    </div>
  );
}

function Panel({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children?: React.ReactNode;
}) {
  const has = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <h2 className="font-semibold mb-2">{title}</h2>
      {has ? children : <p className="text-sm text-muted">{empty}</p>}
    </div>
  );
}

function RangeSwitcher({ current }: { current: RangeKey }) {
  return (
    <nav className="flex gap-1 text-sm" aria-label="Zeitraum wählen">
      {RANGE_OPTIONS.map((r) => (
        <Link
          key={r.key}
          href={`/admin/analytics?range=${r.key}`}
          aria-current={r.key === current ? "page" : undefined}
          className={`px-3 py-1.5 rounded-md border ${
            r.key === current
              ? "bg-brand text-white border-brand"
              : "border-border hover:bg-brand-soft hover:text-brand-dark"
          }`}
        >
          {r.label}
        </Link>
      ))}
    </nav>
  );
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function buildDailyBuckets(from: Date, to: Date): Record<string, number> {
  const out: Record<string, number> = {};
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  while (cursor <= end) {
    out[dayKey(cursor)] = 0;
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function formatDayShort(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(y, m - 1, d));
}

function hostnameOf(ref: string | null): string {
  if (!ref) return "—";
  try {
    return new URL(ref).hostname.replace(/^www\./, "") + new URL(ref).pathname;
  } catch {
    return ref;
  }
}
