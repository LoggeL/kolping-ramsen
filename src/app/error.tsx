"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log only the framework error object; form data and visitor input are not
    // included by this boundary.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[55vh] max-w-2xl flex-col justify-center px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-brand-dark">
        Technischer Fehler
      </p>
      <h1 className="mt-3 font-serif text-3xl font-bold text-foreground sm:text-4xl">
        Diese Seite konnte gerade nicht geladen werden.
      </h1>
      <p className="mt-4 max-w-prose text-muted">
        Bitte versuche es noch einmal. Wenn der Fehler bestehen bleibt, komm später erneut
        vorbei.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-sm bg-brand px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Erneut versuchen
        </button>
        <a
          href="/"
          className="rounded-sm border border-border bg-surface px-5 py-3 font-semibold text-foreground transition-colors hover:border-brand"
        >
          Zur Startseite
        </a>
      </div>
    </main>
  );
}
