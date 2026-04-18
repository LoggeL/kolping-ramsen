import { redirect } from "next/navigation";
import { z } from "zod";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { newCaptcha, verifyCaptcha } from "@/lib/captcha";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Gästebuch",
  description: "Einträge im Gästebuch der Kolpingsfamilie Ramsen.",
};

const guestbookSchema = z.object({
  name: z.string().min(2).max(80).trim(),
  message: z.string().min(5).max(2000).trim(),
  consent: z.literal("on"),
  website: z.string().max(0).optional(),
  captchaAnswer: z.string().trim(),
  captchaToken: z.string().trim(),
});

async function submitEntry(formData: FormData) {
  "use server";
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limited = rateLimit(`guestbook:${ip}`, 2, 30 * 60 * 1000);
  if (!limited.ok) redirect("/gaestebuch?error=rate");

  const parsed = guestbookSchema.safeParse({
    name: formData.get("name"),
    message: formData.get("message"),
    consent: formData.get("consent"),
    website: formData.get("website") ?? "",
    captchaAnswer: formData.get("captchaAnswer") ?? "",
    captchaToken: formData.get("captchaToken") ?? "",
  });
  if (!parsed.success) redirect("/gaestebuch?error=invalid");

  if (!verifyCaptcha(parsed.data.captchaToken, parsed.data.captchaAnswer)) {
    redirect("/gaestebuch?error=captcha");
  }

  await prisma.guestbookEntry.create({
    data: {
      name: parsed.data.name,
      message: parsed.data.message,
      approved: false,
    },
  });
  revalidatePath("/gaestebuch");
  redirect("/gaestebuch?ok=1");
}

export default async function GuestbookPage(
  { searchParams }: PageProps<"/gaestebuch">,
) {
  const sp = await searchParams;
  const entries = await prisma.guestbookEntry.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const captcha = newCaptcha();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Gästebuch</h1>
      <p className="text-muted mb-8">
        Schön, dass Sie da sind! Hinterlassen Sie uns gerne ein paar Worte.
      </p>

      {sp.ok === "1" ? (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 mb-6">
          Vielen Dank! Ihr Eintrag wird nach Prüfung freigeschaltet.
        </div>
      ) : null}
      {sp.error === "invalid" ? (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6">
          Bitte Name (min. 2) und Nachricht (min. 5) angeben.
        </div>
      ) : null}
      {sp.error === "rate" ? (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6">
          Bitte später erneut versuchen.
        </div>
      ) : null}
      {sp.error === "captcha" ? (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6">
          Die Rechenaufgabe war leider nicht korrekt. Bitte erneut versuchen.
        </div>
      ) : null}

      <form action={submitEntry} className="space-y-4 border border-border rounded-lg p-5 mb-10">
        <div className="hidden" aria-hidden>
          <label>Bitte leer lassen<input type="text" name="website" tabIndex={-1} /></label>
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <input
            id="name" name="name" type="text" required
            className="w-full border border-border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">Nachricht</label>
          <textarea
            id="message" name="message" rows={4} required
            className="w-full border border-border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="captchaAnswer" className="block text-sm font-medium mb-1">
            Sicherheitsfrage: {captcha.question}
          </label>
          <input
            id="captchaAnswer"
            name="captchaAnswer"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required
            className="w-32 border border-border rounded-md px-3 py-2"
          />
          <input type="hidden" name="captchaToken" value={captcha.token} />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consent" required className="mt-1" />
          <span>Ich bin einverstanden, dass mein Eintrag (Name + Nachricht) veröffentlicht wird.</span>
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand text-white px-5 py-2.5 font-medium hover:bg-brand-dark transition"
        >
          Eintrag absenden
        </button>
      </form>

      <h2 className="text-2xl font-semibold mb-4">Einträge</h2>
      {entries.length === 0 ? (
        <p className="text-muted">Noch keine Einträge.</p>
      ) : (
        <ul className="space-y-4">
          {entries.map((e) => (
            <li key={e.id} className="border border-border rounded-lg p-4">
              <div className="flex items-baseline justify-between">
                <strong>{e.name}</strong>
                <time className="text-xs text-muted" dateTime={e.createdAt.toISOString()}>
                  {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(e.createdAt)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap">{e.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
