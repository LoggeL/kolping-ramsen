"use client";

import { createPortal } from "react-dom";
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { useModalDialog } from "./use-modal-dialog";

type LightboxImage = {
  src: string;
  alt: string;
};

type LightboxState = {
  images: LightboxImage[];
  index: number;
};

function imageFromTrigger(trigger: HTMLButtonElement): LightboxImage | null {
  const image = trigger.querySelector("img");
  const source = trigger.dataset.lightboxSrc ?? image?.currentSrc ?? image?.getAttribute("src");
  if (!image || !source) return null;

  try {
    const url = new URL(source, window.location.href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return { src: url.href, alt: image.alt.trim() };
  } catch {
    return null;
  }
}

export function MarkdownContent({
  html,
  className,
}: {
  html: string;
  className: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement>(null);
  const returnFocusIndexRef = useRef(-1);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const closeLightbox = useCallback(() => {
    const triggerIndex = returnFocusIndexRef.current;
    setLightbox(null);
    window.setTimeout(() => {
      const triggers = contentRef.current?.querySelectorAll<HTMLButtonElement>(
        "[data-lightbox-trigger]",
      );
      triggers?.[triggerIndex]?.focus({ preventScroll: true });
    }, 0);
  }, []);
  const selectImage = useCallback((index: number) => {
    setLightbox((current) => (current ? { ...current, index } : current));
  }, []);

  const openLightbox = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest<HTMLButtonElement>("[data-lightbox-trigger]");
    if (!trigger || !contentRef.current?.contains(trigger)) return;

    const scope =
      trigger.closest<HTMLElement>("[data-lightbox-group]") ??
      trigger.closest<HTMLElement>("figure") ??
      contentRef.current;
    const entries = Array.from(
      scope.querySelectorAll<HTMLButtonElement>("[data-lightbox-trigger]"),
    )
      .map((button) => ({ button, image: imageFromTrigger(button) }))
      .filter(
        (entry): entry is { button: HTMLButtonElement; image: LightboxImage } =>
          entry.image !== null,
      );
    const index = entries.findIndex((entry) => entry.button === trigger);
    if (index < 0) return;

    event.preventDefault();
    returnFocusRef.current = trigger;
    returnFocusIndexRef.current = Array.from(
      contentRef.current.querySelectorAll<HTMLButtonElement>("[data-lightbox-trigger]"),
    ).indexOf(trigger);
    setLightbox({ images: entries.map((entry) => entry.image), index });
  };

  return (
    <>
      <div
        ref={contentRef}
        className={className}
        onClick={openLightbox}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {lightbox ? (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          returnFocusRef={returnFocusRef}
          onClose={closeLightbox}
          onSelect={selectImage}
        />
      ) : null}
    </>
  );
}

function ImageLightbox({
  images,
  index,
  returnFocusRef,
  onClose,
  onSelect,
}: {
  images: LightboxImage[];
  index: number;
  returnFocusRef: Readonly<{ current: HTMLElement | null }>;
  onClose: () => void;
  onSelect: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const current = images[index];
  const hasMultiple = images.length > 1;
  const previous = useCallback(
    () => onSelect((index - 1 + images.length) % images.length),
    [images.length, index, onSelect],
  );
  const next = useCallback(
    () => onSelect((index + 1) % images.length),
    [images.length, index, onSelect],
  );
  const handleKeys = useCallback(
    (event: KeyboardEvent) => {
      if (!hasMultiple) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }
    },
    [hasMultiple, next, previous],
  );

  useModalDialog({
    open: true,
    dialogRef,
    initialFocusRef: closeButtonRef,
    returnFocusRef,
    onClose,
    onKeyDown: handleKeys,
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#17130f]/95 p-2 sm:p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-lightbox-title"
        aria-describedby="image-lightbox-status"
        className="flex h-full max-h-[min(58rem,100%)] w-full max-w-7xl flex-col overflow-hidden border border-white/20 bg-[#17130f] text-white shadow-2xl"
      >
        <div className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-white/15 px-4">
          <h2 id="image-lightbox-title" className="font-serif text-base font-semibold">
            Bildansicht
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-white/25 px-3 text-sm transition-colors hover:bg-white/10"
          >
            Schließen
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m5 5 14 14M19 5 5 19" />
            </svg>
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3 sm:p-6">
          {hasMultiple ? (
            <button
              type="button"
              aria-label="Vorheriges Bild"
              onClick={previous}
              className="absolute left-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/55 text-2xl transition-colors hover:bg-brand sm:left-5"
            >
              <span aria-hidden="true">‹</span>
            </button>
          ) : null}

          <figure className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-3">
            <img
              key={current.src}
              src={current.src}
              alt={current.alt}
              loading="eager"
              decoding="async"
              draggable={false}
              className="min-h-0 max-h-full max-w-full flex-1 object-contain"
            />
            {current.alt ? (
              <figcaption className="max-w-4xl shrink-0 text-center font-serif text-sm text-white/80">
                {current.alt}
              </figcaption>
            ) : null}
          </figure>

          {hasMultiple ? (
            <button
              type="button"
              aria-label="Nächstes Bild"
              onClick={next}
              className="absolute right-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/55 text-2xl transition-colors hover:bg-brand sm:right-5"
            >
              <span aria-hidden="true">›</span>
            </button>
          ) : null}
        </div>

        <p
          id="image-lightbox-status"
          aria-live="polite"
          className="shrink-0 border-t border-white/15 px-4 py-3 text-center text-xs uppercase tracking-[0.16em] text-white/70"
        >
          Bild {index + 1} von {images.length}
        </p>
      </div>
    </div>,
    document.body,
  );
}
