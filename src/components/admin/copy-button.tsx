"use client";

import { useState } from "react";

export function CopyButton({
  value,
  className,
  children = "URL kopieren",
}: {
  value: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore
        }
      }}
      className={
        className ??
        "text-xs border border-border rounded px-2 py-1 hover:bg-brand-soft hover:text-brand-dark"
      }
      aria-live="polite"
    >
      {copied ? "Kopiert!" : children}
    </button>
  );
}
