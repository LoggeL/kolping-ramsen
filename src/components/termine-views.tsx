"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type EventRec = {
  id: string;
  slug: string;
  title: string;
  startDate: string; // ISO
  endDate: string | null;
  location: string | null;
  category: string;
};

const MONTHS_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const WEEKDAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function TermineViews({ events }: { events: EventRec[] }) {
  const [view, setView] = useState<"agenda" | "kalender">("agenda");
  const parsed = useMemo(
    () => events.map((e) => ({ ...e, start: new Date(e.startDate) })),
    [events],
  );

  return (
    <div>
      <div className="flex gap-1 mb-6 border border-border rounded-md p-1 bg-surface w-fit">
        <button
          type="button"
          onClick={() => setView("agenda")}
          aria-pressed={view === "agenda"}
          className={`text-sm px-4 py-1.5 rounded transition-colors ${
            view === "agenda"
              ? "bg-brand text-white"
              : "text-muted hover:text-brand-dark"
          }`}
        >
          📋 Agenda
        </button>
        <button
          type="button"
          onClick={() => setView("kalender")}
          aria-pressed={view === "kalender"}
          className={`text-sm px-4 py-1.5 rounded transition-colors ${
            view === "kalender"
              ? "bg-brand text-white"
              : "text-muted hover:text-brand-dark"
          }`}
        >
          🗓 Kalender
        </button>
      </div>

      {view === "agenda" ? (
        <AgendaView events={parsed} />
      ) : (
        <CalendarView events={parsed} />
      )}
    </div>
  );
}

function AgendaView({
  events,
}: {
  events: (EventRec & { start: Date })[];
}) {
  if (events.length === 0) {
    return <p className="text-muted">Keine kommenden Termine.</p>;
  }
  const grouped = new Map<string, (EventRec & { start: Date })[]>();
  for (const e of events) {
    const k = monthKey(e.start);
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(e);
  }
  const ordered = Array.from(grouped.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <div className="space-y-10">
      {ordered.map(([key, items]) => {
        const [y, m] = key.split("-").map(Number);
        return (
          <section key={key}>
            <h2 className="font-serif text-xl mb-4 text-brand-dark">
              {MONTHS_DE[m - 1]} {y}
            </h2>
            <ul className="space-y-3">
              {items.map((e) => (
                <li
                  key={e.id}
                  className="flex gap-4 border border-border rounded-md p-4 bg-surface hover:border-brand transition"
                >
                  <div className="shrink-0 w-16 text-center border-r border-rule pr-3">
                    <div className="text-[0.65rem] uppercase tracking-widest text-muted">
                      {WEEKDAYS_DE[(e.start.getDay() + 6) % 7]}
                    </div>
                    <div className="font-serif text-3xl leading-none mt-0.5 text-foreground">
                      {e.start.getDate()}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {String(e.start.getHours()).padStart(2, "0")}:
                      {String(e.start.getMinutes()).padStart(2, "0")}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">
                      <Link
                        href={`/termine/${e.slug}`}
                        className="hover:text-brand-dark"
                      >
                        {e.title}
                      </Link>
                    </h3>
                    {e.location ? (
                      <div className="text-sm text-muted mt-0.5">📍 {e.location}</div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function CalendarView({
  events,
}: {
  events: (EventRec & { start: Date })[];
}) {
  const now = new Date();
  const firstMonth = events.length
    ? new Date(events[0].start.getFullYear(), events[0].start.getMonth(), 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const [cursor, setCursor] = useState(firstMonth);

  const prev = () =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const next = () =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lastOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  // grid starts on Monday
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastOfMonth.getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const eventsByDay = new Map<string, (EventRec & { start: Date })[]>();
  for (const e of events) {
    if (
      e.start.getFullYear() === cursor.getFullYear() &&
      e.start.getMonth() === cursor.getMonth()
    ) {
      const k = String(e.start.getDate());
      if (!eventsByDay.has(k)) eventsByDay.set(k, []);
      eventsByDay.get(k)!.push(e);
    }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < totalCells) cells.push(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prev}
          aria-label="Vorheriger Monat"
          className="rounded-md border border-border px-3 py-1.5 hover:bg-brand-soft"
        >
          ←
        </button>
        <h2 className="font-serif text-xl text-brand-dark">
          {MONTHS_DE[cursor.getMonth()]} {cursor.getFullYear()}
        </h2>
        <button
          type="button"
          onClick={next}
          aria-label="Nächster Monat"
          className="rounded-md border border-border px-3 py-1.5 hover:bg-brand-soft"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-rule border border-rule text-sm">
        {WEEKDAYS_DE.map((w) => (
          <div
            key={w}
            className="bg-surface px-2 py-1.5 text-center font-medium text-muted uppercase tracking-wider text-xs"
          >
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          const isToday =
            d != null &&
            sameDay(new Date(cursor.getFullYear(), cursor.getMonth(), d), now);
          const dayEvents = d != null ? eventsByDay.get(String(d)) ?? [] : [];
          return (
            <div
              key={i}
              className={`bg-surface min-h-[5rem] p-1.5 ${
                d == null ? "opacity-30" : ""
              }`}
            >
              {d != null ? (
                <>
                  <div
                    className={`text-xs font-medium ${
                      isToday
                        ? "inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand text-white"
                        : "text-muted"
                    }`}
                  >
                    {d}
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <li key={e.id}>
                        <Link
                          href={`/termine/${e.slug}`}
                          title={e.title}
                          className="block truncate text-[0.7rem] leading-tight bg-brand-soft text-brand-dark rounded px-1 py-0.5 hover:bg-brand hover:text-white"
                        >
                          {e.title}
                        </Link>
                      </li>
                    ))}
                    {dayEvents.length > 3 ? (
                      <li className="text-[0.65rem] text-muted pl-1">
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
