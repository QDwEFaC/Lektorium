/**
 * Контракт локального разбора страницы в конспект.
 *
 * Само приложение этого не делает: здесь только форма заметки. Алгоритм
 * чтения чужого сайта каждый подключает сам (папка `impl.local/`, в git её нет).
 */

/** Один HTML-файл сохранённой страницы или iframe. */
export type HtmlFile = {
  name: string;
  html: string;
};

/** Картинка, которую разбор хочет положить во временный захват. */
export type StagedImage = {
  name: string;
  bytes: Buffer;
};

/**
 * Результат разбора.
 *
 * - `title` — заголовок черновика (можно править в форме).
 * - `markdown` — тело конспекта; картинки лучше сразу как `![[Вложения/файл]]`.
 * - `excerpt` — короткое описание.
 * - `source` — исходный URL, если был.
 * - `stub: true` — текста нет, форма всё равно покажет черновик.
 * - `captureId` — UUID временной папки с файлами картинок (их заберёт сохранение лекции).
 * - `images` — имена файлов, уже лежащих в этой папке или готовых к записи.
 * - `stagedImages` — байты картинок, если разбор ещё не писал их на диск.
 * - `error` — что сказать пользователю.
 */
export type ParsePageResult = {
  title: string;
  markdown: string;
  excerpt: string;
  source: string;
  stub: boolean;
  captureId?: string;
  images?: string[];
  stagedImages?: StagedImage[];
  error?: string;
};

/** Вход: ссылка на страницу. */
export type ParseFromUrlInput = {
  url: string;
};

/**
 * Вход: файлы «Веб-страница, полностью» (HTML + картинки) и необязательный URL.
 * Имена лучше с относительным путём (`папка_files/iframe.html`).
 */
export type ParseFromHtmlInput = {
  htmlFiles: HtmlFile[];
  images?: StagedImage[];
  source?: string;
};

export type PageParseImpl = {
  pageParseAvailable: boolean;
  parseFromUrl: (url: string) => Promise<ParsePageResult>;
  parseFromHtmlBundle: (input: ParseFromHtmlInput) => Promise<ParsePageResult> | ParsePageResult;
  wikiEmbedsFromImages: (
    markdown: string,
    names: string[],
    aliases?: Map<string, string>,
  ) => string;
  fetchAuthorizedImages: (
    urls: string[],
    referer?: string,
  ) => Promise<{ name: string; bytes: Buffer }[]>;
};
