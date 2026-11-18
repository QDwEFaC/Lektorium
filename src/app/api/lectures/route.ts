import { NextResponse } from "next/server";
import {
  createLecture,
  deleteLecture,
  listLectures,
  listTaxonomy,
  relocalizeLectureImages,
  renameLecture,
} from "@/lib/vault";

export async function GET() {
  const [lectures, tree] = await Promise.all([listLectures(), listTaxonomy()]);
  return NextResponse.json({
    lectures,
    taxonomy: tree.map((subject) => ({
      subject: subject.subject,
      modules: subject.modules.map((item) => item.module),
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      markdown?: string;
      source?: string;
      subject?: string;
      module?: string;
      captureId?: string;
    };
    if (!body.title?.trim() || !body.markdown?.trim()) {
      return NextResponse.json(
        { error: "Нужны название и текст лекции" },
        { status: 400 },
      );
    }
    if (!body.subject?.trim() || !body.module?.trim()) {
      return NextResponse.json(
        { error: "Укажи предмет и модуль" },
        { status: 400 },
      );
    }
    const lecture = await createLecture({
      title: body.title,
      markdown: body.markdown,
      subject: body.subject,
      module: body.module,
      source: body.source?.trim() || undefined,
      captureId: body.captureId?.trim() || undefined,
    });
    return NextResponse.json(lecture);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сохранить лекцию";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      slug?: string;
      title?: string;
      relocalizeImages?: boolean;
    };
    if (body.relocalizeImages && body.slug?.trim()) {
      const result = await relocalizeLectureImages(body.slug.trim());
      return NextResponse.json(result);
    }
    if (!body.slug?.trim() || !body.title?.trim()) {
      return NextResponse.json(
        { error: "Нужны текущий путь лекции и новое название" },
        { status: 400 },
      );
    }
    const lecture = await renameLecture(body.slug, body.title);
    return NextResponse.json(lecture);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось переименовать лекцию";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { slug?: string };
    if (!body.slug?.trim()) {
      return NextResponse.json({ error: "Нужен путь лекции" }, { status: 400 });
    }
    return NextResponse.json(await deleteLecture(body.slug));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось удалить лекцию";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
