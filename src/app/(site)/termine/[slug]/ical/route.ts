import { prisma } from "@/lib/prisma";
import { buildIcal } from "@/lib/ical";
import { SITE } from "@/lib/site";
import { civilDateKey } from "@/lib/event-time";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event || !event.published) {
    return new Response("Not found", { status: 404 });
  }
  const ical = buildIcal([
    {
      uid: event.id,
      startDate: civilDateKey(event.startDate),
      endDate: event.endDate ? civilDateKey(event.endDate) : null,
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay,
      timeZone: event.timeZone,
      title: event.title,
      description: event.description,
      location: event.location,
      url: `${SITE.url}/termine/${event.slug}`,
    },
  ]);
  return new Response(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${event.slug}.ics"`,
    },
  });
}
