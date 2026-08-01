import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/admin/event-form";
import { OpenLiveLink } from "@/components/admin/open-live-link";
import { updateEvent, deleteEvent } from "../actions";
import { civilDateKey } from "@/lib/event-time";

export default async function EditEventPage(
  { params }: PageProps<"/admin/events/[id]">,
) {
  if (!(await getSession())) redirect("/admin/login");
  const { id } = await params;
  const item = await prisma.event.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div>
      <Link href="/admin/events" className="text-sm text-brand-dark">← Zurück</Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Termin bearbeiten</h1>
        <OpenLiveLink href={`/termine/${item.slug}`} />
      </div>
      <EventForm
        action={updateEvent.bind(null, id)}
        submitLabel="Speichern"
        values={{
          title: item.title,
          slug: item.slug,
          startDate: civilDateKey(item.startDate),
          startTime: item.startTime,
          endDate: item.endDate ? civilDateKey(item.endDate) : "",
          endTime: item.endTime,
          location: item.location,
          description: item.description,
          category: item.category,
          published: item.published,
        }}
      />
      <form action={deleteEvent.bind(null, id)} className="mt-8 border-t border-border pt-6">
        <button type="submit"
          className="text-sm text-red-700 border border-red-300 rounded-md px-4 py-2 hover:bg-red-50">
          Termin löschen
        </button>
      </form>
    </div>
  );
}
