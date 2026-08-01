"use client";

import { useEffect, useRef, useState } from "react";
import { IconClose, IconUpload } from "./icons";

type MediaFile = {
  id: string | null;
  url: string;
  filename: string;
  size: number;
  mtime: string;
  orphan: boolean;
  alt: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
};
type Group = {
  id: string;
  slug: string;
  name: string;
  itemCount: number;
  thumb: string | null;
  thumbAlt: string;
};

type Tab = "files" | "groups";

export function MediaPicker({
  open,
  onClose,
  onPick,
  showGroups = true,
}: {
  open: boolean;
  onClose: () => void;
  /** Called with the raw text to insert into the editor. */
  onPick: (
    payload:
      | { kind: "image"; url: string; alt: string }
      | { kind: "gallery"; slug: string; insert: string },
  ) => void;
  showGroups?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("files");
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [q, setQ] = useState("");
  const [orphansOnly, setOrphansOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/media", { cache: "no-store" });
      if (!r.ok) throw new Error(`${r.status}`);
      const data = (await r.json()) as {
        files: MediaFile[];
        groups: Group[];
      };
      setFiles(data.files);
      setGroups(data.groups);
    } catch {
      setErr("Mediathek konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    if (files === null) load();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const filteredFiles = (files ?? []).filter((f) => {
    if (orphansOnly && !f.orphan) return false;
    if (q && !f.filename.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const filteredGroups = (groups ?? []).filter(
    (g) =>
      !q ||
      g.name.toLowerCase().includes(q.toLowerCase()) ||
      g.slug.toLowerCase().includes(q.toLowerCase()),
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    if (!input.files || input.files.length === 0) return;
    setUploading(true);
    setErr(null);
    const fd = new FormData();
    for (const f of Array.from(input.files)) fd.append("files", f);
    try {
      const r = await fetch("/api/admin/media", { method: "POST", body: fd });
      if (!r.ok) {
        const body = await r.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error ?? `Upload fehlgeschlagen (${r.status})`);
      }
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="bg-surface max-w-4xl w-full max-h-[85vh] flex flex-col rounded-md border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Mediathek — Auswahl"
      >
        <header className="p-4 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Aus Mediathek wählen</h2>
            {showGroups ? (
              <div
                role="tablist"
                aria-label="Ansicht"
                className="ml-4 inline-flex rounded-md border border-border p-0.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "files"}
                  onClick={() => setTab("files")}
                  className={`text-xs px-3 py-1 rounded ${tab === "files" ? "bg-brand text-white" : "text-muted hover:text-brand-dark"}`}
                >
                  Bilder
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "groups"}
                  onClick={() => setTab("groups")}
                  className={`text-xs px-3 py-1 rounded ${tab === "groups" ? "bg-brand text-white" : "text-muted hover:text-brand-dark"}`}
                >
                  Galerien
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="rounded-md border border-border p-1.5 hover:bg-brand-soft"
          >
            <IconClose width={14} height={14} />
          </button>
        </header>

        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              tab === "files" ? "Dateiname suchen…" : "Galerie suchen…"
            }
            className="flex-1 min-w-[12rem] border border-border rounded-md px-3 py-1.5 text-sm"
          />
          {tab === "files" ? (
            <>
              <label className="inline-flex items-center gap-1.5 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={orphansOnly}
                  onChange={(e) => setOrphansOnly(e.target.checked)}
                />
                Nur ungenutzte
              </label>
              <label className="inline-flex items-center gap-1.5 text-sm rounded-md border border-border px-3 py-1.5 cursor-pointer hover:bg-brand-soft">
                <IconUpload width={14} height={14} />
                {uploading ? "Lädt…" : "Hochladen"}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && files === null ? (
            <p className="text-muted text-sm">Lade Mediathek…</p>
          ) : err ? (
            <p className="text-sm text-red-700">{err}</p>
          ) : tab === "files" ? (
            filteredFiles.length === 0 ? (
              <p className="text-muted text-sm">Keine Bilder gefunden.</p>
            ) : (
              <ul className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
                {filteredFiles.map((f) => (
                  <li key={f.url}>
                    <button
                      type="button"
                      onClick={() =>
                        onPick({
                          kind: "image",
                          url: f.url,
                          alt: f.alt,
                        })
                      }
                      className="group block w-full text-left border border-border rounded-md overflow-hidden bg-background hover:border-brand transition"
                    >
                      <div className="aspect-[4/3] bg-zinc-100 flex items-center justify-center overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={f.url}
                          alt={f.alt}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        {f.orphan ? (
                          <span
                            title="nicht verwendet"
                            className="absolute top-1 left-1 text-[0.6rem] uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded px-1"
                          >
                            ungenutzt
                          </span>
                        ) : null}
                      </div>
                      <div className="px-2 py-1.5 text-xs">
                        <div className="truncate font-medium" title={f.filename}>
                          {f.filename}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : filteredGroups.length === 0 ? (
            <p className="text-muted text-sm">
              Noch keine Galerien. In der{" "}
              <a
                href="/admin/media/groups"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-dark underline"
              >
                Galerie-Verwaltung
              </a>{" "}
              anlegen.
            </p>
          ) : (
            <ul className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
              {filteredGroups.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onPick({
                        kind: "gallery",
                        slug: g.slug,
                        insert: `::gallery[${g.slug}]::`,
                      })
                    }
                    className="group block w-full text-left border border-border rounded-md overflow-hidden bg-background hover:border-brand transition"
                  >
                    <div className="aspect-[4/3] bg-zinc-100 overflow-hidden">
                      {g.thumb ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={g.thumb}
                          alt={g.thumbAlt}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                          leer
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5 text-xs">
                      <div className="truncate font-medium">{g.name}</div>
                      <div className="truncate text-muted font-mono">
                        {g.slug} · {g.itemCount} Bilder
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
