import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteSidebar } from "@/components/site-sidebar";
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
    <div className="lg:flex min-h-screen">
      <SiteSidebar />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {session ? (
          <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Redakteur-Modus:</strong> Entwürfe sind sichtbar.
              Angemeldet als <em>{session.name}</em>.
            </span>
            <Link
              href="/admin"
              className="underline hover:no-underline font-medium"
            >
              Zum Admin-Bereich →
            </Link>
          </div>
        ) : null}
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
      {session ? null : <TrackHit />}
    </div>
  );
}
