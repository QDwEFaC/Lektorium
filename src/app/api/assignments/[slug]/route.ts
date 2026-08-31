import { NextResponse } from "next/server";
import { updateAssignmentStatus } from "@/lib/vault";
import type { AssignmentStatus } from "@/lib/types";

const STATUSES: AssignmentStatus[] = ["todo", "in-progress", "done"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const body = (await request.json()) as { status?: string };
    if (!STATUSES.includes(body.status as AssignmentStatus)) {
      return NextResponse.json({ error: "Неизвестный статус" }, { status: 400 });
    }
    const assignment = await updateAssignmentStatus(
      decodeURIComponent(slug),
      body.status as AssignmentStatus,
    );
    return NextResponse.json(assignment);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обновить задание";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
