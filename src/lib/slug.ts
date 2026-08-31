const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function assertSafeSlug(slug: string) {
  if (
    !slug ||
    slug.includes("..") ||
    slug.includes("/") ||
    slug.includes("\\") ||
    slug.includes("\0")
  ) {
    throw new Error("Некорректное имя файла");
  }
}

export function noteFileName(title: string) {
  const cleaned = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 90);
  if (!cleaned) {
    throw new Error("Нужно название");
  }
  return cleaned;
}

export function folderSlug(title: string) {
  const latin = title
    .trim()
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join("");
  const slug = latin
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "zadanie";
}

export function nextIndex(existing: string[]) {
  let max = 0;
  for (const name of existing) {
    const match = name.match(/^(\d+)/);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return String(max + 1).padStart(2, "0");
}

export function numberedTitle(index: string, title: string) {
  const cleaned = noteFileName(title).replace(/^\d+\s*[—-]\s*/, "");
  return `${index} — ${cleaned}`;
}
