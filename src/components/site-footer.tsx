import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-rule bg-surface">
      <div
        className="mx-auto max-w-6xl px-4 pt-8 flex items-center gap-3 text-rule"
        aria-hidden
      >
        <span className="flex-1 border-t border-rule" />
        <span className="font-serif text-base text-muted">&#10086;</span>
        <span className="flex-1 border-t border-rule" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <div className="font-serif font-semibold text-lg mb-2">{SITE.name}</div>
          <p className="text-muted font-serif italic leading-relaxed">{SITE.description}</p>
        </div>
        <div>
          <div className="eyebrow mb-3">Links</div>
          <ul className="space-y-1.5 font-serif">
            <li><Link href="/aktuelles" className="hover:text-brand-dark">Aktuelles</Link></li>
            <li><Link href="/termine" className="hover:text-brand-dark">Termine</Link></li>
            <li><Link href="/kontakt" className="hover:text-brand-dark">Kontakt</Link></li>
            <li><Link href="/mitglied-werden" className="hover:text-brand-dark">Mitglied werden</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Rechtliches</div>
          <ul className="space-y-1.5 font-serif">
            <li><Link href="/impressum" className="hover:text-brand-dark">Impressum</Link></li>
            <li><Link href="/datenschutz" className="hover:text-brand-dark">Datenschutz</Link></li>
            <li><Link href="/admin" className="hover:text-brand-dark">Redaktion</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-rule py-4 px-4 text-center text-xs text-muted">
        <span className="font-serif italic">© {year} {SITE.name}</span>
      </div>
    </footer>
  );
}
