export default function Loading() {
  return (
    <main
      className="mx-auto min-h-[50vh] max-w-5xl px-4 py-16"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Inhalt wird geladen</span>
      <div className="h-3 w-32 animate-pulse rounded-full bg-brand/20" />
      <div className="mt-5 h-10 max-w-xl animate-pulse rounded bg-brand/15" />
      <div className="mt-10 grid gap-5 md:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-md border border-border bg-surface" />
        ))}
      </div>
    </main>
  );
}
