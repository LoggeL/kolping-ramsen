import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { PageForm } from "@/components/admin/page-form";
import { createPage } from "../actions";

export default async function NewPagePage() {
  if (!(await getSession())) redirect("/admin/login");
  return (
    <div>
      <Link href="/admin/pages" className="text-sm text-brand-dark">← Zurück</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Neue Seite</h1>
      <PageForm action={createPage} submitLabel="Anlegen" />
    </div>
  );
}
