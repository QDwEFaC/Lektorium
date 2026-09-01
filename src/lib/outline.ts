import { visit } from "unist-util-visit";
import { lectureHref } from "@/lib/links";

export type OutlineNode = {
  id: string;
  text: string;
  depth: number;
  href?: string;
  children: OutlineNode[];
};

type MdNode = {
  type: string;
  depth?: number;
  value?: string;
  children?: MdNode[];
  data?: { hProperties?: Record<string, unknown> };
};

function cleanHeading(raw: string) {
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

function stripFences(markdown: string) {
  return markdown.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, "");
}

export function collectHeadings(markdown: string) {
  const items: { id: string; level: number; text: string }[] = [];
  let index = 0;
  for (const line of stripFences(markdown).split("\n")) {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match) continue;
    items.push({
      id: `h-${index++}`,
      level: match[1].length,
      text: cleanHeading(match[2]) || "Без названия",
    });
  }
  return items;
}

function nest(
  items: { id: string; level: number; text: string }[],
): OutlineNode[] {
  if (items.length === 0) return [];
  const base = Math.min(...items.map((item) => item.level));
  const root: OutlineNode[] = [];
  const stack: OutlineNode[] = [];
  for (const item of items) {
    const node: OutlineNode = {
      id: item.id,
      text: item.text,
      depth: item.level - base,
      children: [],
    };
    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
      stack.pop();
    }
    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(node);
    else root.push(node);
    stack.push(node);
  }
  return root;
}

/** Дерево заголовков: первый `#` (название лекции) пропускаем, `## Конспект` — уровень 0. */
export function lectureOutline(markdown: string): OutlineNode[] {
  const headings = collectHeadings(markdown);
  const rest = headings[0]?.level === 1 ? headings.slice(1) : headings;
  return nest(rest);
}

export function remarkHeadingIds() {
  return (tree: MdNode) => {
    let index = 0;
    visit(tree as never, "heading", (node: MdNode) => {
      const id = `h-${index++}`;
      node.data = node.data ?? {};
      node.data.hProperties = { ...node.data.hProperties, id };
    });
  };
}

export function taxonomySectionId(kind: "mod" | "lec", ...parts: string[]) {
  const slug = parts
    .join("-")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `${kind}-${slug || "item"}`;
}

export function subjectOutline(subject: {
  subject: string;
  modules: { module: string; lectures: { slug: string; title: string }[] }[];
}): OutlineNode[] {
  return subject.modules.map((mod) => ({
    id: taxonomySectionId("mod", subject.subject, mod.module),
    text: mod.module,
    depth: 0,
    children: mod.lectures.map((lecture) => ({
      id: taxonomySectionId("lec", lecture.slug),
      text: lecture.title,
      depth: 1,
      href: lectureHref(lecture.slug),
      children: [],
    })),
  }));
}
