import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NewsForm } from "@/components/admin/news-form";
import { OpenLiveLink } from "@/components/admin/open-live-link";
import { updateNews, deleteNews } from "../actions";

export default async function EditNewsPage(
  { params }: PageProps<"/admin/news/[id]">,
) {
  if (!(await getSession())) redirect("/admin/login");
  const { id } = await params;
  const item = await prisma.news.findUnique({ where: { id } });
  if (!item) notFound();

  const updateBound = updateNews.bind(null, id);
  const deleteBound = deleteNews.bind(null, id);

  return (
    <div>
      <Link href="/admin/news" className="text-sm text-brand-dark">← Zurück</Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">News bearbeiten</h1>
        <OpenLiveLink href={`/aktuelles/${item.slug}`} />
      </div>
      <NewsForm
        action={updateBound}
        submitLabel="Speichern"
        values={{
          title: item.title,
          slug: item.slug,
          date: item.date.toISOString().slice(0, 16),
          teaser: item.teaser,
          content: item.content,
          coverImage: item.coverImage,
          published: item.published,
        }}
      />
      <form action={deleteBound} className="mt-8 border-t border-border pt-6">
        <button
          type="submit"
          className="text-sm text-red-700 border border-red-300 rounded-md px-4 py-2 hover:bg-red-50"
        >
          News löschen
        </button>
      </form>
    </div>
  );
}
