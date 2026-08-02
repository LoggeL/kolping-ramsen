import { redirect } from "next/navigation";
import { z } from "zod";
import type { Metadata } from "next";
import { sendMail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { SITE } from "@/lib/site";
import { rateLimitKey } from "@/lib/client-ip";
import { mailDeliveryFailureCode } from "@/lib/smtp-config";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontaktieren Sie die Kolpingsfamilie Ramsen.",
};

const contactSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  email: z.email().max(160),
  subject: z
    .string()
    .min(2)
    .max(160)
    .trim()
    .refine((value) => !/[\r\n]/.test(value), "Ungültiger Betreff"),
  message: z.string().min(10).max(5000).trim(),
  consent: z.literal("on"),
  website: z.string().max(0).optional(),
});

async function contactAction(formData: FormData) {
  "use server";
  const hdrs = await headers();
  const limited = rateLimit(rateLimitKey("contact", hdrs), 3, 10 * 60 * 1000);
  if (!limited.ok) redirect("/kontakt?error=rate");

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    consent: formData.get("consent"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) redirect("/kontakt?error=invalid");

  const { name, email, subject, message } = parsed.data;
  try {
    await sendMail({
      to: process.env.CONTACT_TO ?? SITE.contactEmail,
      subject: `[Kontakt] ${subject}`,
      text: `Von: ${name} <${email}>\n\n${message}`,
      replyTo: email,
    });
  } catch (error) {
    // Only log a fixed category: SMTP errors may contain recipient PII.
    console.error(`[contact] Mail delivery failed: ${mailDeliveryFailureCode(error)}`);
    redirect("/kontakt?error=delivery");
  }
  redirect("/kontakt?ok=1");
}

export default async function ContactPage(
  { searchParams }: PageProps<"/kontakt">,
) {
  const sp = await searchParams;
  const ok = sp.ok === "1";
  const error = typeof sp.error === "string" ? sp.error : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Kontakt</h1>
      <p className="text-muted mb-8">
        Sie haben Fragen, Anregungen oder möchten Mitglied werden? Schreiben Sie uns.
      </p>

      <section
        aria-labelledby="contact-details-title"
        className="mb-10 border border-border bg-surface p-5 sm:p-6"
      >
        <h2 id="contact-details-title" className="font-serif text-2xl font-semibold">
          Direkter Kontakt
        </h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Leitungsteam
            </h3>
            <ul className="mt-2 space-y-1 font-serif">
              {SITE.leadershipTeam.map((name) => <li key={name}>{name}</li>)}
            </ul>
            <a
              className="mt-3 inline-flex min-h-10 items-center text-brand-dark underline underline-offset-4"
              href={`mailto:${SITE.contactEmail}`}
            >
              {SITE.contactEmail}
            </a>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Pfarrheim
            </h3>
            <address className="mt-2 font-serif not-italic leading-relaxed">
              {SITE.venue.name}<br />
              {SITE.venue.street}<br />
              {SITE.venue.locality}
            </address>
          </div>
        </div>
      </section>

      {ok ? (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 mb-6">
          Vielen Dank! Ihre Nachricht wurde versendet.
        </div>
      ) : null}
      {error === "invalid" ? (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6">
          Bitte alle Felder korrekt ausfüllen.
        </div>
      ) : null}
      {error === "rate" ? (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6">
          Zu viele Anfragen. Bitte später erneut versuchen.
        </div>
      ) : null}
      {error === "delivery" ? (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6">
          Ihre Nachricht konnte derzeit nicht versendet werden. Bitte versuchen Sie es
          später erneut oder schreiben Sie direkt an{" "}
          <a className="underline" href={`mailto:${SITE.contactEmail}`}>
            {SITE.contactEmail}
          </a>
          .
        </div>
      ) : null}

      <form action={contactAction} className="space-y-4">
        {/* Honeypot */}
        <div className="hidden" aria-hidden>
          <label>
            Bitte leer lassen
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <input
            id="name" name="name" type="text" required
            className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">E-Mail</label>
          <input
            id="email" name="email" type="email" required
            className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">Betreff</label>
          <input
            id="subject" name="subject" type="text" required
            className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">Nachricht</label>
          <textarea
            id="message" name="message" rows={6} required
            className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consent" required className="mt-1" />
          <span>
            Ich habe die <a href="/datenschutz" className="text-brand-dark underline">Datenschutzerklärung</a>{" "}
            gelesen und bin mit der Verarbeitung meiner Angaben zur Bearbeitung dieser Nachricht einverstanden.
          </span>
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand text-white px-5 py-2.5 font-medium hover:bg-brand-dark transition"
        >
          Nachricht senden
        </button>
      </form>
    </div>
  );
}
