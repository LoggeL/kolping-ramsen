import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default function Page() {
  return (
    <>
      <section className="border-b border-rule bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid gap-10 md:grid-cols-[1.1fr_1fr] items-center">
          <div>
            <p className="eyebrow">Treu Kolping &middot; seit 1953</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-[1.1]">
              Kolpingsfamilie
              <span className="block italic text-brand-dark">Ramsen</span>
            </h1>
            <div className="rule-ornament mt-5 max-w-md" aria-hidden>
              <span>&#10086;</span>
            </div>
            <p className="mt-5 text-lg text-muted max-w-xl font-serif leading-relaxed">
              Gemeinschaft, Glaube, Tradition und gelebtes Miteinander —
              seit 1953 im Herzen von Ramsen.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/aktuelles"
                className="inline-flex items-center bg-brand text-white px-5 py-3 font-medium hover:bg-brand-dark transition"
              >
                Aktuelles lesen
              </Link>
              <Link
                href="/mitglied-werden"
                className="inline-flex items-center border border-brand text-brand-dark px-5 py-3 font-medium hover:bg-brand-soft transition"
              >
                Mitglied werden
              </Link>
            </div>
          </div>
          <figure className="relative aspect-[4/3] border border-rule bg-surface p-3 shadow-sm">
            <div className="relative h-full w-full border border-border overflow-hidden">
              <Image
                src="/images/ramsen-scenic.jpg"
                alt="Blick über Ramsen mit der katholischen Pfarrkirche Mariae Himmelfahrt"
                width={1600}
                height={1200}
                priority
                sizes="(max-width: 768px) 100vw, 540px"
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background px-3 text-xs italic text-muted">
              Ramsen in der Pfalz
            </figcaption>
            <a
              href="https://commons.wikimedia.org/wiki/File:Ramsen_07.JPG"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 bg-black/55 text-white text-[0.65rem] px-2 py-1 rounded-sm hover:bg-black/75 transition"
              title="Bildquelle und Lizenz"
            >
              © Immanuel Giel · CC BY-SA 3.0
            </a>
          </figure>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 grid gap-12 md:grid-cols-2">
        <div>
          <p className="eyebrow">Aus dem Vereinsleben</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold mb-5">Neuigkeiten</h2>
          <Suspense fallback={<p className="text-muted">Lade News...</p>}>
            <LatestNews />
          </Suspense>
        </div>
        <div>
          <p className="eyebrow">Im Kalender</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold mb-5">Nächste Termine</h2>
          <Suspense fallback={<p className="text-muted">Lade Termine...</p>}>
            <UpcomingEvents />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function LatestNews() {
  const session = await getSession();
  const news = await prisma.news.findMany({
    where: session ? {} : { published: true },
    orderBy: { date: "desc" },
    take: 4,
  });
  if (news.length === 0) {
    return <p className="text-muted">Noch keine News veröffentlicht.</p>;
  }
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {news.map((n) => (
        <li key={n.id} className="group">
          <Link href={`/aktuelles/${n.slug}`} className="block py-4">
            <div className="text-xs uppercase tracking-wider text-muted">
              {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(n.date)}
            </div>
            <div className="font-serif text-lg font-semibold mt-1 group-hover:text-brand-dark">
              {n.title}
            </div>
            <p className="text-sm text-muted mt-1 line-clamp-2 font-serif">{n.teaser}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function UpcomingEvents() {
  const session = await getSession();
  const events = await prisma.event.findMany({
    where: {
      ...(session ? {} : { published: true }),
      startDate: { gte: new Date() },
    },
    orderBy: { startDate: "asc" },
    take: 5,
  });
  if (events.length === 0) {
    return <p className="text-muted">Aktuell keine kommenden Termine.</p>;
  }
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {events.map((e) => {
        const day = new Intl.DateTimeFormat("de-DE", { day: "2-digit" }).format(e.startDate);
        const month = new Intl.DateTimeFormat("de-DE", { month: "short" })
          .format(e.startDate)
          .replace(".", "");
        return (
          <li key={e.id} className="py-4 flex gap-5 items-start">
            <div className="shrink-0 w-14 text-center border border-rule bg-brand-soft/60 py-1">
              <div className="font-serif text-xl leading-none font-semibold text-brand-dark">
                {day}
              </div>
              <div className="text-[0.65rem] uppercase tracking-widest text-muted mt-1">
                {month}
              </div>
            </div>
            <div className="min-w-0">
              <Link
                href={`/termine/${e.slug}`}
                className="font-serif text-lg font-medium hover:text-brand-dark"
              >
                {e.title}
              </Link>
              {e.location ? (
                <div className="text-xs text-muted mt-1 italic">{e.location}</div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
