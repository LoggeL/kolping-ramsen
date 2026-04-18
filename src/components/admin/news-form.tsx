import { MarkdownEditor } from "./markdown-editor";

type NewsFormValues = {
  title?: string;
  slug?: string;
  date?: string;
  teaser?: string;
  content?: string;
  coverImage?: string | null;
  published?: boolean;
};

export function NewsForm({
  action,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: NewsFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Titel</label>
        <input
          name="title"
          required
          defaultValue={values?.title ?? ""}
          className="w-full border border-border rounded-md px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Slug (optional, leer = aus Titel)</label>
        <input
          name="slug"
          defaultValue={values?.slug ?? ""}
          className="w-full border border-border rounded-md px-3 py-2 font-mono text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Datum</label>
        <input
          name="date"
          type="datetime-local"
          required
          defaultValue={values?.date ?? new Date().toISOString().slice(0, 16)}
          className="w-full border border-border rounded-md px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Teaser</label>
        <textarea
          name="teaser"
          rows={2}
          required
          defaultValue={values?.teaser ?? ""}
          className="w-full border border-border rounded-md px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Inhalt (Markdown)</label>
        <MarkdownEditor name="content" defaultValue={values?.content ?? ""} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Titelbild URL (optional)</label>
        <input
          name="coverImage"
          defaultValue={values?.coverImage ?? ""}
          className="w-full border border-border rounded-md px-3 py-2"
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
