import assert from "node:assert/strict";
import test from "node:test";
import { buildIcal } from "./ical";

const NOW = new Date("2026-08-01T12:00:00.000Z");

test("iCalendar emits inclusive all-day ranges with an exclusive DTEND", () => {
  const calendar = buildIcal([
    {
      uid: "camp",
      startDate: "2026-07-18",
      endDate: "2026-07-25",
      allDay: true,
      title: "Familien-Zeltlager",
    },
  ], NOW);

  assert.match(calendar, /DTSTART;VALUE=DATE:20260718\r\n/);
  assert.match(calendar, /DTEND;VALUE=DATE:20260726\r\n/);
  assert.match(calendar, /DTSTAMP:20260801T120000Z\r\n/);
});

test("iCalendar keeps community event times in Europe/Berlin", () => {
  const calendar = buildIcal([
    {
      uid: "theater",
      startDate: "2026-08-21",
      startTime: "20:00",
      endTime: "22:15",
      allDay: false,
      timeZone: "Europe/Berlin",
      title: "Open-Air-Theater",
    },
  ], NOW);

  assert.match(calendar, /BEGIN:VTIMEZONE\r\n/);
  assert.match(calendar, /DTSTART;TZID=Europe\/Berlin:20260821T200000\r\n/);
  assert.match(calendar, /DTEND;TZID=Europe\/Berlin:20260821T221500\r\n/);
});

test("iCalendar preserves the end date of a legacy timed range", () => {
  const calendar = buildIcal([
    {
      uid: "legacy-range",
      startDate: "2026-08-21",
      endDate: "2026-08-22",
      startTime: "20:00",
      allDay: false,
      title: "Legacy range",
    },
  ], NOW);

  assert.match(calendar, /DTSTART;TZID=Europe\/Berlin:20260821T200000\r\n/);
  assert.match(calendar, /DTEND;TZID=Europe\/Berlin:20260822T200000\r\n/);
});

test("iCalendar escapes content and folds every physical line to 75 bytes", () => {
  const calendar = buildIcal([
    {
      uid: "long",
      startDate: "2026-09-04",
      startTime: "18:00",
      allDay: false,
      title: "Ein sehr langer Titel mit Umlauten ÄÖÜ, Komma; und zusätzlichem Inhalt für Folding",
      description: "Zeile eins\nZeile zwei",
    },
  ], NOW);

  assert.match(calendar, /DESCRIPTION:Zeile eins\\nZeile zwei/);
  assert.match(calendar, /\\, Komma\\;/);
  for (const line of calendar.split("\r\n")) {
    assert.ok(Buffer.byteLength(line, "utf8") <= 75, `${line} exceeds 75 bytes`);
  }
});
