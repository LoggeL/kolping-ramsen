"use client";

import { useEffect, useState } from "react";
import { SidebarBrand, SidebarNav } from "./site-sidebar";
import { IconClose } from "./admin/icons";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Menü öffnen"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="p-2 rounded-md border border-border hover:bg-brand-soft"
      >
        <span className="block w-5 h-0.5 bg-foreground mb-1" />
        <span className="block w-5 h-0.5 bg-foreground mb-1" />
        <span className="block w-5 h-0.5 bg-foreground" />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="p-3 border-b border-border flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <SidebarBrand onNavigate={() => setOpen(false)} />
              </div>
              <button
                type="button"
                aria-label="Menü schließen"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md border border-border hover:bg-brand-soft shrink-0"
              >
                <IconClose width={16} height={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <SidebarNav onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
