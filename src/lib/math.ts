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
