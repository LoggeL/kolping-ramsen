import { prisma } from "@/lib/prisma";
import { buildIcal } from "@/lib/ical";
import { SITE } from "@/lib/site";
import { civilDateKey } from "@/lib/event-time";

export async function GET() {
  const events = await prisma.event.findMany({
    where: { published: true },
    orderBy: { startDate: "asc" },
  });
  const ical = buildIcal(
    events.map((e) => ({
      uid: e.id,
      startDate: civilDateKey(e.startDate),
      endDate: e.endDate ? civilDateKey(e.endDate) : null,
      startTime: e.startTime,
      endTime: e.endTime,
      allDay: e.allDay,
      timeZone: e.timeZone,
      title: e.title,
      description: e.description,
      location: e.location,
      url: `${SITE.url}/termine/${e.slug}`,
    })),
  );
  return new Response(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="kolping-ramsen.ics"',
    },
  });
}
