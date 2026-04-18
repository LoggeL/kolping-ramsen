import { prisma } from "@/lib/prisma";
import { buildIcal } from "@/lib/ical";
import { SITE } from "@/lib/site";

export async function GET() {
  const events = await prisma.event.findMany({
    where: { published: true },
    orderBy: { startDate: "asc" },
  });
  const ical = buildIcal(
    events.map((e) => ({
      uid: e.id,
      start: e.startDate,
      end: e.endDate,
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
