import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TrackHit } from "@/components/track-hit";
import { getSession } from "@/lib/session";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <div id="site-shell" className="flex min-h-screen min-w-0 flex-col">
      <a href="#main-content" className="skip-link">
        Zum Hauptinhalt springen
      </a>
      {session ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-100 px-4 py-1.5 text-xs text-amber-900">
          <span>
            <strong>Redakteur-Modus:</strong> Entwürfe sind sichtbar. Angemeldet als{" "}
            <em>{session.name}</em>.
          </span>
          <Link href="/admin" className="font-medium underline hover:no-underline">
            Zum Admin-Bereich →
          </Link>
        </div>
      ) : null}
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-36">
        {children}
      </main>
      <SiteFooter />
      {session ? null : <TrackHit />}
    </div>
  );
}
