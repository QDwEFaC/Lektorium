import Link from "next/link";
import { AssignmentDialog } from "@/components/assignment-dialog";
import { CopyPath } from "@/components/copy-path";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { assignmentHref } from "@/lib/links";
import { CODE_LANGUAGE_LABEL } from "@/lib/types";
import { listCodeProjects, listLectures } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default async function CodePage() {
  const [projects, lectures] = await Promise.all([
    listCodeProjects(),
    listLectures(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Код
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Открой корень репозитория в Zed. Каждая папка — одно задание, внутри
            README и ЗАДАНИЕ.md со ссылками на заметки.
          </p>
        </div>
        <AssignmentDialog lectures={lectures} triggerLabel="Новое задание с кодом" />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="Папок кода нет"
          description="Создай задание — Лекторий заведёт каталог с заготовкой файла."
          action={<AssignmentDialog lectures={lectures} />}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.path}>
              <CardHeader>
                <CardTitle className="font-mono text-base">
                  {project.path}
                </CardTitle>
                <CardDescription>
                  {project.assignmentSlug
                    ? "Связано с заданием"
                    : "Папка без задания"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <CopyPath value={project.path} />
                {project.assignmentSlug ? (
                  <Link
                    href={assignmentHref(project.assignmentSlug)}
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Открыть задание
                  </Link>
                ) : null}
                {project.language ? (
                  <p className="text-xs text-muted-foreground">
                    {CODE_LANGUAGE_LABEL[project.language]}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
