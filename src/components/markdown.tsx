import { renderMarkdown } from "@/lib/markdown";

export function Markdown({
  source,
  className = "prose-content",
}: {
  source: string;
  className?: string;
}) {
  const html = renderMarkdown(source);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
