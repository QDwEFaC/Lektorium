import { NextResponse } from "next/server";
import { urlToMarkdown } from "@/lib/extract";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    if (!body.url?.trim()) {
      return NextResponse.json(
        { error: "Вставь ссылку на лекцию или статью" },
        { status: 400 },
      );
    }
    const extracted = await urlToMarkdown(body.url);
    return NextResponse.json(extracted);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось прочитать страницу";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
