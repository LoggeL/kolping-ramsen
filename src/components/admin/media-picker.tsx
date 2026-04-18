"use client";

import { useEffect, useRef, useState } from "react";

type MediaFile = {
  url: string;
  bucket: string;
  filename: string;
  size: number;
  mtime: string;
};
type Bucket = { bucket: string; count: number };

export function MediaPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (file: { url: string; alt: string }) => void;
}) {
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [bucket, setBucket] = useState<string>("");
  const [q, setQ] = useState("");
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
      const data = (await r.json()) as { files: MediaFile[]; buckets: Bucket[] };
      setFiles(data.files);
      setBuckets(data.buckets);
    } catch (e) {
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

  const filtered = (files ?? []).filter((f) => {
    if (bucket && f.bucket !== bucket) return false;
    if (q && !f.filename.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    if (!input.files || input.files.length === 0) return;
    setUploading(true);
    setErr(null);
    const fd = new FormData();
    for (const f of Array.from(input.files)) fd.append("files", f);
    try {
      const r = await fetch("/api/admin/media", { method: "POST", body: fd });
      if (!r.ok) throw new Error(`${r.status}`);
      await load();
    } catch {
      setErr("Upload fehlgeschlagen.");
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
        aria-label="Mediathek — Bild auswählen"
      >
        <header className="p-4 border-b border-border flex items-center justify-between gap-3">
          <h2 className="font-semibold">Bild aus Mediathek wählen</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="rounded-md border border-border px-3 py-1 text-sm hover:bg-brand-soft"
          >
            ✕
          </button>
        </header>
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Dateiname suchen…"
            className="flex-1 min-w-[12rem] border border-border rounded-md px-3 py-1.5 text-sm"
          />
          <select
            value={bucket}
            onChange={(e) => setBucket(e.target.value)}
            className="border border-border rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Alle Ordner</option>
            {buckets.map((b) => (
              <option key={b.bucket} value={b.bucket}>
                {b.bucket || "(Wurzel)"} ({b.count})
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-sm rounded-md border border-border px-3 py-1.5 cursor-pointer hover:bg-brand-soft">
            📤 {uploading ? "Lädt…" : "Hochladen"}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && files === null ? (
            <p className="text-muted text-sm">Lade Mediathek…</p>
          ) : err ? (
            <p className="text-sm text-red-700">{err}</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted text-sm">Keine Bilder gefunden.</p>
          ) : (
            <ul className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
              {filtered.map((f) => (
                <li key={f.url}>
                  <button
                    type="button"
                    onClick={() =>
                      onPick({ url: f.url, alt: f.filename.replace(/\.[^.]+$/, "") })
                    }
                    className="group block w-full text-left border border-border rounded-md overflow-hidden bg-background hover:border-brand transition"
                  >
                    <div className="aspect-[4/3] bg-zinc-100 flex items-center justify-center overflow-hidden">
                      {/* plain img to avoid next/image constraints in modal */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                    <div className="px-2 py-1.5 text-xs">
                      <div className="truncate font-medium" title={f.filename}>
                        {f.filename}
                      </div>
                      <div className="text-muted truncate" title={f.bucket}>
                        {f.bucket || "—"}
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
