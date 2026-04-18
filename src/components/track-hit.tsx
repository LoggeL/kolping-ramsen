"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function TrackHit() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    const dnt =
      typeof navigator !== "undefined" &&
      (navigator.doNotTrack === "1" ||
        (window as unknown as { doNotTrack?: string }).doNotTrack === "1");
    if (dnt) return;

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
    });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track", blob);
        return;
      }
    } catch {
      // fall through
    }

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
