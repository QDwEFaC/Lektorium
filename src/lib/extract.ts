import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

export type ExtractResult = {
  title: string;
  markdown: string;
  excerpt: string;
  source: string;
  stub: boolean;
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

export async function urlToMarkdown(rawUrl: string): Promise<ExtractResult> {
  const source = rawUrl.trim();
  if (!isHttpUrl(source)) {
    throw new Error("Нужен адрес http или https");
  }

  const response = await fetch(source, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Lektorium/1.0; study-vault capture)",
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(18000),
  });

  if (!response.ok) {
    throw new Error(`Страница ответила ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!/html|xml/i.test(contentType)) {
    return {
      title: new URL(source).hostname,
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
  const article = new Readability(dom.window.document).parse();
  const htmlContent =
    article?.content ?? dom.window.document.body?.innerHTML ?? "";
  const markdown = turndown.turndown(htmlContent).trim().slice(0, 180000);
  const title =
    article?.title?.trim() ||
    dom.window.document.title?.trim() ||
    new URL(source).hostname;

  if (!markdown) {
    return {
      title,
      markdown: `Не удалось вытащить основной текст. Источник: ${source}`,
      excerpt: "",
      source,
      stub: true,
    };
  }

  return {
    title,
    markdown,
    excerpt: (article?.excerpt ?? markdown).slice(0, 280),
    source,
    stub: false,
  };
}
