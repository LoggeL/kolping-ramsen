export const SITE = {
  name: "Kolpingsfamilie Ramsen",
  shortName: "Kolping Ramsen",
  url: "https://kolping-ramsen.de",
  description:
    "Die Kolpingsfamilie Ramsen — Verein, Termine, Aktuelles, Jugend, Familienkreis, Kapelle und mehr.",
  locale: "de_DE",
  contactEmail: "info@kolping-ramsen.de",
} as const;

export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
  external?: boolean;
};

export const MAIN_NAV: NavItem[] = [
  { label: "Startseite", href: "/" },
  { label: "Aktuelles", href: "/aktuelles" },
  { label: "Termine", href: "/termine" },
  {
    label: "Vereinsbereiche",
    href: "/vereinsbereiche",
    children: [
      { label: "Jugendgruppe", href: "/vereinsbereiche/jugendgruppe" },
      { label: "Familienkreis", href: "/vereinsbereiche/familienkreis" },
      { label: "Zeltlager", href: "/vereinsbereiche/zeltlager" },
      { label: "Kolpingskapelle", href: "/vereinsbereiche/kolpingskapelle" },
      { label: "Vorstandschaft", href: "/vereinsbereiche/vorstandschaft" },
    ],
  },
  {
    label: "Über uns",
    href: "/ueber-uns",
    children: [
      { label: "Kolpingsfamilie Ramsen", href: "/ueber-uns/kolpingsfamilie-ramsen" },
      { label: "Pfarrheim", href: "/ueber-uns/pfarrheim" },
      { label: "Vereinsdaten", href: "/ueber-uns/vereinsdaten" },
      { label: "Adolf Kolping", href: "/ueber-uns/adolf-kolping" },
    ],
  },
  {
    label: "Rückblick",
    href: "/rueckblick",
    children: [
      { label: "Jahresprogramm", href: "/rueckblick/jahresprogramm" },
      { label: "Jugendaktivitäten", href: "/rueckblick/jugendaktivitaeten" },
      { label: "Prunksitzung", href: "/rueckblick/prunksitzung" },
      { label: "Familienkreis", href: "/rueckblick/familienkreis" },
      { label: "Presse", href: "/rueckblick/presse" },
      { label: "Ehrungen", href: "/rueckblick/ehrungen" },
      { label: "Städtereisen", href: "/rueckblick/staedtereisen" },
      { label: "Reisen", href: "/rueckblick/reisen" },
      { label: "Trachtengruppe", href: "/rueckblick/trachtengruppe" },
    ],
  },
  { label: "Theater", href: "https://kolpingtheater-ramsen.de", external: true },
  { label: "Galerien", href: "/galerien" },
  { label: "Mitglied werden", href: "/mitglied-werden" },
  { label: "Gästebuch", href: "/gaestebuch" },
  { label: "Kontakt", href: "/kontakt" },
];
