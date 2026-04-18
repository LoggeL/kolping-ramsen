import { getSession } from "@/lib/session";
import { AdminSidebar, AdminTopbar } from "@/components/admin/admin-sidebar";

export const metadata = {
  title: "Redaktion",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    // login page renders without chrome
    return <div className="mx-auto max-w-md px-4 py-12">{children}</div>;
  }
  return (
    <div className="min-h-screen bg-background lg:flex">
      <AdminSidebar userName={session.name} />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <AdminTopbar userName={session.name} />
        <main className="flex-1 px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
