"use client";

import { type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_BATCH_BYTES = 80 * 1024 * 1024;
const MAX_FILES = 20;

export function MediaUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("files");
    const files = input instanceof HTMLInputElement && input.files
      ? Array.from(input.files)
      : [];

    setFailed(false);
    if (files.length === 0) {
      setFailed(true);
      setMessage("Bitte mindestens ein Bild auswählen.");
      return;
    }
    if (files.length > MAX_FILES) {
      setFailed(true);
      setMessage(`Bitte höchstens ${MAX_FILES} Bilder gleichzeitig hochladen.`);
      return;
    }
    const oversized = files.find((file) => file.size > MAX_FILE_BYTES);
    if (oversized) {
      setFailed(true);
      setMessage(`„${oversized.name}“ ist größer als 15 MB.`);
      return;
    }
    if (files.reduce((sum, file) => sum + file.size, 0) > MAX_BATCH_BYTES) {
      setFailed(true);
      setMessage("Die Auswahl ist insgesamt größer als 80 MB.");
      return;
    }

    setUploading(true);
    setMessage("Bilder werden verarbeitet …");
    try {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const body = await response.json().catch(() => null) as {
        error?: string;
        saved?: unknown[];
      } | null;
      if (!response.ok) {
        throw new Error(body?.error ?? `Upload fehlgeschlagen (${response.status})`);
      }

      formRef.current?.reset();
      setMessage(
        `${body?.saved?.length ?? files.length} Bild${files.length === 1 ? "" : "er"} gespeichert.`,
      );
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={upload}
      className="flex flex-wrap items-center gap-3"
    >
      <input
        type="file"
        name="files"
        multiple
        required
        disabled={uploading}
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="block text-sm disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={uploading}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
      >
        {uploading ? "Wird verarbeitet …" : "Hochladen"}
      </button>
      <p className="text-xs text-muted">
        JPEG · PNG · WebP · AVIF — max. 20 Bilder, 15 MB je Bild und 80 MB
        insgesamt. Bilder werden ausgerichtet, verkleinert, bereinigt und als
        WebP gespeichert.
      </p>
      {message ? (
        <p
          role={failed ? "alert" : "status"}
          aria-live="polite"
          className={`w-full text-sm ${failed ? "text-red-700" : "text-green-700"}`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
