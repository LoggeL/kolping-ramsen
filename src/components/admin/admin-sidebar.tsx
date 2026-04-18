"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";

type AdminNavItem = { label: string; href: string; icon: string };

const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "🏠" },
  { label: "Aktuelles (News)", href: "/admin/news", icon: "📰" },
  { label: "Termine", href: "/admin/events", icon: "📅" },
  { label: "Seiten", href: "/admin/pages", icon: "📄" },
  { label: "Galerien", href: "/admin/galleries", icon: "🖼" },
  { label: "Mediathek", href: "/admin/media", icon: "📁" },
  { label: "Statistik", href: "/admin/analytics", icon: "📊" },
  { label: "Gästebuch", href: "/admin/guestbook", icon: "💬" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen border-r border-border bg-surface"
      aria-label="Admin-Seitenleiste"
    >
      <div className="p-4 border-b border-border">
        <Link href="/admin" className="flex items-center gap-3 group">
          <Image
            src="/brand/kolping-logo.svg"
            alt=""
            width={190}
            height={123}
            className="h-10 w-auto shrink-0"
          />
          <div className="min-w-0">
            <div className="font-semibold leading-tight text-foreground group-hover:text-brand-dark transition-colors">
              Redaktion
            </div>
            <div className="text-xs text-muted leading-tight truncate">{userName}</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 text-sm" aria-label="Admin-Navigation">
        <ul className="space-y-0.5">
          {ADMIN_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 font-medium transition-colors ${
                    active
                      ? "bg-brand text-white"
                      : "text-foreground hover:bg-brand-soft hover:text-brand-dark"
                  }`}
                >
                  <span aria-hidden className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border p-3 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-brand-soft hover:text-brand-dark transition-colors"
        >
          <span aria-hidden>↗</span>
          Zur Website
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-brand-soft hover:text-brand-dark"
          >
            <span aria-hidden>🚪</span>
            Abmelden
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminTopbar({ userName }: { userName: string }) {
  const pathname = usePathname();
  return (
    <header className="lg:hidden border-b border-border bg-surface sticky top-0 z-40">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/brand/kolping-logo.svg" alt="" width={190} height={123} className="h-8 w-auto" />
          <span className="font-semibold text-sm">Redaktion</span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm rounded-md border border-border px-3 py-1 hover:bg-brand-soft"
          >
            Abmelden
          </button>
        </form>
      </div>
      <nav className="px-4 pb-3 flex gap-1 overflow-x-auto text-xs" aria-label="Admin-Navigation">
        {ADMIN_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-md px-3 py-1.5 font-medium ${
                active ? "bg-brand text-white" : "text-muted hover:text-brand-dark"
              }`}
            >
              {item.icon} {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
