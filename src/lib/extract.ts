import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

export type ExtractResult = {
  title: string;
  markdown: string;
  excerpt: string;
  source: string;
  stub: boolean;
  suggestedSubject?: string;
};

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
};

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

turndown.remove(["script", "style", "noscript", "iframe", "nav", "footer"]);

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseOpenEdxCourseId(rawUrl: string) {
  try {
    return decodeURIComponent(rawUrl).match(/course-v1:[^\s/?#]+/)?.[0] ?? null;
  } catch {
    return rawUrl.match(/course-v1:[^\s/?#]+/)?.[0] ?? null;
  }
}

function lmsBase(pageUrl: URL) {
  const host = pageUrl.hostname;
  if (host === "apps.skillfactory.ru" || host.endsWith(".skillfactory.ru")) {
    return "https://lms.skillfactory.ru";
  }
  if (host.startsWith("apps.")) {
    return `${pageUrl.protocol}//lms.${host.slice("apps.".length)}`;
  }
  return pageUrl.origin;
}

async function openEdxCourseName(pageUrl: URL, courseId: string) {
  try {
    const response = await fetch(
      `${lmsBase(pageUrl)}/api/enrollment/v1/course/${courseId}`,
      {
        headers: FETCH_HEADERS,
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { course_name?: unknown };
    const name = String(data.course_name ?? "").trim();
    return name || null;
  } catch {
    return null;
  }
}

function isSpaShell(document: Document) {
  const mount = document.querySelector("#root, #app, #__next");
  const text = document.body?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  if (mount && !mount.textContent?.trim() && text.length < 80) {
    return true;
  }
  return false;
}

function stripTracking(markdown: string) {
  return markdown
    .replace(
      /!\[[^\]]*\]\(\s*https?:\/\/(?:mc\.yandex\.(?:ru|com)|www\.googletagmanager\.com|www\.google-analytics\.com|googleads\.g\.doubleclick\.net)[^)]*\)/gi,
      "",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function visibleText(markdown: string) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*`_|~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function closedPageStub(source: string, courseName?: string | null) {
  const pageUrl = new URL(source);
  const isSkillfactory = pageUrl.hostname.endsWith("skillfactory.ru");
  const title =
    courseName ||
    (isSkillfactory ? "Skillfactory" : pageUrl.hostname);
  const lines = [
    "Текст урока с этой страницы не читается автоматически.",
    "",
    isSkillfactory
      ? "Skillfactory отдаёт пустую оболочку приложения: сам конспект появляется только после входа в браузере."
      : "Страница собрана скриптами или закрыта входом — в HTML нет основного текста.",
  ];
  if (courseName) {
    lines.push("", `Курс: ${courseName}`);
  }
  lines.push(
    "",
    `Источник: ${source}`,
    "",
    "Скопируй конспект со страницы курса и вставь его в поле ниже — карточку всё равно можно сохранить.",
  );
  return {
    title,
    markdown: lines.join("\n"),
    excerpt: "Нужно вставить конспект вручную",
    source,
    stub: true as const,
    suggestedSubject: courseName || undefined,
  };
}

export async function urlToMarkdown(rawUrl: string): Promise<ExtractResult> {
  const source = rawUrl.trim();
  if (!isHttpUrl(source)) {
    throw new Error("Нужен адрес http или https");
  }

  const pageUrl = new URL(source);
  const courseId = parseOpenEdxCourseId(source);
  const courseNamePromise = courseId
    ? openEdxCourseName(pageUrl, courseId)
    : Promise.resolve(null);

  const response = await fetch(source, {
    headers: FETCH_HEADERS,
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(18000),
  });

  if (!response.ok) {
    throw new Error(`Страница ответила ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!/html|xml/i.test(contentType)) {
    return {
      title: pageUrl.hostname,
      markdown: [
        "Страница не является HTML-статьёй, поэтому текст не извлечён.",
        "",
        `Источник: ${source}`,
        "",
        "Вставь конспект вручную в поле ниже или сохрани эту карточку как заготовку.",
      ].join("\n"),
      excerpt: "Нет HTML-содержимого",
      source,
      stub: true,
    };
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url: source });
  const document = dom.window.document;
  const spa = isSpaShell(document);
  const article = spa ? null : new Readability(document).parse();
  const htmlContent =
    article?.content ?? document.body?.innerHTML ?? "";
  const markdown = stripTracking(
    turndown.turndown(htmlContent).trim().slice(0, 180000),
  );
  const courseName = await courseNamePromise;
  const title =
    courseName ||
    article?.title?.trim() ||
    document.title?.trim() ||
    pageUrl.hostname;

  const hasText = visibleText(markdown).length >= 40;
  if (!hasText || spa) {
    return closedPageStub(source, courseName);
  }

  return {
    title,
    markdown,
    excerpt: (article?.excerpt ?? markdown).slice(0, 280),
    source,
    stub: false,
    suggestedSubject: courseName || undefined,
  };
}
