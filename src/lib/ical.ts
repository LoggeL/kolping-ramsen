import { SITE } from "./site";

type IcalEvent = {
  uid: string;
  start: Date;
  end?: Date | null;
  title: string;
  description?: string;
  location?: string | null;
  url?: string;
};

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildIcal(events: IcalEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE.name}//Vibe Code CMS//DE`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escape(SITE.name)} – Termine`,
  ];
  const now = formatDate(new Date());
  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.uid}@kolping-ramsen.de`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${formatDate(ev.start)}`);
    if (ev.end) lines.push(`DTEND:${formatDate(ev.end)}`);
    lines.push(`SUMMARY:${escape(ev.title)}`);
    if (ev.description) lines.push(`DESCRIPTION:${escape(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escape(ev.location)}`);
    if (ev.url) lines.push(`URL:${ev.url}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
