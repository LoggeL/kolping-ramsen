import { MarkdownEditor } from "./markdown-editor";

type EventFormValues = {
  title?: string;
  slug?: string;
  startDate?: string;
  endDate?: string | null;
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
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Titel</label>
        <input name="title" required defaultValue={values?.title ?? ""}
          className="w-full border border-border rounded-md px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Slug (optional)</label>
        <input name="slug" defaultValue={values?.slug ?? ""}
          className="w-full border border-border rounded-md px-3 py-2 font-mono text-sm" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Beginn</label>
          <input name="startDate" type="datetime-local" required
            defaultValue={values?.startDate ?? ""}
            className="w-full border border-border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ende (optional)</label>
          <input name="endDate" type="datetime-local"
            defaultValue={values?.endDate ?? ""}
            className="w-full border border-border rounded-md px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Ort</label>
        <input name="location" defaultValue={values?.location ?? ""}
          className="w-full border border-border rounded-md px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Kategorie</label>
        <select name="category" defaultValue={values?.category ?? "alle"}
          className="w-full border border-border rounded-md px-3 py-2">
          <option value="alle">Alle</option>
          <option value="jugend">Jugend</option>
          <option value="familie">Familie</option>
          <option value="verein">Verein</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Beschreibung (Markdown)</label>
        <MarkdownEditor name="description" defaultValue={values?.description ?? ""} height={320} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={values?.published ?? true} />
        Veröffentlicht
      </label>
      <button type="submit"
        className="rounded-md bg-brand text-white px-5 py-2.5 font-medium hover:bg-brand-dark">
        {submitLabel}
      </button>
    </form>
  );
}
