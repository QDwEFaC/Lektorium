import { NextResponse } from "next/server";
import { isCodeLanguage } from "@/lib/types";
import { createAssignment } from "@/lib/vault";

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
    const rawLanguage = body.language ?? "";
    const language = isCodeLanguage(rawLanguage) ? rawLanguage : "python";
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
