export function lectureHref(slug: string) {
  return `/lectures/${slug.split("/").map(encodeURIComponent).join("/")}`;
}

export function assignmentHref(slug: string) {
  return `/assignments/${encodeURIComponent(slug)}`;
}

export type WikiToMarkdownOptions = {
  lectureSlug?: string;
};

import { ATTACHMENTS_FOLDER } from "@/lib/paths";

export function wikiToMarkdown(
  markdown: string,
  options: WikiToMarkdownOptions = {},
) {
  const withEmbeds = rewriteWikiEmbeds(markdown, options.lectureSlug);
  const withImages = rewriteMarkdownImages(withEmbeds, options.lectureSlug);
  return withImages.replace(
    /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g,
    (_match, target: string, alias?: string) => {
      const label = alias || target.split("/").pop() || target;
      const [folder, ...rest] = target.split("/");
      const slug = rest.length > 0 ? rest.join("/") : folder;
      if (folder === "Лекции") {
        return `[${label}](${lectureHref(slug)})`;
      }
      if (folder === "Задания") {
        return `[${label}](/assignments/${encodeURIComponent(slug)})`;
      }
      return `**${label}**`;
    },
  );
}

function rewriteWikiEmbeds(markdown: string, lectureSlug?: string) {
  return markdown.replace(
    /!\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g,
    (_match, target: string, alias?: string) => {
      const src = resolveEmbedSrc(target, lectureSlug);
      const label = alias || fileLabel(target);
      return `![${label}](${src})`;
    },
  );
}

function rewriteMarkdownImages(markdown: string, lectureSlug?: string) {
  return markdown.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt: string, rawSrc: string) => {
      const src = rawSrc.trim().replace(/\s+"[^"]*"$/, "").trim();
      if (isRemoteOrMediaUrl(src)) return match;
      return `![${alt}](${resolveEmbedSrc(src, lectureSlug)})`;
    },
  );
}

function resolveEmbedSrc(target: string, lectureSlug?: string) {
  const trimmed = target.trim().replaceAll("\\", "/").replace(/^\.\//, "");
  if (isRemoteOrMediaUrl(trimmed)) return trimmed;
  if (trimmed.startsWith("Лекции/")) return mediaHref(trimmed);

  const name = fileName(trimmed);
  const fromAttachmentsFolder =
    trimmed === ATTACHMENTS_FOLDER ||
    trimmed.startsWith(`${ATTACHMENTS_FOLDER}/`);

  if (lectureSlug && (fromAttachmentsFolder || !trimmed.includes("/"))) {
    return mediaHref(`Лекции/${lectureSlug}/${ATTACHMENTS_FOLDER}/${name}`);
  }
  if (lectureSlug && trimmed.includes("/")) {
    const parent = lectureSlug.split("/").slice(0, -1).join("/");
    const rel = parent ? `Лекции/${parent}/${trimmed}` : `Лекции/${trimmed}`;
    return mediaHref(rel);
  }
  if (fromAttachmentsFolder) return mediaHref(trimmed);
  return mediaHref(`${ATTACHMENTS_FOLDER}/${name}`);
}

function mediaHref(vaultRel: string) {
  return `/api/media/${vaultRel
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/")}`;
}

function isRemoteOrMediaUrl(src: string) {
  return /^(https?:|data:|\/\/)/i.test(src) || src.startsWith("/api/media/");
}

function fileName(target: string) {
  return target.split("/").filter(Boolean).at(-1) ?? target;
}

function fileLabel(target: string) {
  const name = fileName(target);
  return name.replace(/\.[^.]+$/, "") || name;
}
