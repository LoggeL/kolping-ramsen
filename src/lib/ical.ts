import { addCivilDays, EVENT_TIME_ZONE, isCivilDate, isClockTime } from "./event-time";
import { SITE } from "./site";

type IcalEvent = {
  uid: string;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  allDay: boolean;
  timeZone?: string;
  title: string;
  description?: string;
  location?: string | null;
  url?: string;
};

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatUtcDateTime(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function compactDate(value: string): string {
  if (!isCivilDate(value)) throw new Error(`Invalid iCalendar date: ${value}`);
  return value.replaceAll("-", "");
}

function compactLocalDateTime(date: string, time: string): string {
  if (!isClockTime(time)) throw new Error(`Invalid iCalendar time: ${time}`);
  return `${compactDate(date)}T${time.replace(":", "")}00`;
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string): string[] {
  const lines: string[] = [];
  let current = "";
  let currentBytes = 0;
  const flush = () => {
    lines.push(current);
    current = " ";
    currentBytes = 1;
  };

  for (const character of line) {
    const characterBytes = Buffer.byteLength(character, "utf8");
    if (currentBytes + characterBytes > 75 && current) flush();
    current += character;
    currentBytes += characterBytes;
  }
  lines.push(current);
  return lines;
}

const BERLIN_TIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${EVENT_TIME_ZONE}`,
  `X-LIC-LOCATION:${EVENT_TIME_ZONE}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function buildIcal(events: IcalEvent[], now: Date = new Date()): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE.name}//Terminkalender//DE`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(SITE.name)} – Termine`,
    `X-WR-TIMEZONE:${EVENT_TIME_ZONE}`,
    ...BERLIN_TIMEZONE,
  ];
  const stamp = formatUtcDateTime(now);

  for (const event of events) {
    const timeZone = event.timeZone ?? EVENT_TIME_ZONE;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.uid}@kolping-ramsen.de`);
    lines.push(`DTSTAMP:${stamp}`);
    if (event.allDay || !event.startTime) {
      lines.push(`DTSTART;VALUE=DATE:${compactDate(event.startDate)}`);
      lines.push(
        `DTEND;VALUE=DATE:${compactDate(addCivilDays(event.endDate ?? event.startDate, 1))}`,
      );
    } else {
      lines.push(
        `DTSTART;TZID=${timeZone}:${compactLocalDateTime(event.startDate, event.startTime)}`,
      );
      if (event.endTime) {
        lines.push(
          `DTEND;TZID=${timeZone}:${compactLocalDateTime(event.endDate ?? event.startDate, event.endTime)}`,
        );
      } else if (event.endDate) {
        // Compatibility for timed ranges created by the legacy editor. New
        // writes require an explicit end time, but existing data must not lose
        // its end date in calendar clients.
        lines.push(
          `DTEND;TZID=${timeZone}:${compactLocalDateTime(event.endDate, event.startTime)}`,
        );
      }
    }
    lines.push(`SUMMARY:${escapeText(event.title)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
    if (event.url) lines.push(`URL:${event.url}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.flatMap(foldLine).join("\r\n") + "\r\n";
}
