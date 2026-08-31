import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignmentDialog } from "@/components/assignment-dialog";
import { EmptyState } from "@/components/empty-state";
import { MarkdownView } from "@/components/markdown-view";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { assignmentHref } from "@/lib/links";
import {
  getLectureOrNull,
  listAssignments,
  listLectures,
} from "@/lib/vault";

export const dynamic = "force-dynamic";

export default async function LectureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const lecture = await getLectureOrNull(slug);
  if (!lecture) notFound();

  const [lectures, assignments] = await Promise.all([
    listLectures(),
    listAssignments(),
  ]);
  const linked = assignments.filter((item) =>
    lecture.assignmentSlugs.includes(item.slug),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Лекция</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {lecture.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Файл: <code>vault/Лекции/{lecture.slug}.md</code>
            {lecture.source ? (
              <>
                {" "}
                ·{" "}
                <a
                  href={lecture.source}
                  className="underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  источник
                </a>
              </>
            ) : null}
          </p>
        </div>
        <AssignmentDialog
          lectures={lectures}
          defaultLectureSlug={lecture.slug}
          triggerLabel="Задание к этой лекции"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <Card>
          <CardHeader>
            <CardTitle>Конспект</CardTitle>
            <CardDescription>
              Тот же текст, что в Obsidian. Wiki-ссылки кликабельны и здесь.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MarkdownView markdown={lecture.body} />
          </CardContent>
        </Card>

        <aside className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Задания</CardTitle>
              <CardDescription>Связь лекция → практика.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {linked.length === 0 ? (
                <EmptyState
                  title="Ещё не привязано"
                  description="Создай задание — в заметке лекции появится [[вики-ссылка]]."
                />
              ) : (
                linked.map((assignment) => (
                  <Link
                    key={assignment.slug}
                    href={assignmentHref(assignment.slug)}
                    className="block rounded-lg border px-3 py-2 hover:bg-muted/60"
                  >
                    <p className="text-sm font-medium">{assignment.title}</p>
                    <div className="mt-1">
                      <StatusBadge status={assignment.status} />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
          <Button variant="outline" render={<Link href="/lectures" />}>
            Все лекции
          </Button>
        </aside>
      </div>
    </div>
  );
}
