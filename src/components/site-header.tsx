import { MobileNav } from "./mobile-nav";
import { SiteBrand } from "./site-brand";
import { DesktopNavigation } from "./site-navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-surface/95 shadow-[0_1px_10px_rgba(31,26,20,0.06)] backdrop-blur-md">
      <div className="h-1 bg-brand" aria-hidden="true" />
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-5 px-4 py-3 sm:px-6">
        <SiteBrand />
        <p className="hidden max-w-md border-l border-rule pl-5 font-serif text-sm italic leading-relaxed text-muted lg:block">
          Gemeinschaft, Glaube und gelebtes Miteinander im Herzen von Ramsen.
        </p>
        <div className="ml-auto flex items-center gap-2">
          <MobileNav brand={<SiteBrand compact />} />
        </div>
      </div>
      <div className="hidden border-t border-rule bg-background/80 xl:block">
        <div className="mx-auto max-w-7xl overflow-visible px-4 sm:px-6">
          <DesktopNavigation />
        </div>
      </div>
    </header>
  );
}
