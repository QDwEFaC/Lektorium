/**
 * Разбор страницы → черновик лекции.
 *
 * Это не часть продукта. В репозитории только контракт. Реализацию каждый
 * держит у себя в `impl.local/` (каталог в .gitignore).
 *
 * ## Вход
 *
 * 1. `parseFromUrl(url)` — строка `http(s)://…`.
 * 2. `parseFromHtmlBundle({ htmlFiles, images?, source? })` —
 *    HTML сохранённой страницы и, по желанию, файлы картинок и исходный URL.
 *
 * ## Выход (`ParsePageResult`)
 *
 * `title`, `markdown`, `excerpt`, `source`, `stub`,
 * плюс по желанию `captureId` / `images` / `stagedImages` / `error`.
 *
 * Картинки либо уже во временной папке (`captureId` + `images`), либо
 * байтами в `stagedImages` — маршрут `/api/capture` запишет их сам.
 * В markdown предпочтительны wiki-вставки `![[Вложения/имя]]`.
 *
 * Если своей реализации нет, `npm install` кладёт в `impl.local/` реэкспорт
 * заглушки: конспект вставляют вручную.
 */

export type {
  HtmlFile,
  PageParseImpl,
  ParseFromHtmlInput,
  ParseFromUrlInput,
  ParsePageResult,
  StagedImage,
} from "./types";

export {
  fetchAuthorizedImages,
  pageParseAvailable,
  parseFromHtmlBundle,
  parseFromUrl,
  wikiEmbedsFromImages,
} from "./impl.local";

export function isHtmlFilename(name: string, type = "") {
  if (/html|xml/i.test(type)) return true;
  return /\.html?$|\.xhtml$/i.test(name);
}

export function isImageFilename(name: string, type = "") {
  if (/^image\//i.test(type) && !/svg\+xml/i.test(type)) return true;
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
}
