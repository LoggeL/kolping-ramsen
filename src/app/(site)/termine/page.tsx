import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { TermineViews } from "@/components/termine-views";
import { IconDownload } from "@/components/admin/icons";
import {
  civilDateKey,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_VALUES,
  parseCivilDate,
  todayInTimeZone,
} from "@/lib/event-time";

export const metadata: Metadata = {
  title: "Termine",
  description: "Vereinstermine der Kolpingsfamilie Ramsen.",
};

const CATEGORIES = [
  { value: "alle", label: "Alle" },
  ...EVENT_CATEGORIES,
];

export default async function EventsPage(
  { searchParams }: PageProps<"/termine">,
) {
  const sp = await searchParams;
  const requestedFilter = typeof sp.kategorie === "string" ? sp.kategorie : "alle";
  const filter = requestedFilter === "alle" || EVENT_CATEGORY_VALUES.includes(
    requestedFilter as (typeof EVENT_CATEGORY_VALUES)[number],
  ) ? requestedFilter : "alle";
  const today = todayInTimeZone();
  const todayDate = parseCivilDate(today);

  const session = await getSession();
  const events = await prisma.event.findMany({
    where: {
      ...(session ? {} : { published: true }),
      ...(filter !== "alle" ? { category: filter } : {}),
      OR: [
        { startDate: { gte: todayDate } },
        { endDate: { gte: todayDate } },
      ],
    },
    orderBy: { startDate: "asc" },
  });

  const serialized = events.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    startDate: civilDateKey(e.startDate),
    endDate: e.endDate ? civilDateKey(e.endDate) : null,
    startTime: e.startTime,
    endTime: e.endTime,
    allDay: e.allDay,
    location: e.location,
    category: e.category,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="eyebrow">Kalender</div>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl">Termine</h1>
          <p className="text-muted mt-1 font-serif italic">
            Was demnächst bei uns ansteht.
          </p>
        </div>
        <a
          href="/termine.ics"
          className="inline-flex items-center gap-1.5 text-sm rounded-md border border-border px-3 py-2 hover:bg-brand-soft"
        >
          <IconDownload width={14} height={14} />
          Kalender abonnieren (.ics)
        </a>
      </div>

      <nav className="flex flex-wrap gap-2 mb-8" aria-label="Filter Kategorien">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={c.value === "alle" ? "/termine" : `/termine?kategorie=${c.value}`}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              filter === c.value
                ? "bg-brand text-white border-brand"
                : "border-border hover:bg-brand-soft"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </nav>

      <TermineViews events={serialized} today={today} />
    </div>
  );
}
