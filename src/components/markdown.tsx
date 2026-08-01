import { renderMarkdown } from "@/lib/markdown";
import { expandGalleryEmbeds } from "@/lib/gallery-embed";
import { MarkdownContent } from "./markdown-content";

export async function Markdown({
  source,
  className = "prose-content",
}: {
  source: string;
  className?: string;
}) {
  const expanded = await expandGalleryEmbeds(source ?? "");
  const html = renderMarkdown(expanded);
  return <MarkdownContent html={html} className={className} />;
}
