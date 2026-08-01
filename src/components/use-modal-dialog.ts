"use client";

import { useEffect, useRef } from "react";

type ElementRef = Readonly<{ current: HTMLElement | null }>;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0 && !element.closest("[inert]"),
  );
}

export function useModalDialog({
  open,
  dialogRef,
  initialFocusRef,
  returnFocusRef,
  onClose,
  onKeyDown,
}: {
  open: boolean;
  dialogRef: ElementRef;
  initialFocusRef?: ElementRef;
  returnFocusRef?: ElementRef;
  onClose: () => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}) {
  const closeRef = useRef(onClose);
  const keyDownRef = useRef(onKeyDown);

  useEffect(() => {
    closeRef.current = onClose;
    keyDownRef.current = onKeyDown;
  }, [onClose, onKeyDown]);

  useEffect(() => {
    if (!open) return;

    const page = document.getElementById("site-shell");
    const previousInert = page?.inert ?? false;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const previouslyFocused =
      returnFocusRef?.current ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (page) page.inert = true;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    const focusFrame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const firstFocusable = focusableElements(dialog)[0];
      (initialFocusRef?.current ?? firstFocusable ?? dialog).focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }

      keyDownRef.current?.(event);
      if (event.defaultPrevented || event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = focusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown, true);
      if (page) page.inert = previousInert;
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.requestAnimationFrame(() => previouslyFocused?.focus());
    };
  }, [dialogRef, initialFocusRef, open, returnFocusRef]);
}
