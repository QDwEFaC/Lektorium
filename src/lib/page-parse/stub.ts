import type { PageParseImpl, ParseFromHtmlInput, ParsePageResult } from "./types";

const MISSING =
  "Локальный модуль разбора страниц не подключён. Вставь конспект вручную или положи свою реализацию в src/lib/page-parse/impl.local/ (вход и выход описаны в src/lib/page-parse/).";

function emptyResult(source: string): ParsePageResult {
  return {
    title: "",
    markdown: MISSING,
    excerpt: "Разбор страниц не установлен",
    source,
    stub: true,
    error: MISSING,
  };
}

export const pageParseAvailable = false;

export async function parseFromUrl(url: string): Promise<ParsePageResult> {
  return emptyResult(url.trim());
}

export function parseFromHtmlBundle(input: ParseFromHtmlInput): ParsePageResult {
  return emptyResult(input.source?.trim() || "");
}

export function wikiEmbedsFromImages(
  markdown: string,
  _names: string[],
  _aliases?: Map<string, string>,
) {
  return markdown;
}

export async function fetchAuthorizedImages(
  _urls: string[],
  _referer?: string,
): Promise<{ name: string; bytes: Buffer }[]> {
  return [];
}

export const stubImpl = {
  pageParseAvailable,
  parseFromUrl,
  parseFromHtmlBundle,
  wikiEmbedsFromImages,
  fetchAuthorizedImages,
} satisfies PageParseImpl;
