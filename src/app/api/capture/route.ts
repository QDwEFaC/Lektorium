import { NextResponse } from "next/server";
import { stageCaptureImages } from "@/lib/capture-staging";
import {
  isHtmlFilename,
  isImageFilename,
  pageParseAvailable,
  parseFromHtmlBundle,
  parseFromUrl,
  type HtmlFile,
  type StagedImage,
} from "@/lib/page-parse";

export const maxDuration = 120;

const MAX_HTML = 40;
const MAX_IMAGES = 80;
const MAX_HTML_BYTES = 2_000_000;
const MAX_IMAGE_BYTES = 8_000_000;

export async function GET() {
  return NextResponse.json({ available: pageParseAvailable });
}

async function fromHtmlFiles(request: Request) {
  const form = await request.formData();
  const source = String(form.get("source") ?? "").trim();
  let paths: string[] = [];
  try {
    paths = JSON.parse(String(form.get("paths") ?? "[]")) as string[];
  } catch {
    paths = [];
  }

  const htmlFiles: HtmlFile[] = [];
  const images: StagedImage[] = [];
  let index = 0;
  for (const entry of form.getAll("files")) {
    const pathName = paths[index] || (entry instanceof File ? entry.name : "");
    index += 1;
    if (typeof entry === "string") continue;
    if (isHtmlFilename(pathName, entry.type)) {
      if (entry.size > MAX_HTML_BYTES || htmlFiles.length >= MAX_HTML) continue;
      htmlFiles.push({ name: pathName || entry.name, html: await entry.text() });
      continue;
    }
    if (!isImageFilename(pathName, entry.type)) continue;
    if (entry.size > MAX_IMAGE_BYTES || images.length >= MAX_IMAGES) continue;
    const bytes = Buffer.from(await entry.arrayBuffer());
    if (bytes.length < 80) continue;
    images.push({ name: pathName || entry.name, bytes });
  }

  if (htmlFiles.length === 0) {
    return NextResponse.json(
      { error: "Нужны HTML-файлы сохранённой страницы" },
      { status: 400 },
    );
  }

  const extracted = await parseFromHtmlBundle({ htmlFiles, images, source });
  const { stagedImages, ...payload } = extracted;
  if (stagedImages?.length) {
    const staged = await stageCaptureImages(stagedImages);
    payload.captureId = staged.captureId;
    payload.images = staged.names;
  }
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      return await fromHtmlFiles(request);
    }

    const body = (await request.json()) as { url?: string };
    if (!body.url?.trim()) {
      return NextResponse.json(
        { error: "Вставь ссылку на материал" },
        { status: 400 },
      );
    }
    const extracted = await parseFromUrl(body.url);
    return NextResponse.json(extracted);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось прочитать страницу";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
