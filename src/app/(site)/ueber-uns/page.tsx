import {
  SectionOverview,
  sectionOverviewMetadata,
} from "@/components/section-overview";

export const metadata = sectionOverviewMetadata("ueber-uns");

export default function UeberUnsPage() {
  return <SectionOverview sectionKey="ueber-uns" />;
}
