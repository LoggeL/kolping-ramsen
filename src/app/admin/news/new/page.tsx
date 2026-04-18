import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { NewsForm } from "@/components/admin/news-form";
import { createNews } from "../actions";

export default async function NewNewsPage() {
  if (!(await getSession())) redirect("/admin/login");
  return (
    <div>
      <Link href="/admin/news" className="text-sm text-brand-dark">← Zurück</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Neue News</h1>
      <NewsForm action={createNews} submitLabel="Anlegen" />
    </div>
  );
}
