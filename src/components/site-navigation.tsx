"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAIN_NAV, type NavItem } from "@/lib/site";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function sectionContains(pathname: string, item: NavItem) {
  if (isActive(pathname, item.href)) return true;
  return item.children?.some((child) => isActive(pathname, child.href)) ?? false;
}

function ExternalIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" />
    </svg>
  );
}

export function DesktopNavigation() {
  const pathname = usePathname();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => setOpenIndex(null), [pathname]);

  useEffect(() => {
    if (openIndex === null) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenIndex(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const button = menuButtonRefs.current[openIndex];
      setOpenIndex(null);
      button?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openIndex]);

  return (
    <nav ref={navRef} aria-label="Hauptnavigation">
      <ul className="flex min-h-12 items-stretch gap-0.5">
        {MAIN_NAV.map((item, index) => {
          const active = sectionContains(pathname, item);
          const itemClass = `inline-flex h-full items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:relative focus-visible:z-10 ${
            active
              ? "border-brand text-brand-dark"
              : "border-transparent text-foreground hover:border-rule hover:text-brand-dark"
          }`;

          if (!item.children) {
            return (
              <li key={item.href} className="shrink-0">
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={itemClass}
                  >
                    {item.label}
                    <ExternalIcon />
                    <span className="sr-only"> (öffnet in neuem Tab)</span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={itemClass}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          }

          const panelId = `desktop-navigation-${index}`;
          const isOpen = openIndex === index;
          return (
            <li key={item.href} className="relative shrink-0">
              <button
                ref={(element) => {
                  menuButtonRefs.current[index] = element;
                }}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className={itemClass}
              >
                {item.label}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="m3 6 5 5 5-5" />
                </svg>
              </button>
              {isOpen ? (
                <div
                  id={panelId}
                  className={`absolute left-0 top-full z-50 grid gap-1 border border-rule bg-surface p-2 shadow-xl ${
                    item.children.length > 6 ? "w-[34rem] grid-cols-2" : "w-72 grid-cols-1"
                  }`}
                >
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    onClick={() => setOpenIndex(null)}
                    className={`rounded-sm px-3 py-2.5 text-sm font-semibold transition-colors ${
                      pathname === item.href
                        ? "bg-brand text-white"
                        : "bg-brand-soft/70 text-brand-dark hover:bg-brand-soft"
                    }`}
                  >
                    Übersicht {item.label}
                  </Link>
                  {item.children.map((child) => {
                    const childActive = isActive(pathname, child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        aria-current={childActive ? "page" : undefined}
                        onClick={() => setOpenIndex(null)}
                        className={`rounded-sm px-3 py-2.5 text-sm transition-colors ${
                          childActive
                            ? "bg-brand text-white"
                            : "hover:bg-brand-soft hover:text-brand-dark"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Hauptnavigation">
      <ul className="space-y-1">
        {MAIN_NAV.map((item) => {
          const active = sectionContains(pathname, item);
          if (!item.children) {
            return (
              <li key={item.href}>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onNavigate}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-sm px-3 py-2.5 font-medium transition-colors hover:bg-brand-soft hover:text-brand-dark"
                  >
                    <span>{item.label}</span>
                    <ExternalIcon />
                    <span className="sr-only"> (öffnet in neuem Tab)</span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={`flex min-h-11 items-center rounded-sm px-3 py-2.5 font-medium transition-colors ${
                      active
                        ? "bg-brand text-white"
                        : "hover:bg-brand-soft hover:text-brand-dark"
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          }

          return (
            <MobileNavigationSection
              key={`${pathname}-${item.href}`}
              item={item}
              childrenItems={item.children}
              pathname={pathname}
              active={active}
              onNavigate={onNavigate}
            />
          );
        })}
      </ul>
    </nav>
  );
}

function MobileNavigationSection({
  item,
  childrenItems,
  pathname,
  active,
  onNavigate,
}: {
  item: NavItem;
  childrenItems: NavItem[];
  pathname: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(active);

  return (
    <li>
      <details
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
        className="group rounded-sm border border-transparent open:border-border open:bg-background/70"
      >
        <summary
          className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-sm px-3 py-2.5 font-medium transition-colors marker:content-none hover:bg-brand-soft hover:text-brand-dark ${
            active ? "text-brand-dark" : ""
          }`}
        >
          <span>{item.label}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="transition-transform group-open:rotate-180"
          >
            <path d="m3 6 5 5 5-5" />
          </svg>
        </summary>
        <ul className="mx-2 mb-2 space-y-1 border-l border-rule pl-2">
          <li>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`flex min-h-10 items-center rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${
                pathname === item.href
                  ? "bg-brand text-white"
                  : "bg-brand-soft/70 text-brand-dark hover:bg-brand-soft"
              }`}
            >
              Übersicht
            </Link>
          </li>
          {childrenItems.map((child) => {
            const childActive = isActive(pathname, child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  aria-current={childActive ? "page" : undefined}
                  className={`flex min-h-10 items-center rounded-sm px-3 py-2 text-sm transition-colors ${
                    childActive
                      ? "bg-brand text-white"
                      : "hover:bg-brand-soft hover:text-brand-dark"
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
}
