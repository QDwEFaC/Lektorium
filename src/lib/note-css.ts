import fs from "node:fs/promises";
import path from "node:path";
import { VAULT_DIR } from "@/lib/paths";

const SNIPPETS_DIR = path.join(VAULT_DIR, ".obsidian", "snippets");
const APPEARANCE = path.join(VAULT_DIR, ".obsidian", "appearance.json");

export async function loadEnabledSnippetCss() {
  let names: string[] = [];
  try {
    const raw = await fs.readFile(APPEARANCE, "utf8");
    const data = JSON.parse(raw) as { enabledCssSnippets?: unknown };
    names = Array.isArray(data.enabledCssSnippets)
      ? data.enabledCssSnippets.map(String)
      : [];
  } catch {
    return "";
  }
  const parts: string[] = [];
  for (const name of names) {
    if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
      continue;
    }
    try {
      parts.push(await fs.readFile(path.join(SNIPPETS_DIR, `${name}.css`), "utf8"));
    } catch {
      continue;
    }
  }
  return parts.join("\n");
}

export function scopeCss(css: string, scope: string) {
  const cleaned = css.replace(/<\/style/gi, "");
  return cleaned.replace(/(^|})([^{}@]+)\{/g, (full, lead: string, selectors: string) => {
    const scoped = selectors
      .split(",")
      .map((part) => {
        const selector = part.trim();
        if (!selector) return part;
        return `${scope} ${selector}`;
      })
      .join(", ");
    return `${lead}${scoped}{`;
  });
}
