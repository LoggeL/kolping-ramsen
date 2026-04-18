import "server-only";
import Image from "next/image";
import { localImageExists } from "@/lib/local-image";

export function AdminThumb({
  src,
  alt = "",
  width = 64,
  height = 44,
}: {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
}) {
  const hasImage = src ? localImageExists(src) : false;
  if (!src || !hasImage) {
    return (
      <div
        aria-hidden
        style={{ width, height }}
        className="bg-zinc-100 border border-border rounded-sm flex items-center justify-center text-muted text-xs"
      >
        —
      </div>
    );
  }
  const isSvg = src.toLowerCase().endsWith(".svg");
  return (
    <div
      style={{ width, height }}
      className="relative shrink-0 overflow-hidden border border-border rounded-sm bg-zinc-100"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${width}px`}
        className="object-cover"
        unoptimized={isSvg}
      />
    </div>
  );
}
