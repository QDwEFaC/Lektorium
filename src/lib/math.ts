import katex from "katex";

/** A line that is only `$$`, optionally inside a blockquote. */
const DISPLAY_FENCE = /^[ \t]*(?:>[ \t]*)*\$\$[ \t]*$/;
/** `$$` on its own line, with at least one blockquote marker. */
const QUOTED_DISPLAY_OPEN = /^([ \t]*(?:>[ \t]*)+)\$\$[ \t]*$/;
const CODE_FENCE = /^[ \t]*(`{3,}|~{3,})/;

function isCodeFenceClose(line: string, open: string) {
  const match = line.match(CODE_FENCE);
  return Boolean(match && match[1][0] === open[0] && match[1].length >= open.length);
}

/**
 * remark-math treats `$$` like a fenced block. In a blockquote that only
 * works if every line of the fence has `>`. Notes often look like:
 *
 *   >$$
 *   \pi(a|s)=P(A_t=a|S_t=s)
 *   $$
 *
 * The opening fence then closes empty, and the leftover `$$` swallows the
 * rest of the note as one LaTeX block. Copy the opening quote onto the
 * body and closing fence so the formula stays in the quote and parses.
 */
export function normalizeQuotedDisplayMath(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let codeFence: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (codeFence) {
      out.push(line);
      if (isCodeFenceClose(line, codeFence)) codeFence = null;
      continue;
    }

    const fence = line.match(CODE_FENCE);
    if (fence && !DISPLAY_FENCE.test(line)) {
      codeFence = fence[1];
      out.push(line);
      continue;
    }

    const open = line.match(QUOTED_DISPLAY_OPEN);
    if (!open) {
      out.push(line);
      continue;
    }

    let close = -1;
    for (let j = i + 1; j < lines.length; j++) {
      if (CODE_FENCE.test(lines[j]) && !DISPLAY_FENCE.test(lines[j])) break;
      if (DISPLAY_FENCE.test(lines[j])) {
        close = j;
        break;
      }
    }

    if (close === -1) {
      out.push(line);
      continue;
    }

    const prefix = open[1].replace(/[ \t]*$/, " ");
    out.push(`${prefix}$$`);
    for (let j = i + 1; j < close; j++) {
      const body = lines[j].replace(/^[ \t]*(?:>[ \t]*)*/, "");
      out.push(`${prefix}${body}`);
    }
    out.push(`${prefix}$$`);
    i = close;
  }

  return out.join("\n");
}

const INLINE_MATH = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function renderInlineKatex(latex: string) {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
      strict: "ignore",
      output: "html",
    });
  } catch {
    return escapeHtml(latex);
  }
}

function katexToPlain(latex: string) {
  return decodeHtml(renderInlineKatex(latex).replace(/<[^>]+>/g, "")).trim();
}

function stripMarkdown(raw: string) {
  return raw
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g, (_m, target, alias) =>
      String(alias || String(target).split("/").pop() || target),
    )
    .replace(/\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g, (_m, target, alias) =>
      String(alias || String(target).split("/").pop() || target),
    )
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!!(?:\{[^}]+\})?(.+?)!!/g, "$1")
    .replace(/\+\+(.+?)\+\+/g, "$1")
    .replace(/\|\|(.+?)\|\|/g, "$1")
    .replace(/[*_~]+/g, "")
    .replace(/\\([\\`*_{}[\]()#+.!-])/g, "$1")
    .trim();
}

/** Plain text + KaTeX HTML for a heading that may contain `$...$`. */
export function formatHeadingWithMath(raw: string) {
  const slots: string[] = [];
  const tokenized = raw.replace(INLINE_MATH, (_match, display: string, inline: string) => {
    slots.push((display ?? inline).trim());
    return `\0MATH${slots.length - 1}\0`;
  });
  const cleaned = stripMarkdown(tokenized);
  const html = escapeHtml(cleaned).replace(/\0MATH(\d+)\0/g, (_match, index: string) =>
    renderInlineKatex(slots[Number(index)] ?? ""),
  );
  const text = cleaned
    .replace(/\0MATH(\d+)\0/g, (_match, index: string) =>
      katexToPlain(slots[Number(index)] ?? ""),
    )
    .trim();
  return {
    text: text || "Без названия",
    html: html || escapeHtml(text || "Без названия"),
  };
}
