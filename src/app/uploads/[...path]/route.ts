import { readManagedUpload } from "@/lib/media-storage";

const CONTENT_TYPES: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const relPath = `uploads/${path.join("/")}`;
  let bytes: Buffer | null = null;
  try {
    bytes = await readManagedUpload(relPath);
  } catch {}
  if (!bytes) return new Response("Not found", { status: 404 });

  const extension = path.at(-1)?.split(".").at(-1)?.toLowerCase() ?? "";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": CONTENT_TYPES[extension] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
