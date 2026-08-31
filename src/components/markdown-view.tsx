import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { wikiToMarkdown } from "@/lib/links";
import { cn } from "@/lib/utils";

export function MarkdownView({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-3 text-[15px] leading-7 text-foreground",
        "[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight",
        "[&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:mt-4 [&_h3]:font-medium",
        "[&_p]:text-pretty",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
        "[&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        className,
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]}>{wikiToMarkdown(markdown)}</Markdown>
    </div>
  );
}
