import { visit } from "unist-util-visit";

type HastProps = {
  hName: string;
  hProperties?: Record<string, unknown>;
};

type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
};

const FENCE_OPEN = /^:{3,}[ \t]*([A-Za-z0-9][A-Za-z0-9 -]*)?[ \t]*(?:\n|$)/;
const CLASS_TAG = /^[A-Za-z0-9][A-Za-z0-9 -]*$/;
const INLINE_RE =
  /!!(?:\{([A-Za-z0-9][A-Za-z0-9 -]*)\})?(?=\S)(.+?)(?<=\S)!!|\+\+(?=\S)(.+?)(?<=\S)\+\+|\|\|(?=\S)(.+?)(?<=\S)\|\||\^([^\s^]+)\^|~([^\s~]+)~|==(?:\{([A-Za-z0-9][A-Za-z0-9-]*)\})?(?=\S)(.+?)(?<=\S)==/g;

function hast(hName: string, className?: string[]): { data: HastProps } {
  const hProperties = className?.length ? { className } : undefined;
  return { data: { hName, hProperties } };
}

function wrap(type: string, hName: string, children: MdNode[], className?: string[]): MdNode {
  return { type, children, ...hast(hName, className) };
}

function parseClasses(tag: string | undefined) {
  return (tag ?? "").trim().split(/\s+/).filter(Boolean);
}

function parsePhrasing(text: string): MdNode[] {
  const nodes: MdNode[] = [];
  let last = 0;
  INLINE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = INLINE_RE.exec(text))) {
    if (match.index > last) {
      nodes.push({ type: "text", value: text.slice(last, match.index) });
    }
    if (match[2] !== undefined) {
      nodes.push(
        wrap("customSpan", "span", parsePhrasing(match[2]), [
          "custom-span",
          ...parseClasses(match[1]),
        ]),
      );
    } else if (match[3] !== undefined) {
      nodes.push(wrap("insertion", "ins", parsePhrasing(match[3])));
    } else if (match[4] !== undefined) {
      nodes.push(wrap("spoiler", "span", parsePhrasing(match[4]), ["spoiler"]));
    } else if (match[5] !== undefined) {
      nodes.push(wrap("superscript", "sup", [{ type: "text", value: match[5] }]));
    } else if (match[6] !== undefined) {
      nodes.push(wrap("subscript", "sub", [{ type: "text", value: match[6] }]));
    } else if (match[8] !== undefined) {
      const classes = ["custom-highlight"];
      if (match[7]) classes.push(`custom-highlight-${match[7]}`);
      nodes.push(wrap("highlight", "mark", parsePhrasing(match[8]), classes));
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    nodes.push({ type: "text", value: text.slice(last) });
  }
  return nodes.length ? nodes : [{ type: "text", value: text }];
}

function splitFenceParagraph(node: MdNode): { classes: string[]; rest: MdNode } | null {
  if (node.type !== "paragraph" || !node.children?.length) return null;
  const first = node.children[0];
  if (first.type !== "text" || first.value === undefined) return null;
  const match = first.value.match(FENCE_OPEN);
  if (!match) return null;
  const tag = (match[1] ?? "").trim();
  if (tag && !CLASS_TAG.test(tag)) return null;
  const restValue = first.value.slice(match[0].length);
  const children: MdNode[] = [];
  if (restValue) children.push({ type: "text", value: restValue });
  children.push(...node.children.slice(1));
  return {
    classes: parseClasses(tag),
    rest: { type: "paragraph", children },
  };
}

function transformFlow(parent: MdNode) {
  if (!parent.children?.length) return;
  for (const child of parent.children) {
    if (child.type === "list" && child.children) {
      for (const item of child.children) transformFlow(item);
    } else if (
      child.children &&
      (child.type === "blockquote" ||
        child.type === "listItem" ||
        child.type === "footnoteDefinition")
    ) {
      transformFlow(child);
    }
  }

  const next: MdNode[] = [];
  for (const child of parent.children) {
    const fence = splitFenceParagraph(child);
    if (!fence) {
      next.push(child);
      continue;
    }
    const inner = fence.rest.children?.length ? [fence.rest] : [];
    next.push(
      wrap("fencedDiv", "div", inner, ["fenced-div", ...fence.classes]),
    );
  }
  parent.children = next;
}

export function remarkExtendedMarkdown() {
  return (tree: MdNode) => {
    transformFlow(tree);
    visit(tree as never, "text", (node: MdNode, index, parent: MdNode | undefined) => {
      if (!parent?.children || index == null || node.value === undefined) return;
      if (parent.type === "link" || parent.type === "linkReference") return;
      if (!INLINE_RE.test(node.value)) {
        INLINE_RE.lastIndex = 0;
        return;
      }
      INLINE_RE.lastIndex = 0;
      const parts = parsePhrasing(node.value);
      if (parts.length === 1 && parts[0].type === "text") return;
      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}

export function extractNoteStyles(markdown: string) {
  const css: string[] = [];
  const without = markdown.replace(
    /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
    (_match, body: string) => {
      css.push(String(body));
      return "\n";
    },
  );
  return { markdown: without, css: css.join("\n") };
}
