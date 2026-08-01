import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Startseite der Kolpingsfamilie Ramsen"
      className="group inline-flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-offset-4"
    >
      <Image
        src="/brand/kolping-logo.svg"
        alt=""
        width={190}
        height={123}
        loading="eager"
        className={compact ? "h-10 w-auto shrink-0" : "h-12 w-auto shrink-0"}
      />
      <span className="min-w-0">
        <span
          className={`block truncate font-serif font-semibold leading-none transition-colors group-hover:text-brand-dark ${
            compact ? "text-base" : "text-lg sm:text-xl"
          }`}
        >
          {SITE.shortName}
        </span>
        <span className="mt-1 block text-[0.65rem] uppercase leading-none tracking-[0.2em] text-muted">
          Ramsen &middot; Pfalz
        </span>
      </span>
    </Link>
  );
}
