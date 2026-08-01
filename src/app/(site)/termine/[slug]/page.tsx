import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { getSession } from "@/lib/session";
import { Markdown } from "@/components/markdown";
import { DraftBanner } from "@/components/draft-banner";
import { IconCalendar, IconPin } from "@/components/admin/icons";
import { serializeJsonLd } from "@/lib/json-ld";
import {
  civilDateKey,
  eventDateTimeValue,
  formatEventDateRange,
  formatEventTime,
} from "@/lib/event-time";

export async function generateMetadata(
  { params }: PageProps<"/termine/[slug]">,
): Promise<Metadata> {
  const { slug } = await params;
  const item = await prisma.event.findUnique({ where: { slug } });
  if (!item) return { title: "Nicht gefunden" };
  return {
    title: item.title,
    description: item.description.slice(0, 160),
  };
}

export default async function EventDetailPage(
  { params }: PageProps<"/termine/[slug]">,
) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) notFound();
  const session = await getSession();
  if (!event.published && !session) notFound();

  const startDate = civilDateKey(event.startDate);
  const endDate = event.endDate ? civilDateKey(event.endDate) : null;
  const structuredStart = eventDateTimeValue({
    date: startDate,
    time: event.startTime,
    allDay: event.allDay,
    timeZone: event.timeZone,
  });
  const structuredEnd = event.endTime || (!event.allDay && endDate && event.startTime)
    ? eventDateTimeValue({
        date: endDate ?? startDate,
        time: event.endTime ?? event.startTime,
        allDay: false,
        timeZone: event.timeZone,
      })
    : endDate ?? undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: structuredStart,
    endDate: structuredEnd,
    location: event.location
      ? { "@type": "Place", name: event.location }
      : undefined,
    description: event.description,
    organizer: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Link href="/termine" className="text-sm text-brand-dark hover:underline">
        ← Zurück zu allen Terminen
      </Link>
      {!event.published ? <DraftBanner label="Termin-Entwurf" /> : null}
      <header className="mt-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">{event.title}</h1>
        <div className="mt-3 text-muted">
          <div className="flex items-start gap-1.5">
            <IconCalendar width={14} height={14} aria-hidden="true" className="mt-1" />
            <time dateTime={structuredStart}>
              <span className="block">{formatEventDateRange(startDate, endDate)}</span>
              <span className="block text-sm">
                {formatEventTime(event.allDay, event.startTime, event.endTime)}
              </span>
            </time>
          </div>
          {event.location ? (
            <div className="mt-1 inline-flex items-center gap-1.5">
              <IconPin width={14} height={14} aria-hidden="true" />
              {event.location}
            </div>
          ) : null}
        </div>
      </header>
      <Markdown source={event.description} />
      <div className="mt-8">
        <a
          href={`/termine/${event.slug}/ical`}
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm hover:bg-zinc-100"
        >
          Termin in Kalender (.ics)
        </a>
      </div>
    </article>
  );
}
