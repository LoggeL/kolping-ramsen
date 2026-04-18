"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type Img = { src: string; alt: string };

export function Lightbox({ images }: { images: Img[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const next = useCallback(
    () => setOpen((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length],
  );
  const prev = useCallback(
    () => setOpen((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, next, prev]);

  return (
    <>
      <ul className="mt-8 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, idx) => (
          <li key={img.src}>
            <button
              type="button"
              onClick={() => setOpen(idx)}
              className="block w-full aspect-square relative bg-zinc-100 rounded overflow-hidden hover:opacity-90"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {open !== null ? (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Schließen"
            className="absolute top-4 right-4 text-white text-3xl"
            onClick={close}
          >
            ✕
          </button>
          <button
            type="button"
            aria-label="Vorheriges"
            className="absolute left-4 text-white text-4xl px-3 py-2"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Nächstes"
            className="absolute right-4 text-white text-4xl px-3 py-2"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            ›
          </button>
          <div
            className="relative max-w-[90vw] max-h-[85vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[open].src}
              alt={images[open].alt}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
