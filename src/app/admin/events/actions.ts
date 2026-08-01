"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { slugify } from "@/lib/slug";
import {
  EVENT_CATEGORY_VALUES,
  EVENT_TIME_ZONE,
  isCivilDate,
  isClockTime,
  parseCivilDate,
  zonedDateTimeToUtc,
} from "@/lib/event-time";

const optionalTime = z.string().trim().refine(
  (value) => value === "" || isClockTime(value),
  "Ungültige Uhrzeit",
);

const optionalDate = z.string().trim().refine(
  (value) => value === "" || isCivilDate(value),
  "Ungültiges Datum",
);

const eventSchema = z.object({
  title: z.string().min(2).max(200).trim(),
  slug: z.string().max(140).trim().optional(),
  startDate: z.string().refine(isCivilDate, "Ungültiges Startdatum"),
  startTime: optionalTime.optional().default(""),
  endDate: optionalDate.optional().default(""),
  endTime: optionalTime.optional().default(""),
  location: z.string().max(200).trim().optional(),
  description: z.string().min(2),
  category: z.enum(EVENT_CATEGORY_VALUES),
  published: z.string().optional(),
}).superRefine((data, context) => {
  if (data.endDate && data.endDate < data.startDate) {
    context.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "Das Enddatum darf nicht vor dem Beginn liegen.",
    });
  }
  if (data.endTime && !data.startTime) {
    context.addIssue({
      code: "custom",
      path: ["endTime"],
      message: "Eine Endzeit benötigt eine Startzeit.",
    });
  }
  if (data.startTime && data.endDate && !data.endTime) {
    context.addIssue({
      code: "custom",
      path: ["endTime"],
      message: "Ein mehrtägiger Termin mit Uhrzeit benötigt eine Endzeit.",
    });
  }
  if (
    data.endTime &&
    data.startTime &&
    (!data.endDate || data.endDate === data.startDate) &&
    data.endTime <= data.startTime
  ) {
    context.addIssue({
      code: "custom",
      path: ["endTime"],
      message: "Die Endzeit muss nach der Startzeit liegen.",
    });
  }
  if (isCivilDate(data.startDate) && data.startTime && isClockTime(data.startTime)) {
    try {
      zonedDateTimeToUtc(data.startDate, data.startTime, EVENT_TIME_ZONE);
    } catch {
      context.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Diese Uhrzeit existiert wegen der Zeitumstellung nicht.",
      });
    }
  }
  const effectiveEndDate = data.endDate || data.startDate;
  if (
    isCivilDate(effectiveEndDate) &&
    data.endTime &&
    isClockTime(data.endTime)
  ) {
    try {
      zonedDateTimeToUtc(effectiveEndDate, data.endTime, EVENT_TIME_ZONE);
    } catch {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "Diese Endzeit existiert wegen der Zeitumstellung nicht.",
      });
    }
  }
});

function eventData(formData: FormData) {
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Validierung fehlgeschlagen";
    throw new Error(message);
  }
  const data = parsed.data;
  const slug = slugify(data.slug || data.title);
  if (!slug) throw new Error("Aus dem Titel konnte kein gültiger Slug erzeugt werden.");
  const startTime = data.startTime || null;
  return {
    slug,
    title: data.title,
    startDate: parseCivilDate(data.startDate),
    endDate: data.endDate ? parseCivilDate(data.endDate) : null,
    startTime,
    endTime: data.endTime || null,
    allDay: startTime === null,
    timeZone: EVENT_TIME_ZONE,
    location: data.location || null,
    description: data.description,
    category: data.category,
    published: data.published === "on",
  };
}

export async function createEvent(formData: FormData) {
  const session = await requireSession();
  const data = eventData(formData);
  await prisma.event.create({ data: { ...data, authorId: session.userId } });
  revalidatePath("/termine");
  revalidatePath("/");
  redirect("/admin/events");
}

export async function updateEvent(id: string, formData: FormData) {
  await requireSession();
  const previous = await prisma.event.findUnique({
    where: { id },
    select: { slug: true },
  });
  const data = eventData(formData);
  await prisma.event.update({ where: { id }, data });
  revalidatePath("/termine");
  revalidatePath(`/termine/${data.slug}`);
  if (previous && previous.slug !== data.slug) {
    revalidatePath(`/termine/${previous.slug}`);
  }
  revalidatePath("/");
  redirect("/admin/events");
}

export async function deleteEvent(id: string) {
  await requireSession();
  await prisma.event.delete({ where: { id } });
  revalidatePath("/termine");
  revalidatePath("/");
  redirect("/admin/events");
}
