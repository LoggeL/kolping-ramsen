import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OpenLiveLink } from "@/components/admin/open-live-link";
import {
  updateGallery,
  deleteGallery,
  uploadImages,
  deleteImage,
  updateImageAlt,
} from "../actions";

export default async function EditGalleryPage(
  { params }: PageProps<"/admin/galleries/[id]">,
) {
  if (!(await getSession())) redirect("/admin/login");
  const { id } = await params;
  const gallery = await prisma.gallery.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!gallery) notFound();

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/galleries" className="text-sm text-brand-dark">← Zurück</Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Galerie bearbeiten</h1>
          <OpenLiveLink href={`/galerien/${gallery.slug}`} />
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Stammdaten</h2>
        <form action={updateGallery.bind(null, id)} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium mb-1">Titel</label>
            <input name="title" required defaultValue={gallery.title}
              className="w-full border border-border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input name="slug" defaultValue={gallery.slug}
              className="w-full border border-border rounded-md px-3 py-2 font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Datum</label>
            <input name="date" type="date"
              defaultValue={gallery.date?.toISOString().slice(0, 10) ?? ""}
              className="border border-border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Beschreibung</label>
            <textarea name="description" rows={3} defaultValue={gallery.description ?? ""}
              className="w-full border border-border rounded-md px-3 py-2" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={gallery.published} />
            Veröffentlicht
          </label>
          <button type="submit"
            className="rounded-md bg-brand text-white px-5 py-2.5 font-medium hover:bg-brand-dark">
            Speichern
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Bilder hochladen</h2>
        <form action={uploadImages.bind(null, id)} className="space-y-3">
          <input
            type="file"
            name="files"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="block"
          />
          <button type="submit"
            className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark">
            Hochladen
          </button>
          <p className="text-xs text-muted">
            Erlaubt: JPEG, PNG, WebP, GIF, AVIF — max. 10 MB pro Datei.
          </p>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Bilder ({gallery.images.length})</h2>
        {gallery.images.length === 0 ? (
          <p className="text-muted text-sm">Noch keine Bilder.</p>
        ) : (
          <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            {gallery.images.map((img) => (
              <li key={img.id} className="border border-border rounded-md overflow-hidden">
                <div className="relative aspect-square bg-zinc-100">
                  <Image
                    src={`/uploads/${img.filename}`}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <form action={updateImageAlt.bind(null, img.id)} className="p-2 space-y-2">
                  <input
                    name="alt"
                    defaultValue={img.alt}
                    placeholder="Alt-Text"
                    className="w-full text-xs border border-border rounded px-2 py-1"
                  />
                  <button type="submit" className="text-xs text-brand-dark hover:underline">
                    Alt-Text speichern
                  </button>
                </form>
                <form action={deleteImage.bind(null, img.id)} className="px-2 pb-2">
                  <button type="submit"
                    className="text-xs text-red-700 border border-red-200 rounded px-2 py-1 hover:bg-red-50">
                    Bild löschen
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-border pt-6">
        <form action={deleteGallery.bind(null, id)}>
          <button type="submit"
            className="text-sm text-red-700 border border-red-300 rounded-md px-4 py-2 hover:bg-red-50">
            Galerie löschen
          </button>
        </form>
      </section>
    </div>
  );
}
