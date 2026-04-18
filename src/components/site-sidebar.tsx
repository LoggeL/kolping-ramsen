"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV, type NavItem } from "@/lib/site";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function sectionContains(pathname: string, item: NavItem) {
  if (isActive(pathname, item.href)) return true;
  return item.children?.some((c) => isActive(pathname, c.href)) ?? false;
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Hauptnavigation" className="text-sm">
      <ul className="space-y-0.5">
        {MAIN_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          if (!item.children) {
            if (item.external) {
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onNavigate}
                    className="flex items-center justify-between gap-2 rounded-md px-3 py-2 font-medium transition-colors text-foreground hover:bg-brand-soft hover:text-brand-dark"
                  >
                    <span>{item.label}</span>
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted"
                    >
                      <path d="M14 3h7v7" />
                      <path d="M10 14 21 3" />
                      <path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" />
                    </svg>
                  </a>
                </li>
              );
            }
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 font-medium transition-colors ${
                    active
                      ? "bg-brand text-white"
                      : "text-foreground hover:bg-brand-soft hover:text-brand-dark"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          }
          const openSection = sectionContains(pathname, item);
          return (
            <li key={item.href}>
              <details
                open={openSection}
                className="group rounded-md"
              >
                <summary
                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 font-medium cursor-pointer list-none select-none transition-colors ${
                    active
                      ? "bg-brand-soft text-brand-dark"
                      : "text-foreground hover:bg-brand-soft hover:text-brand-dark"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    aria-hidden
                    className="text-muted transition-transform group-open:rotate-90"
                  >
                    ›
                  </span>
                </summary>
                <ul className="mt-0.5 mb-1 ml-3 border-l border-border pl-2 space-y-0.5">
                  <li>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={
                        isActive(pathname, item.href) &&
                        !item.children.some((c) => isActive(pathname, c.href))
                          ? "page"
                          : undefined
                      }
                      className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                        isActive(pathname, item.href) &&
                        !item.children.some((c) => isActive(pathname, c.href))
                          ? "bg-brand text-white"
                          : "text-muted hover:bg-brand-soft hover:text-brand-dark"
                      }`}
                    >
                      Übersicht
                    </Link>
                  </li>
                  {item.children.map((child) => {
                    const childActive = isActive(pathname, child.href);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onNavigate}
                          aria-current={childActive ? "page" : undefined}
                          className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                            childActive
                              ? "bg-brand text-white"
                              : "text-foreground hover:bg-brand-soft hover:text-brand-dark"
                          }`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      aria-label="Startseite Kolpingsfamilie Ramsen"
      className="flex items-center gap-3 group"
    >
      <Image
        src="/brand/kolping-logo.svg"
        alt=""
        width={190}
        height={123}
        priority
        className="h-12 w-auto shrink-0"
      />
      <div className="min-w-0">
        <div className="font-serif font-semibold text-lg leading-tight text-foreground group-hover:text-brand-dark transition-colors">
          Kolpingsfamilie
        </div>
        <div className="text-[0.7rem] uppercase tracking-[0.2em] text-muted leading-tight mt-0.5">
          Ramsen &middot; Pfalz
        </div>
      </div>
    </Link>
  );
}

export function SiteSidebar() {
  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-72 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen border-r border-rule bg-surface"
      aria-label="Seitenleiste"
    >
      <div className="p-4 border-b border-rule">
        <SidebarBrand />
        <div
          className="mt-3 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.25em] text-muted"
          aria-hidden
        >
          <span className="flex-1 border-t border-rule" />
          <span className="font-serif italic normal-case tracking-normal text-[0.8rem]">
            Treu Kolping
          </span>
          <span className="flex-1 border-t border-rule" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav />
      </div>
    </aside>
  );
}
