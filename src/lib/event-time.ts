export const EVENT_TIME_ZONE = "Europe/Berlin";

export const EVENT_CATEGORIES = [
  { value: "verein", label: "Verein" },
  { value: "jugend", label: "Jugend" },
  { value: "familie", label: "Familie" },
  { value: "kapelle", label: "Kapelle" },
  { value: "glaube", label: "Glaube" },
  { value: "kultur", label: "Kultur" },
  { value: "bezirk", label: "Bezirk" },
] as const;

export const EVENT_CATEGORY_VALUES = EVENT_CATEGORIES.map(
  ({ value }) => value,
) as [
  (typeof EVENT_CATEGORIES)[number]["value"],
  ...(typeof EVENT_CATEGORIES)[number]["value"][],
];

export type EventCategory = (typeof EVENT_CATEGORIES)[number]["value"];

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isCivilDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return civilDateKey(date) === value;
}

export function isClockTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function parseCivilDate(value: string): Date {
  if (!isCivilDate(value)) throw new Error(`Invalid civil date: ${value}`);
  return new Date(`${value}T00:00:00.000Z`);
}

export function civilDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function todayInTimeZone(
  timeZone: string = EVENT_TIME_ZONE,
  now: Date = new Date(),
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addCivilDays(value: string, days: number): string {
  const date = parseCivilDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return civilDateKey(date);
}

export function formatCivilDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" },
): string {
  return new Intl.DateTimeFormat("de-DE", {
    ...options,
    timeZone: "UTC",
  }).format(parseCivilDate(value));
}

export function formatEventDateRange(
  startDate: string,
  endDate?: string | null,
): string {
  if (!endDate || endDate === startDate) {
    return formatCivilDate(startDate, { dateStyle: "full" });
  }
  return `${formatCivilDate(startDate, { dateStyle: "medium" })} – ${formatCivilDate(endDate, { dateStyle: "medium" })}`;
}

export function formatEventTime(
  allDay: boolean,
  startTime?: string | null,
  endTime?: string | null,
): string {
  if (allDay || !startTime) return "Ganztägig";
  return endTime ? `${startTime}–${endTime} Uhr` : `${startTime} Uhr`;
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function partsInTimeZone(date: Date, timeZone: string): ZonedParts {
  const entries = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(entries.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

export function zonedDateTimeToUtc(
  dateValue: string,
  timeValue: string,
  timeZone: string = EVENT_TIME_ZONE,
): Date {
  if (!isCivilDate(dateValue) || !isClockTime(timeValue)) {
    throw new Error("Invalid zoned date-time");
  }
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let instant = desired;

  // Two passes account for an offset transition between the initial estimate
  // and the desired local wall time.
  for (let pass = 0; pass < 2; pass++) {
    const observed = partsInTimeZone(new Date(instant), timeZone);
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
    );
    instant = desired - (observedAsUtc - instant);
  }

  const result = new Date(instant);
  const roundTrip = partsInTimeZone(result, timeZone);
  if (
    roundTrip.year !== year ||
    roundTrip.month !== month ||
    roundTrip.day !== day ||
    roundTrip.hour !== hour ||
    roundTrip.minute !== minute
  ) {
    throw new Error("The local time does not exist in the selected timezone");
  }
  return result;
}

export function eventDateTimeValue(input: {
  date: string;
  time?: string | null;
  allDay: boolean;
  timeZone?: string;
}): string {
  if (input.allDay || !input.time) return input.date;
  return zonedDateTimeToUtc(
    input.date,
    input.time,
    input.timeZone ?? EVENT_TIME_ZONE,
  ).toISOString();
}

export function inferEventTime(description: string): {
  startTime: string | null;
  endTime: string | null;
} {
  const range = description.match(/^(\d{1,2})[:.]([0-5]\d)\s*[–-]\s*(\d{1,2})[:.]([0-5]\d)/);
  if (range) {
    return {
      startTime: `${range[1].padStart(2, "0")}:${range[2]}`,
      endTime: `${range[3].padStart(2, "0")}:${range[4]}`,
    };
  }
  const precise = description.match(/^(\d{1,2})[:.]([0-5]\d)\s*Uhr/i);
  if (precise) {
    return {
      startTime: `${precise[1].padStart(2, "0")}:${precise[2]}`,
      endTime: null,
    };
  }
  const hour = description.match(/^(\d{1,2})\s*Uhr/i);
  return {
    startTime: hour ? `${hour[1].padStart(2, "0")}:00` : null,
    endTime: null,
  };
}

export function inferEventCategory(title: string, description: string): EventCategory {
  const haystack = `${title} ${description}`.toLocaleLowerCase("de-DE");
  if (haystack.includes("jugend")) return "jugend";
  if (
    haystack.includes("next generation") ||
    haystack.includes("famil") ||
    haystack.includes("zeltlager")
  ) return "familie";
  if (haystack.includes("blaskapelle") || haystack.includes("konzert")) return "kapelle";
  if (haystack.includes("bezirks") || haystack.includes("diözesan")) return "bezirk";
  if (
    haystack.includes("gottesdienst") ||
    haystack.includes("andacht") ||
    haystack.includes("kolpinggedenktag") ||
    haystack.includes("rosenkranz")
  ) return "glaube";
  if (
    haystack.includes("theater") ||
    haystack.includes("prunksitzung") ||
    haystack.includes("krimidinner")
  ) return "kultur";
  return "verein";
}
