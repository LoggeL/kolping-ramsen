import {
  SectionOverview,
  sectionOverviewMetadata,
} from "@/components/section-overview";

export const metadata = sectionOverviewMetadata("rueckblick");

export default function RueckblickPage() {
  return <SectionOverview sectionKey="rueckblick" />;
}
