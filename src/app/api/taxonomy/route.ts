import { NextResponse } from "next/server";
import {
  createModule,
  createSubject,
  deleteSubject,
  renameModule,
  renameSubject,
} from "@/lib/vault";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: string;
      title?: string;
      subject?: string;
    };
    if (body.type === "subject") {
      if (!body.title?.trim()) {
        return NextResponse.json({ error: "Нужно название предмета" }, { status: 400 });
      }
      return NextResponse.json(await createSubject(body.title));
    }
    if (body.type === "module") {
      if (!body.subject?.trim() || !body.title?.trim()) {
        return NextResponse.json(
          { error: "Нужны предмет и название модуля" },
          { status: 400 },
        );
      }
      return NextResponse.json(await createModule(body.subject, body.title));
    }
    return NextResponse.json({ error: "Укажи type: subject или module" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось создать";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: string;
      from?: string;
      to?: string;
      subject?: string;
    };
    if (!body.from?.trim() || !body.to?.trim()) {
      return NextResponse.json({ error: "Нужны старое и новое имя" }, { status: 400 });
    }
    if (body.type === "subject") {
      return NextResponse.json(await renameSubject(body.from, body.to));
    }
    if (body.type === "module") {
      if (!body.subject?.trim()) {
        return NextResponse.json({ error: "Нужен предмет" }, { status: 400 });
      }
      return NextResponse.json(
        await renameModule(body.subject, body.from, body.to),
      );
    }
    return NextResponse.json({ error: "Укажи type: subject или module" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось переименовать";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: string;
      subject?: string;
    };
    if (body.type !== "subject" || !body.subject?.trim()) {
      return NextResponse.json({ error: "Нужен предмет" }, { status: 400 });
    }
    return NextResponse.json(await deleteSubject(body.subject));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось удалить предмет";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
