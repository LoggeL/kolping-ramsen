import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { EventForm } from "@/components/admin/event-form";
import { createEvent } from "../actions";
import { todayInTimeZone } from "@/lib/event-time";

export default async function NewEventPage() {
  if (!(await getSession())) redirect("/admin/login");
  return (
    <div>
      <Link href="/admin/events" className="text-sm text-brand-dark">← Zurück</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Neuer Termin</h1>
      <EventForm
        action={createEvent}
        submitLabel="Anlegen"
        values={{ startDate: todayInTimeZone() }}
      />
    </div>
  );
}
