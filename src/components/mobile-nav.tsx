"use client";

import { createPortal } from "react-dom";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { MobileNavigation } from "./site-navigation";
import { useModalDialog } from "./use-modal-dialog";

export function MobileNav({ brand }: { brand: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus({ preventScroll: true }), 0);
  }, []);

  useModalDialog({
    open,
    dialogRef,
    initialFocusRef: closeButtonRef,
    returnFocusRef: triggerRef,
    onClose: closeMenu,
  });

  return (
    <div className="xl:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Menü öffnen"
        aria-expanded={open}
        aria-controls="mobile-site-navigation"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border bg-surface transition-colors hover:border-brand hover:bg-brand-soft"
      >
        <span aria-hidden="true" className="space-y-1.5">
          <span className="block h-0.5 w-5 bg-foreground" />
          <span className="block h-0.5 w-5 bg-foreground" />
          <span className="block h-0.5 w-5 bg-foreground" />
        </span>
      </button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] bg-foreground/55 backdrop-blur-[2px]"
              onClick={(event) => {
                if (event.target === event.currentTarget) closeMenu();
              }}
            >
              <div
                ref={dialogRef}
                id="mobile-site-navigation"
                tabIndex={-1}
                className="absolute right-0 top-0 flex h-full w-[23rem] max-w-[92vw] flex-col bg-surface shadow-2xl"
                onClick={(event) => {
                  event.stopPropagation();
                  if (
                    event.target instanceof Element &&
                    event.target.closest("a")
                  ) {
                    closeMenu();
                  }
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-navigation-title"
              >
                <div className="h-1 w-full shrink-0 bg-brand" aria-hidden="true" />
                <div className="flex items-center gap-3 border-b border-rule p-4">
                  <div className="min-w-0 flex-1">{brand}</div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    aria-label="Menü schließen"
                    onClick={closeMenu}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-border transition-colors hover:border-brand hover:bg-brand-soft"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="m5 5 14 14M19 5 5 19" />
                    </svg>
                  </button>
                </div>
                <h2 id="mobile-navigation-title" className="sr-only">
                  Seitennavigation
                </h2>
                <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                  <MobileNavigation onNavigate={closeMenu} />
                </div>
                <div className="border-t border-rule px-5 py-4 text-center font-serif text-sm italic text-muted">
                  Treu Kolping
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
