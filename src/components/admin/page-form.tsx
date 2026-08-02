"use client";

import { useMemo, useState } from "react";
import { MarkdownEditor } from "./markdown-editor";
import type { ParentOption } from "@/lib/page-tree";
import { todayInTimeZone } from "@/lib/event-time";

type PageFormValues = {
  title?: string;
  slug?: string;
  parent?: string | null;
  content?: string;
  metaTitle?: string | null;
  metaDesc?: string | null;
  sortOrder?: number;
  archiveDate?: string | null;
  published?: boolean;
  gallerySlug?: string | null;
};

export type GalleryOption = { slug: string; name: string };

function previewSlugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function PageForm({
  action,
  values,
  submitLabel,
  parentOptions,
  galleryOptions,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: PageFormValues;
  submitLabel: string;
  parentOptions: ParentOption[];
  galleryOptions: GalleryOption[];
}) {
  const initialLeaf = values?.slug ? values.slug.split("/").pop() ?? "" : "";
  const initialParent =
    values?.parent ??
    (values?.slug ? values.slug.split("/").slice(0, -1).join("/") : "");

  const [title, setTitle] = useState(values?.title ?? "");
  const [slug, setSlug] = useState(initialLeaf);
  const [parent, setParent] = useState(initialParent);

  const effectiveLeaf = useMemo(() => {
    const base = slug.trim().length > 0 ? slug : title;
    return previewSlugify(base) || "…";
  }, [slug, title]);

  const fullSlug = parent ? `${parent}/${effectiveLeaf}` : effectiveLeaf;
  const initialArchiveDate = values && "archiveDate" in values
    ? values.archiveDate ?? ""
    : todayInTimeZone();

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Titel</label>
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-border rounded-md px-3 py-2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">
            Übergeordnete Seite
          </label>
          <select
            name="parent"
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 bg-background"
          >
            {parentOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.depth === 0
                  ? o.label
                  : `${"— ".repeat(Math.max(0, o.depth - 1))}${o.label
                      .split("/")
                      .pop()}`}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted mt-1">
            Wo die Seite im Menü einsortiert wird.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Slug (letzter URL-Teil)
          </label>
          <input
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={previewSlugify(title) || "aus Titel"}
            className="w-full border border-border rounded-md px-3 py-2 font-mono text-sm"
          />
          <p className="text-xs text-muted mt-1">
            Leer = automatisch aus dem Titel generiert.
          </p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-brand-soft/40 px-3 py-2 text-sm">
        <span className="text-muted">URL:&nbsp;</span>
        <code className="font-mono break-all">
          /{fullSlug}
        </code>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Inhalt (Markdown)</label>
        <MarkdownEditor name="content" defaultValue={values?.content ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Meta-Titel (SEO)</label>
          <input
            name="metaTitle"
            defaultValue={values?.metaTitle ?? ""}
            className="w-full border border-border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Meta-Beschreibung (SEO)</label>
          <input
            name="metaDesc"
            defaultValue={values?.metaDesc ?? ""}
            className="w-full border border-border rounded-md px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Galerie (optional)
        </label>
        <select
          name="gallerySlug"
          defaultValue={values?.gallerySlug ?? ""}
          className="w-full border border-border rounded-md px-3 py-2 bg-background"
        >
          <option value="">— keine —</option>
          {galleryOptions.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.name} ({g.slug})
            </option>
          ))}
        </select>
        <p className="text-xs text-muted mt-1">
          Wird unter dem Inhalt als Bildergalerie angezeigt.
        </p>
      </div>

      <div className="max-w-xs">
        <label className="block text-sm font-medium mb-1">
          Beitragsdatum
        </label>
        <input
          type="date"
          name="archiveDate"
          defaultValue={initialArchiveDate}
          className="w-full border border-border rounded-md px-3 py-2"
        />
        <p className="text-xs text-muted mt-1">
          Bestimmt die chronologische Reihenfolge in öffentlichen Archiven; die Drag-&amp;-Drop-Reihenfolge bleibt davon unabhängig.
        </p>
      </div>

      {/* sortOrder wird in der Seitenliste per Drag &amp; Drop geändert */}
      <input type="hidden" name="sortOrder" value={values?.sortOrder ?? 0} />

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
