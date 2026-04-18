import { MarkdownEditor } from "./markdown-editor";

type PageFormValues = {
  title?: string;
  slug?: string;
  parent?: string | null;
  content?: string;
  metaTitle?: string | null;
  metaDesc?: string | null;
  sortOrder?: number;
  published?: boolean;
};

export function PageForm({
  action,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: PageFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Titel</label>
        <input name="title" required defaultValue={values?.title ?? ""}
          className="w-full border border-border rounded-md px-3 py-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Slug (z.B. "kolpingsfamilie-ramsen")</label>
          <input name="slug" defaultValue={values?.slug?.split("/").pop() ?? ""}
            className="w-full border border-border rounded-md px-3 py-2 font-mono text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Übergeordnet (z.B. "ueber-uns")</label>
          <input name="parent" defaultValue={values?.parent ?? ""}
            className="w-full border border-border rounded-md px-3 py-2 font-mono text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Inhalt (Markdown)</label>
        <MarkdownEditor name="content" defaultValue={values?.content ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Meta-Titel (SEO)</label>
          <input name="metaTitle" defaultValue={values?.metaTitle ?? ""}
            className="w-full border border-border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Meta-Beschreibung (SEO)</label>
          <input name="metaDesc" defaultValue={values?.metaDesc ?? ""}
            className="w-full border border-border rounded-md px-3 py-2" />
        </div>
      </div>
      {/* sortOrder wird in der Seitenliste per ↑/↓ geändert */}
      <input type="hidden" name="sortOrder" value={values?.sortOrder ?? 0} />
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
