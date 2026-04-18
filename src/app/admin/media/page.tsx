import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scanMedia, listBuckets } from "@/lib/media-scan";
import {
  buildReferenceMap,
  REFERENCE_KIND_LABEL,
} from "@/lib/media-references";
import {
  uploadMediaFiles,
  updateMediaAlt,
  renameMediaFile,
  deleteMediaFile,
} from "./actions";
import { CopyButton } from "@/components/admin/copy-button";

export const metadata = {
  title: "Mediathek",
  robots: { index: false, follow: false },
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function buildHref(params: { bucket?: string | null; q?: string }) {
  const sp = new URLSearchParams();
  if (params.bucket) sp.set("bucket", params.bucket);
  if (params.q) sp.set("q", params.q);
  const qs = sp.toString();
  return qs ? `/admin/media?${qs}` : "/admin/media";
}

export default async function AdminMediaPage(
  { searchParams }: PageProps<"/admin/media">,
) {
  if (!(await getSession())) redirect("/admin/login");
  const sp = await searchParams;
  const bucketFilter = typeof sp.bucket === "string" ? sp.bucket : null;
  const search =
    typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";

  const [files, refMap, assets] = await Promise.all([
    scanMedia(),
    buildReferenceMap(),
    prisma.mediaAsset.findMany({ select: { path: true, alt: true } }),
  ]);
  const assetMap = new Map(assets.map((a) => [a.path, a]));
  const buckets = listBuckets(files);
  const filtered = files.filter((f) => {
    if (bucketFilter && f.bucket !== bucketFilter) return false;
    if (search && !f.filename.toLowerCase().includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Mediathek</h1>
        <p className="text-sm text-muted mt-1">
          Zentrale Verwaltung aller Bilder — hochladen, umbenennen, Alt-Text
          pflegen, löschen und sehen, wo sie verlinkt sind.
        </p>
      </header>

      <section
        aria-label="Bilder hochladen"
        className="border border-border rounded-md bg-surface p-4"
      >
        <h2 className="font-semibold mb-2">Bilder hochladen</h2>
        <form
          action={uploadMediaFiles}
          className="flex flex-wrap items-center gap-3"
        >
          <input
            type="file"
            name="files"
            multiple
            required
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="block text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark"
          >
            Hochladen
          </button>
          <p className="text-xs text-muted">
            JPEG · PNG · WebP · GIF · AVIF — max. 10 MB pro Datei. Wird unter{" "}
            <code>uploads/library/</code> gespeichert.
          </p>
        </form>
      </section>

      <section className="space-y-3">
        <form className="flex flex-wrap items-center gap-2 text-sm" action="/admin/media">
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Dateinamen durchsuchen…"
            className="border border-border rounded-md px-3 py-1.5 w-64"
          />
          {bucketFilter ? (
            <input type="hidden" name="bucket" value={bucketFilter} />
          ) : null}
          <button
            type="submit"
            className="rounded-md border border-border px-3 py-1.5 hover:bg-brand-soft"
          >
            Suchen
          </button>
          {(search || bucketFilter) && (
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

        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Ordner filtern">
          <FilterChip
            label={`Alle (${files.length})`}
            href={buildHref({ bucket: null, q: search })}
            active={!bucketFilter}
          />
          {buckets.map((b) => (
            <FilterChip
              key={b.bucket}
              label={`${b.bucket} (${b.count})`}
              href={buildHref({ bucket: b.bucket, q: search })}
              active={bucketFilter === b.bucket}
            />
          ))}
        </nav>
      </section>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm">
          Keine Bilder gefunden. Lade neue über das Formular oben hoch.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((f) => {
            const meta = assetMap.get(f.relPath);
            const refs = refMap.get(("/" + f.relPath).toLowerCase()) ?? [];
            const altValue = meta?.alt ?? "";
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
                </div>
                <div className="p-3 flex-1 min-w-0 space-y-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-mono truncate" title={f.filename}>
                      {f.filename}
                    </div>
                    <div className="text-muted truncate" title={f.bucket}>
                      {f.bucket}
                    </div>
                    <div className="text-muted">
                      {formatBytes(f.size)} ·{" "}
                      {new Intl.DateTimeFormat("de-DE", {
                        dateStyle: "short",
                      }).format(f.mtime)}
                    </div>
                  </div>

                  <form
                    action={renameMediaFile.bind(null, f.relPath)}
                    className="flex gap-1.5"
                  >
                    <input
                      name="newName"
                      defaultValue={f.filename}
                      className="flex-1 min-w-0 border border-border rounded px-2 py-1 font-mono"
                      aria-label="Neuer Dateiname"
                    />
                    <button
                      type="submit"
                      className="text-brand-dark border border-border rounded px-2 py-1 hover:bg-brand-soft shrink-0"
                    >
                      Umbenennen
                    </button>
                  </form>

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
                        Nicht verlinkt — sicher zu löschen.
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
                              className="text-muted hover:text-brand-dark"
                              title="Im Frontend ansehen"
                            >
                              ↗
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
                    <form action={deleteMediaFile.bind(null, f.relPath)}>
                      <button
                        type="submit"
                        className="text-red-700 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
                      >
                        Löschen
                      </button>
                    </form>
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
