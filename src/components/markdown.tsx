import { renderMarkdown } from "@/lib/markdown";
import { expandGalleryEmbeds } from "@/lib/gallery-embed";

export async function Markdown({
  source,
  className = "prose-content",
}: {
  source: string;
  className?: string;
}) {
  const expanded = await expandGalleryEmbeds(source ?? "");
  const html = renderMarkdown(expanded);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
