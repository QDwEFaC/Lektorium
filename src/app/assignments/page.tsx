import Link from "next/link";
import { AssignmentDialog } from "@/components/assignment-dialog";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { assignmentHref } from "@/lib/links";
import { CODE_LANGUAGE_LABEL } from "@/lib/types";
import { listAssignments, listLectures } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const [assignments, lectures] = await Promise.all([
    listAssignments(),
    listLectures(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Задания
          </h1>
          <p className="text-sm text-muted-foreground">
            Каждое задание ссылается на лекцию и на папку в{" "}
            <code className="rounded bg-muted px-1">code/</code>.
          </p>
        </div>
        <AssignmentDialog lectures={lectures} />
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          title="Заданий нет"
          description="Привяжи практику к лекции — появятся wiki-ссылки в Obsidian и заготовка кода для Zed."
          action={<AssignmentDialog lectures={lectures} />}
        />
      ) : (
        <div className="grid gap-3">
          {assignments.map((assignment) => {
            const lecture = lectures.find(
              (item) => item.slug === assignment.lectureSlug,
            );
            return (
            <Link key={assignment.slug} href={assignmentHref(assignment.slug)}>
              <Card className="hover:bg-muted/40">
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{assignment.title}</CardTitle>
                    <CardDescription>
                      {lecture
                        ? `${lecture.subject} · ${lecture.module} · ${lecture.title}`
                        : assignment.lectureSlug
                          ? assignment.lectureSlug
                          : "Без лекции"}
                    </CardDescription>
                  </div>
                  <StatusBadge status={assignment.status} />
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {assignment.codePath} · {CODE_LANGUAGE_LABEL[assignment.language]}
                </CardContent>
              </Card>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
