import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="lg:hidden border-b border-rule bg-surface sticky top-0 z-40">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Image
            src="/brand/kolping-logo.svg"
            alt=""
            width={190}
            height={123}
            priority
            className="h-9 w-auto"
          />
          <span className="font-serif font-semibold text-base truncate">
            {SITE.shortName}
          </span>
        </Link>
        <MobileNav />
      </div>
    </header>
  );
}
