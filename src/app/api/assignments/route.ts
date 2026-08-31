import { NextResponse } from "next/server";
import { createAssignment } from "@/lib/vault";
import type { CodeLanguage } from "@/lib/types";

const LANGUAGES: CodeLanguage[] = ["python", "typescript", "javascript"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      prompt?: string;
      lectureSlug?: string;
      language?: string;
    };
    if (!body.title?.trim() || !body.prompt?.trim()) {
      return NextResponse.json(
        { error: "Нужны название и условие задания" },
        { status: 400 },
      );
    }
    const language = LANGUAGES.includes(body.language as CodeLanguage)
      ? (body.language as CodeLanguage)
      : "python";
    const result = await createAssignment({
      title: body.title,
      prompt: body.prompt,
      lectureSlug: body.lectureSlug?.trim() || undefined,
      language,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось создать задание";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
