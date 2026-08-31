import { NextResponse } from "next/server";
import { createLecture } from "@/lib/vault";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      markdown?: string;
      source?: string;
    };
    if (!body.title?.trim() || !body.markdown?.trim()) {
      return NextResponse.json(
        { error: "Нужны название и текст лекции" },
        { status: 400 },
      );
    }
    const lecture = await createLecture({
      title: body.title,
      markdown: body.markdown,
      source: body.source?.trim() || undefined,
    });
    return NextResponse.json(lecture);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сохранить лекцию";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
