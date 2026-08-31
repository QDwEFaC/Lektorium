export function wikiToMarkdown(markdown: string) {
  return markdown.replace(
    /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g,
    (_match, target: string, alias?: string) => {
      const label = alias || target.split("/").pop() || target;
      const [folder, ...rest] = target.split("/");
      const slug = rest.length > 0 ? rest.join("/") : folder;
      if (folder === "Лекции") {
        return `[${label}](/lectures/${encodeURIComponent(slug)})`;
      }
      if (folder === "Задания") {
        return `[${label}](/assignments/${encodeURIComponent(slug)})`;
      }
      return `**${label}**`;
    },
  );
}

export function lectureHref(slug: string) {
  return `/lectures/${encodeURIComponent(slug)}`;
}

export function assignmentHref(slug: string) {
  return `/assignments/${encodeURIComponent(slug)}`;
}
