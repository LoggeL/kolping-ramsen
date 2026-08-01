import {
  SectionOverview,
  sectionOverviewMetadata,
} from "@/components/section-overview";

export const metadata = sectionOverviewMetadata("vereinsbereiche");

export default function VereinsbereichePage() {
  return <SectionOverview sectionKey="vereinsbereiche" />;
}
