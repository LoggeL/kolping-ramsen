import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { createGallery } from "../actions";

export default async function NewGalleryPage() {
  if (!(await getSession())) redirect("/admin/login");
  return (
    <div>
      <Link href="/admin/galleries" className="text-sm text-brand-dark">← Zurück</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Neue Galerie</h1>
      <form action={createGallery} className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">Titel</label>
          <input name="title" required className="w-full border border-border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug (optional)</label>
          <input name="slug" className="w-full border border-border rounded-md px-3 py-2 font-mono text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Datum</label>
          <input name="date" type="date" className="border border-border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Beschreibung</label>
          <textarea name="description" rows={3} className="w-full border border-border rounded-md px-3 py-2" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked />
          Veröffentlicht
        </label>
        <button type="submit"
          className="rounded-md bg-brand text-white px-5 py-2.5 font-medium hover:bg-brand-dark">
          Anlegen und Bilder hochladen
        </button>
      </form>
    </div>
  );
}
