import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import { listMediaFiles } from "@/lib/media-catalog";
import {
  buildReferenceMap,
  mediaReferenceKey,
  REFERENCE_KIND_LABEL,
} from "@/lib/media-references";
import {
  updateMediaAlt,
  deleteMediaFile,
} from "./actions";
import { CopyButton } from "@/components/admin/copy-button";
import { IconExternal } from "@/components/admin/icons";
import { MediaUploadForm } from "@/components/admin/media-upload-form";

export const metadata = {
  title: "Mediathek",
  robots: { index: false, follow: false },
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function buildHref(params: { orphans?: boolean; q?: string }) {
  const sp = new URLSearchParams();
  if (params.orphans) sp.set("filter", "orphans");
  if (params.q) sp.set("q", params.q);
  const qs = sp.toString();
  return qs ? `/admin/media?${qs}` : "/admin/media";
}

export default async function AdminMediaPage(
  { searchParams }: PageProps<"/admin/media">,
) {
  if (!(await getSession())) redirect("/admin/login");
  const sp = await searchParams;
  const filter = typeof sp.filter === "string" ? sp.filter : "";
  const onlyOrphans = filter === "orphans";
  const search = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";

  const [files, refMap] = await Promise.all([
    listMediaFiles(),
    buildReferenceMap(),
  ]);

  const annotated = files.map((f) => {
    const refs = refMap.get(mediaReferenceKey(f.url)) ?? [];
    return { file: f, refs, orphan: refs.length === 0 };
  });
  const filtered = annotated.filter(({ file, orphan }) => {
    if (onlyOrphans && !orphan) return false;
    if (search && !file.filename.toLowerCase().includes(search)) return false;
    return true;
  });
  const orphanCount = annotated.filter((a) => a.orphan).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mediathek</h1>
          <p className="text-sm text-muted mt-1">
            Alle Bilder — hochladen, Alt-Text pflegen, löschen und sehen, wo sie
            verlinkt sind.
          </p>
        </div>
        <Link
          href="/admin/media/groups"
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-brand-soft"
        >
          Galerie-Gruppen verwalten →
        </Link>
      </header>

      <section
        aria-label="Bilder hochladen"
        className="border border-border rounded-md bg-surface p-4"
      >
        <h2 className="font-semibold mb-2">Bilder hochladen</h2>
        <MediaUploadForm />
      </section>

      <section className="space-y-3">
        <form
          className="flex flex-wrap items-center gap-2 text-sm"
          action="/admin/media"
        >
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Dateinamen durchsuchen…"
            className="border border-border rounded-md px-3 py-1.5 w-64"
          />
          {onlyOrphans ? (
            <input type="hidden" name="filter" value="orphans" />
          ) : null}
          <button
            type="submit"
            className="rounded-md border border-border px-3 py-1.5 hover:bg-brand-soft"
          >
            Suchen
          </button>
          {(search || onlyOrphans) && (
            <Link
              href="/admin/media"
              className="text-brand-dark text-xs hover:underline"
            >
              Filter zurücksetzen
            </Link>
          )}
          <span className="text-xs text-muted ml-auto">
            {filtered.length} von {files.length} Dateien
          </span>
        </form>

        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Filter">
          <FilterChip
            label={`Alle (${files.length})`}
            href={buildHref({ q: search })}
            active={!onlyOrphans}
          />
          <FilterChip
            label={`Ungenutzt (${orphanCount})`}
            href={buildHref({ orphans: true, q: search })}
            active={onlyOrphans}
          />
        </nav>
      </section>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm">
          Keine Bilder gefunden. Lade neue über das Formular oben hoch.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ file: f, refs, orphan }) => {
            const altValue = f.alt;
            return (
              <li
                key={f.relPath}
                className="border border-border rounded-md bg-surface overflow-hidden flex flex-col sm:flex-row"
              >
                <div className="relative w-full sm:w-44 h-44 shrink-0 bg-zinc-100">
                  <Image
                    src={f.url}
                    alt={altValue}
                    fill
                    sizes="(max-width: 640px) 100vw, 200px"
                    className="object-cover"
                    unoptimized={f.url.toLowerCase().endsWith(".svg")}
                  />
                  {orphan ? (
                    <span className="absolute top-1 left-1 text-[0.6rem] uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded px-1 py-0.5">
                      ungenutzt
                    </span>
                  ) : null}
                </div>
                <div className="p-3 flex-1 min-w-0 space-y-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-mono truncate" title={f.filename}>
                      {f.filename}
                    </div>
                    <div className="text-muted">
                      {formatBytes(f.size)} ·{" "}
                      {new Intl.DateTimeFormat("de-DE", {
                        dateStyle: "short",
                      }).format(f.mtime)}
                    </div>
                    {f.width && f.height ? (
                      <div className="text-muted">
                        {f.width} × {f.height} px
                      </div>
                    ) : null}
                  </div>

                  <form
                    action={updateMediaAlt.bind(null, f.relPath)}
                    className="space-y-1.5"
                  >
                    <input
                      name="alt"
                      defaultValue={altValue}
                      placeholder="Alt-Text (Bildbeschreibung für Screenreader & SEO)"
                      className="w-full border border-border rounded px-2 py-1"
                    />
                    <textarea
                      name="caption"
                      defaultValue={f.caption ?? ""}
                      placeholder="Optionale Bildunterschrift"
                      rows={2}
                      className="w-full resize-y border border-border rounded px-2 py-1"
                    />
                    <button
                      type="submit"
                      className="text-brand-dark border border-border rounded px-2 py-1 hover:bg-brand-soft"
                    >
                      Alt-Text speichern
                    </button>
                  </form>

                  <div>
                    <div className="font-semibold mb-1">
                      Verwendet in{" "}
                      <span className="text-muted font-normal">
                        ({refs.length})
                      </span>
                    </div>
                    {refs.length === 0 ? (
                      <p className="text-muted italic">
                        {f.managed
                          ? "Nicht verlinkt — kann gelöscht werden."
                          : "Nicht verlinkt — gehört aber zum versionierten Website-Bestand."}
                      </p>
                    ) : (
                      <ul className="space-y-0.5 max-h-28 overflow-y-auto pr-1">
                        {refs.map((r, i) => (
                          <li key={i} className="truncate">
                            <span className="text-muted">
                              [{REFERENCE_KIND_LABEL[r.kind]}]
                            </span>{" "}
                            <Link
                              href={r.adminHref}
                              className="text-brand-dark hover:underline"
                              title={r.label}
                            >
                              {r.label}
                            </Link>{" "}
                            <Link
                              href={r.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted hover:text-brand-dark inline-flex align-middle"
                              title="Im Frontend ansehen"
                            >
                              <IconExternal width={11} height={11} />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <CopyButton value={f.url}>URL kopieren</CopyButton>
                    <CopyButton value={`![${altValue}](${f.url})`}>
                      Markdown kopieren
                    </CopyButton>
                    {f.managed ? (
                      <form action={deleteMediaFile.bind(null, f.relPath)}>
                        <button
                          type="submit"
                          disabled={!orphan}
                          title={!orphan ? "Das Bild wird noch verwendet" : undefined}
                          className="text-red-700 border border-red-200 rounded px-2 py-1 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Löschen
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 ${
        active
          ? "bg-brand text-white border-brand"
          : "border-border hover:bg-brand-soft hover:text-brand-dark"
      }`}
    >
      {label}
    </Link>
  );
}
