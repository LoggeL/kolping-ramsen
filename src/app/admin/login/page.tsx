import { redirect } from "next/navigation";
import { authenticate } from "@/lib/auth";
import { createSession, getSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const metadata = {
  title: "Anmelden",
  robots: { index: false, follow: false },
};

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limited = rateLimit(`login:${ip}`, 5, 5 * 60 * 1000);
  if (!limited.ok) {
    redirect(`/admin/login?error=rate&retry=${limited.retryIn}`);
  }

  if (!email || !password) {
    redirect("/admin/login?error=missing");
  }

  const user = await authenticate(email, password);
  if (!user) {
    redirect("/admin/login?error=invalid");
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role === "admin" ? "admin" : "redakteur",
  });
  redirect("/admin");
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const session = await getSession();
  if (session) redirect("/admin");

  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const retry = typeof sp.retry === "string" ? sp.retry : null;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Redaktions-Login</h1>
      <form action={loginAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            E-Mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Passwort
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        {error === "invalid" ? (
          <p className="text-sm text-red-600">Falsche E-Mail oder Passwort.</p>
        ) : null}
        {error === "missing" ? (
          <p className="text-sm text-red-600">Bitte E-Mail und Passwort ausfüllen.</p>
        ) : null}
        {error === "rate" ? (
          <p className="text-sm text-red-600">
            Zu viele Versuche. Bitte in {retry}s erneut probieren.
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-md bg-brand text-white py-2 font-medium hover:bg-brand-dark transition"
        >
          Anmelden
        </button>
      </form>
    </div>
  );
}
