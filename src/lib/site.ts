import { SITE_URL } from "./site-url";

export const SITE = {
  name: "Kolpingsfamilie Ramsen",
  shortName: "Kolping Ramsen",
  url: SITE_URL,
  description:
    "Die Kolpingsfamilie Ramsen — Verein, Termine, Aktuelles, Jugend, Familienkreis, Kapelle und mehr.",
  locale: "de_DE",
  contactEmail: "kolping-ramsen@gmx.de",
  leadershipTeam: ["Bettina Schach", "Heiko Schmitt-Sattler", "Sebastian Sattler"],
  venue: {
    name: "Pfarrheim der Kolpingsfamilie",
    street: "Klosterhof 7",
    locality: "67305 Ramsen",
  },
} as const;

export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: NavItem[];
  external?: boolean;
};

export type SiteSectionKey =
  | "vereinsbereiche"
  | "ueber-uns"
  | "rueckblick"
  | "galerien";

export type SiteSection = {
  label: string;
  href: string;
  eyebrow: string;
  description: string;
  links: NavItem[];
  expandInNavigation: boolean;
};

export const SITE_SECTIONS: Record<SiteSectionKey, SiteSection> = {
  vereinsbereiche: {
    label: "Vereinsbereiche",
    href: "/vereinsbereiche",
    eyebrow: "Gemeinsam aktiv",
    description:
      "Entdecke die Gruppen, Angebote und Menschen, die das Vereinsleben der Kolpingsfamilie Ramsen gestalten.",
    expandInNavigation: true,
    links: [
      {
        label: "Jugendgruppe",
        href: "/vereinsbereiche/jugendgruppe",
        description: "Aktionen, Projekte und Gemeinschaft für Kinder und Jugendliche.",
      },
      {
        label: "Familienkreis",
        href: "/vereinsbereiche/familienkreis",
        description: "Gemeinsame Freizeit, Feste und Angebote für Familien.",
      },
      {
        label: "Zeltlager",
        href: "/vereinsbereiche/zeltlager",
        description: "Geschichte und Erinnerungen aus vielen Jahren Zeltlager.",
      },
      {
        label: "Kolpingskapelle",
        href: "/vereinsbereiche/kolpingskapelle",
        description: "Musik, Konzerte und Neuigkeiten aus unserer Blaskapelle.",
      },
      {
        label: "Vorstandschaft",
        href: "/vereinsbereiche/vorstandschaft",
        description: "Ansprechpersonen und Aufgaben in der Kolpingsfamilie.",
      },
    ],
  },
  "ueber-uns": {
    label: "Über uns",
    href: "/ueber-uns",
    eyebrow: "Kolping in Ramsen",
    description:
      "Lerne unsere Gemeinschaft, ihre Geschichte und das Pfarrheim im Herzen von Ramsen kennen.",
    expandInNavigation: true,
    links: [
      {
        label: "Kolpingsfamilie Ramsen",
        href: "/ueber-uns/kolpingsfamilie-ramsen",
        description: "Wer wir sind, wofür wir stehen und wie unsere Gemeinschaft lebt.",
      },
      {
        label: "Pfarrheim",
        href: "/ueber-uns/pfarrheim",
        description: "Die Geschichte unseres Pfarr- und Kolpingheims.",
      },
      {
        label: "Vereinsdaten",
        href: "/ueber-uns/vereinsdaten",
        description: "Gründung, Meilensteine und wichtige Daten des Vereins.",
      },
      {
        label: "Adolf Kolping",
        href: "/ueber-uns/adolf-kolping",
        description: "Leben, Wirken und Ideen unseres Namensgebers.",
      },
    ],
  },
  rueckblick: {
    label: "Rückblick",
    href: "/rueckblick",
    eyebrow: "Aus unserem Vereinsleben",
    description:
      "Berichte, Bilder und Erinnerungen an Veranstaltungen, Reisen und besondere Momente.",
    expandInNavigation: true,
    links: [
      {
        label: "Jahresprogramm",
        href: "/rueckblick/jahresprogramm",
        description: "Feste, Ausflüge und Aktionen aus dem laufenden Vereinsjahr.",
      },
      {
        label: "Jugendaktivitäten",
        href: "/rueckblick/jugendaktivitaeten",
        description: "Projekte und Erlebnisse unserer Jugendgruppe.",
      },
      {
        label: "Prunksitzung",
        href: "/rueckblick/prunksitzung",
        description: "Bilder und Erinnerungen aus der Ramser Fasenacht.",
      },
      {
        label: "Familienkreis",
        href: "/rueckblick/familienkreis",
        description: "Gemeinsame Aktionen und Feste unserer Familienkreise.",
      },
      {
        label: "Presse",
        href: "/rueckblick/presse",
        description: "Berichte über die Kolpingsfamilie in der regionalen Presse.",
      },
      {
        label: "Ehrungen",
        href: "/rueckblick/ehrungen",
        description: "Jubiläen und Auszeichnungen verdienter Mitglieder.",
      },
      {
        label: "Städtereisen",
        href: "/rueckblick/staedtereisen",
        description: "Unsere Reiseziele und gemeinsamen Entdeckungen seit 1979.",
      },
      {
        label: "Reisen",
        href: "/rueckblick/reisen",
        description: "Ausführliche Berichte und Bilder vergangener Bildungsreisen.",
      },
      {
        label: "Trachtengruppe",
        href: "/rueckblick/trachtengruppe",
        description: "Erinnerungen an die Volkstanz- und Trachtengruppe.",
      },
    ],
  },
  galerien: {
    label: "Galerien",
    href: "/galerien",
    eyebrow: "Vereinsleben in Bildern",
    description:
      "Stöbere in unseren Fotoberichten aus dem Jahresprogramm, von Reisen, Festen und Aktionen.",
    expandInNavigation: false,
    links: [
      {
        label: "Jahresprogramm",
        href: "/rueckblick/jahresprogramm",
        description: "Fotoberichte von Festen, Ausflügen und Aktionen.",
      },
      {
        label: "Prunksitzung",
        href: "/rueckblick/prunksitzung",
        description: "Garden, Büttenreden und närrische Höhepunkte.",
      },
      {
        label: "Reisen",
        href: "/rueckblick/reisen",
        description: "Impressionen von Studien- und Bildungsreisen.",
      },
      {
        label: "Familienkreis",
        href: "/rueckblick/familienkreis",
        description: "Bilder gemeinsamer Aktionen für Groß und Klein.",
      },
      {
        label: "Jugendaktivitäten",
        href: "/rueckblick/jugendaktivitaeten",
        description: "Projekte, Theater und Erlebnisse der Jugend.",
      },
      {
        label: "Ehrungen",
        href: "/rueckblick/ehrungen",
        description: "Feierliche Momente und langjähriges Engagement.",
      },
    ],
  },
};

function sectionNavItem(section: SiteSection): NavItem {
  return {
    label: section.label,
    href: section.href,
    description: section.description,
    children: section.expandInNavigation ? section.links : undefined,
  };
}

export const MAIN_NAV: NavItem[] = [
  { label: "Startseite", href: "/" },
  { label: "Aktuelles", href: "/aktuelles" },
  { label: "Termine", href: "/termine" },
  sectionNavItem(SITE_SECTIONS.vereinsbereiche),
  sectionNavItem(SITE_SECTIONS["ueber-uns"]),
  sectionNavItem(SITE_SECTIONS.rueckblick),
  sectionNavItem(SITE_SECTIONS.galerien),
  { label: "Theater", href: "https://kolpingtheater-ramsen.de", external: true },
  { label: "Gästebuch", href: "/gaestebuch" },
  { label: "Kontakt", href: "/kontakt" },
];

export const NATIVE_SITE_PATHS = [
  "/",
  "/aktuelles",
  "/termine",
  "/termine.ics",
  "/gaestebuch",
  "/kontakt",
  ...Object.values(SITE_SECTIONS).map((section) => section.href),
] as const;

const NATIVE_SITE_PATH_SET: ReadonlySet<string> = new Set(NATIVE_SITE_PATHS);

export function isNativeSitePath(pathname: string): boolean {
  return NATIVE_SITE_PATH_SET.has(pathname);
}
