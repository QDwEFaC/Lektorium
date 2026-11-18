import { NextResponse } from "next/server";
import { updateAssignmentStatus } from "@/lib/vault";
import { isAssignmentStatus } from "@/lib/types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const body = (await request.json()) as { status?: string };
    if (!body.status || !isAssignmentStatus(body.status)) {
      return NextResponse.json({ error: "Неизвестный статус" }, { status: 400 });
    }
    const assignment = await updateAssignmentStatus(
      decodeURIComponent(slug),
      body.status,
    );
    return NextResponse.json(assignment);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обновить задание";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
