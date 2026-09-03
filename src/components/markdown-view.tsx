import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
  extractNoteStyles,
  remarkExtendedMarkdown,
} from "@/lib/extended-markdown";
import { wikiToMarkdown } from "@/lib/links";
import { normalizeQuotedDisplayMath } from "@/lib/math";
import { loadEnabledSnippetCss, scopeCss } from "@/lib/note-css";
import { remarkHeadingIds } from "@/lib/outline";
import { cn } from "@/lib/utils";

const NOTE_SCOPE = ".lektorium-md";

export async function MarkdownView({
  markdown,
  lectureSlug,
  className,
}: {
  markdown: string;
  lectureSlug?: string;
  className?: string;
}) {
  const { markdown: withoutStyle, css: noteCss } = extractNoteStyles(markdown);
  const withMath = normalizeQuotedDisplayMath(withoutStyle);
  const snippetCss = await loadEnabledSnippetCss();
  const css = scopeCss([snippetCss, noteCss].filter(Boolean).join("\n"), NOTE_SCOPE);

  return (
    <div
      className={cn(
        "lektorium-md space-y-3 text-[15px] leading-7 text-foreground",
        "[&_h1]:scroll-mt-20 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight",
        "[&_h2]:mt-6 [&_h2]:scroll-mt-20 [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:mt-4 [&_h3]:scroll-mt-20 [&_h3]:font-medium",
        "[&_h4]:mt-3 [&_h4]:scroll-mt-20 [&_h4]:font-medium",
        "[&_h5]:scroll-mt-20 [&_h6]:scroll-mt-20",
        "[&_p]:text-pretty",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
        "[&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_img]:max-w-full [&_img]:rounded-lg",
        "[&_.katex]:text-[1.05em] [&_.katex]:text-foreground",
        "[&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1",
        "[&_ins]:underline",
        "[&_.fenced-div]:my-3",
        className,
      )}
    >
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <Markdown
        remarkPlugins={[
          remarkGfm,
          remarkMath,
          remarkExtendedMarkdown,
          remarkHeadingIds,
        ]}
        rehypePlugins={[[rehypeKatex, { strict: "ignore" }]]}
      >
        {wikiToMarkdown(withMath, { lectureSlug })}
      </Markdown>
    </div>
  );
}
