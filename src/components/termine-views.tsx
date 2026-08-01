"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatCivilDate,
  formatEventDateRange,
  formatEventTime,
} from "@/lib/event-time";
import { IconCalendar, IconList, IconPin } from "./admin/icons";

type EventRec = {
  id: string;
  slug: string;
  title: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  location: string | null;
  category: string;
};

const WEEKDAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function monthLabel(month: string): string {
  return formatCivilDate(`${month}-01`, { year: "numeric", month: "long" });
}

function shiftMonth(month: string, amount: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function eventOccursInMonth(event: EventRec, month: string): boolean {
  const first = `${month}-01`;
  const last = `${shiftMonth(month, 1)}-01`;
  return event.startDate < last && (event.endDate ?? event.startDate) >= first;
}

function eventOccursOn(event: EventRec, day: string): boolean {
  return event.startDate <= day && (event.endDate ?? event.startDate) >= day;
}

function EventMeta({ event }: { event: EventRec }) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
      <span>{formatEventTime(event.allDay, event.startTime, event.endTime)}</span>
      {event.location ? (
        <span className="inline-flex items-center gap-1.5">
          <IconPin width={12} height={12} aria-hidden="true" />
          {event.location}
        </span>
      ) : null}
    </div>
  );
}

export function TermineViews({
  events,
  today,
}: {
  events: EventRec[];
  today: string;
}) {
  const [view, setView] = useState<"agenda" | "kalender">("agenda");
  const ordered = useMemo(
    () => [...events].sort((a, b) => {
      const byDate = a.startDate.localeCompare(b.startDate);
      if (byDate !== 0) return byDate;
      return (a.startTime ?? "").localeCompare(b.startTime ?? "");
    }),
    [events],
  );

  return (
    <div>
      <div className="mb-6 flex w-fit gap-1 rounded-lg border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setView("agenda")}
          aria-pressed={view === "agenda"}
          className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm transition-colors ${
            view === "agenda"
              ? "bg-brand text-white"
              : "text-muted hover:text-brand-dark"
          }`}
        >
          <IconList width={14} height={14} aria-hidden="true" />
          Agenda
        </button>
        <button
          type="button"
          onClick={() => setView("kalender")}
          aria-pressed={view === "kalender"}
          className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm transition-colors ${
            view === "kalender"
              ? "bg-brand text-white"
              : "text-muted hover:text-brand-dark"
          }`}
        >
          <IconCalendar width={14} height={14} aria-hidden="true" />
          Kalender
        </button>
      </div>

      {view === "agenda" ? (
        <AgendaView events={ordered} />
      ) : (
        <CalendarView events={ordered} today={today} />
      )}
    </div>
  );
}

function AgendaView({ events }: { events: EventRec[] }) {
  if (events.length === 0) {
    return <p className="text-muted">Keine kommenden Termine.</p>;
  }
  const grouped = new Map<string, EventRec[]>();
  for (const event of events) {
    const key = event.startDate.slice(0, 7);
    grouped.set(key, [...(grouped.get(key) ?? []), event]);
  }

  return (
    <div className="space-y-10">
      {Array.from(grouped.entries()).map(([month, items]) => (
        <section key={month} aria-labelledby={`month-${month}`}>
          <h2 id={`month-${month}`} className="mb-4 font-serif text-xl text-brand-dark">
            {monthLabel(month)}
          </h2>
          <ul className="space-y-3">
            {items.map((event) => (
              <li
                key={event.id}
                className="flex gap-4 rounded-lg border border-border bg-surface p-4 transition hover:border-brand"
              >
                <div className="w-20 shrink-0 border-r border-rule pr-3 text-center">
                  <div className="text-[0.65rem] uppercase tracking-widest text-muted">
                    {formatCivilDate(event.startDate, { weekday: "short" })}
                  </div>
                  <div className="mt-0.5 font-serif text-3xl leading-none text-foreground">
                    {event.startDate.slice(8)}
                  </div>
                  {event.endDate && event.endDate !== event.startDate ? (
                    <div className="mt-1 text-[0.7rem] leading-tight text-muted">
                      bis {formatCivilDate(event.endDate, { day: "2-digit", month: "2-digit" })}
                    </div>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 self-center">
                  <h3 className="font-semibold">
                    <Link href={`/termine/${event.slug}`} className="hover:text-brand-dark">
                      {event.title}
                    </Link>
                  </h3>
                  <EventMeta event={event} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function CalendarView({ events, today }: { events: EventRec[]; today: string }) {
  const firstMonth = events[0]?.startDate.slice(0, 7) ?? today.slice(0, 7);
  const [cursor, setCursor] = useState(firstMonth);
  const [year, monthNumber] = cursor.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const startOffset = (firstOfMonth.getUTCDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const monthEvents = events.filter((event) => eventOccursInMonth(event, cursor));
  const cells: (number | null)[] = [];
  for (let index = 0; index < startOffset; index++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length < totalCells) cells.push(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(shiftMonth(cursor, -1))}
          aria-label="Vorheriger Monat"
          className="rounded-md border border-border px-3 py-1.5 hover:bg-brand-soft"
        >
          ←
        </button>
        <h2 className="font-serif text-xl capitalize text-brand-dark" aria-live="polite">
          {monthLabel(cursor)}
        </h2>
        <button
          type="button"
          onClick={() => setCursor(shiftMonth(cursor, 1))}
          aria-label="Nächster Monat"
          className="rounded-md border border-border px-3 py-1.5 hover:bg-brand-soft"
        >
          →
        </button>
      </div>

      <ul className="space-y-3 md:hidden">
        {monthEvents.length ? monthEvents.map((event) => (
          <li key={event.id} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-dark">
              {formatEventDateRange(event.startDate, event.endDate)}
            </p>
            <Link href={`/termine/${event.slug}`} className="mt-1 block font-semibold">
              {event.title}
            </Link>
            <EventMeta event={event} />
          </li>
        )) : (
          <li className="rounded-lg border border-dashed border-border p-5 text-sm text-muted">
            Keine Termine in diesem Monat.
          </li>
        )}
      </ul>

      <div
        className="hidden grid-cols-7 gap-px overflow-hidden rounded-lg border border-rule bg-rule text-sm md:grid"
        role="grid"
        aria-label={`Terminkalender ${monthLabel(cursor)}`}
      >
        {WEEKDAYS_DE.map((weekday) => (
          <div
            key={weekday}
            role="columnheader"
            className="bg-surface px-2 py-1.5 text-center text-xs font-medium uppercase tracking-wider text-muted"
          >
            {weekday}
          </div>
        ))}
        {cells.map((day, index) => {
          const date = day ? `${cursor}-${String(day).padStart(2, "0")}` : null;
          const dayEvents = date
            ? monthEvents.filter((event) => eventOccursOn(event, date))
            : [];
          return (
            <div
              key={`${cursor}-${index}`}
              role="gridcell"
              aria-label={date ? formatCivilDate(date, { dateStyle: "full" }) : undefined}
              className={`min-h-24 bg-surface p-1.5 ${date ? "" : "opacity-30"}`}
            >
              {date ? (
                <>
                  <div
                    className={
                      date === today
                        ? "inline-flex size-6 items-center justify-center rounded-full bg-brand text-xs font-medium text-white"
                        : "text-xs font-medium text-muted"
                    }
                  >
                    {day}
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <li key={event.id}>
                        <Link
                          href={`/termine/${event.slug}`}
                          title={`${event.title}, ${formatEventTime(event.allDay, event.startTime, event.endTime)}`}
                          className="block truncate rounded bg-brand-soft px-1 py-0.5 text-[0.7rem] leading-tight text-brand-dark hover:bg-brand hover:text-white"
                        >
                          {event.startTime ? `${event.startTime} ` : ""}{event.title}
                        </Link>
                      </li>
                    ))}
                    {dayEvents.length > 3 ? (
                      <li className="pl-1 text-[0.65rem] text-muted">
                        +{dayEvents.length - 3} weitere
                      </li>
                    ) : null}
                  </ul>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
