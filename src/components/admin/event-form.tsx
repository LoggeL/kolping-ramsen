import { EVENT_CATEGORIES } from "@/lib/event-time";
import { MarkdownEditor } from "./markdown-editor";

type EventFormValues = {
  title?: string;
  slug?: string;
  startDate?: string;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string;
  category?: string;
  published?: boolean;
};

export function EventForm({
  action,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: EventFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="event-title" className="block text-sm font-medium mb-1">
          Titel
        </label>
        <input
          id="event-title"
          name="title"
          required
          defaultValue={values?.title ?? ""}
          className="w-full border border-border rounded-md px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="event-slug" className="block text-sm font-medium mb-1">
          Slug (optional)
        </label>
        <input
          id="event-slug"
          name="slug"
          defaultValue={values?.slug ?? ""}
          className="w-full border border-border rounded-md px-3 py-2 font-mono text-sm"
        />
      </div>

      <fieldset className="rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Datum und Uhrzeit</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="event-start-date" className="block text-sm font-medium mb-1">
              Beginn
            </label>
            <input
              id="event-start-date"
              name="startDate"
              type="date"
              required
              defaultValue={values?.startDate ?? ""}
              className="w-full border border-border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="event-start-time" className="block text-sm font-medium mb-1">
              Uhrzeit
            </label>
            <input
              id="event-start-time"
              name="startTime"
              type="time"
              defaultValue={values?.startTime ?? ""}
              className="w-full border border-border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="event-end-date" className="block text-sm font-medium mb-1">
              Letzter Tag (optional)
            </label>
            <input
              id="event-end-date"
              name="endDate"
              type="date"
              min={values?.startDate ?? undefined}
              defaultValue={values?.endDate ?? ""}
              className="w-full border border-border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="event-end-time" className="block text-sm font-medium mb-1">
              Ende (optional)
            </label>
            <input
              id="event-end-time"
              name="endTime"
              type="time"
              defaultValue={values?.endTime ?? ""}
              className="w-full border border-border rounded-md px-3 py-2"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Ohne Uhrzeit wird der Termin als ganztägig angezeigt. Alle Uhrzeiten
          gelten für Ramsen (Europe/Berlin).
        </p>
      </fieldset>

      <div>
        <label htmlFor="event-location" className="block text-sm font-medium mb-1">
          Ort
        </label>
        <input
          id="event-location"
          name="location"
          defaultValue={values?.location ?? ""}
          className="w-full border border-border rounded-md px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="event-category" className="block text-sm font-medium mb-1">
          Kategorie
        </label>
        <select
          id="event-category"
          name="category"
          defaultValue={values?.category ?? "verein"}
          className="w-full border border-border rounded-md px-3 py-2"
        >
          {EVENT_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Beschreibung (Markdown)</label>
        <MarkdownEditor
          name="description"
          defaultValue={values?.description ?? ""}
          height={320}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="published"
          defaultChecked={values?.published ?? true}
        />
        Veröffentlicht
      </label>
      <button
        type="submit"
        className="rounded-md bg-brand text-white px-5 py-2.5 font-medium hover:bg-brand-dark"
      >
        {submitLabel}
      </button>
    </form>
  );
}
