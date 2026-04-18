import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-brand-dark font-semibold uppercase tracking-wide text-sm">404</p>
      <h1 className="mt-3 text-4xl font-bold">Seite nicht gefunden</h1>
      <p className="mt-3 text-muted">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-brand text-white px-5 py-2.5 font-medium hover:bg-brand-dark"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
