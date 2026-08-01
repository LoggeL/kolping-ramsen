import {
  SectionOverview,
  sectionOverviewMetadata,
} from "@/components/section-overview";

export const metadata = sectionOverviewMetadata("galerien");

export default function GalerienPage() {
  return <SectionOverview sectionKey="galerien" />;
}
