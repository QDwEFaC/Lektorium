import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";
import { AssignmentDialog } from "@/components/assignment-dialog";
import { CaptureDialog } from "@/components/capture-dialog";
import { CreateTaxonomyDialog } from "@/components/create-taxonomy-dialog";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { SubjectBoard } from "@/components/subject-board";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { describeAssignmentTarget } from "@/lib/assignment-target";
import { assignmentHref } from "@/lib/links";
import { ASSIGNMENT_STATUSES, STATUS_LABEL } from "@/lib/types";
import { getOverview, listTaxonomy } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ lectures, assignments, codeProjects }, tree] = await Promise.all([
    getOverview(),
    listTaxonomy(),
  ]);
  const openAssignments = assignments.filter((item) => item.status !== "done");
  const done = assignments.filter((item) => item.status === "done").length;
  const moduleCount = tree.reduce(
    (sum, subject) => sum + subject.modules.length,
    0,
  );

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Учебный vault</p>
        <h1 className="font-heading max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Лекция из интернета становится заметкой, заданием и папкой кода.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Сохрани URL в markdown для Obsidian: предмет → модуль → лекция.
          Задание можно привязать к любому из этих уровней — появятся
          wiki-ссылки и каталог для Zed.
        </p>
        <div className="flex flex-wrap gap-2">
          <CaptureDialog />
          <CreateTaxonomyDialog kind="subject" />
          <AssignmentDialog tree={tree} />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Предметы"
          value={tree.length}
          hint={`${moduleCount} модулей · ${lectures.length} лекций`}
        />
        <Stat
          label="Задания в работе"
          value={openAssignments.length}
          hint={`${done} уже сдано`}
        />
        <Stat
          label="Папки кода"
          value={codeProjects.length}
          hint="открывай в Zed"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Связка инструментов</CardTitle>
            <CardDescription>
              Один репозиторий, два окна: заметки и редактор.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6">
            <p>
              <strong>Obsidian:</strong> Open folder as vault →{" "}
              <code className="rounded bg-muted px-1">vault/</code>
            </p>
            <p>
              <strong>Zed:</strong> File → Open → корень репозитория. Код
              заданий лежит в <code className="rounded bg-muted px-1">code/</code>.
            </p>
            <p>
              В графе Obsidian лекция тянет за собой задания. В Zed у каждой
              папки есть <code className="rounded bg-muted px-1">ЗАДАНИЕ.md</code>{" "}
              со ссылкой назад.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Что делать дальше</CardTitle>
            <CardDescription>
              Открытые задания — к предмету, модулю или лекции.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {openAssignments.length === 0 ? (
              <EmptyState
                title="Нет открытых заданий"
                description="Сохрани лекцию из URL, затем создай к ней практику — появится заметка и папка кода."
                action={<AssignmentDialog tree={tree} triggerLabel="Создать задание" />}
              />
            ) : (
              openAssignments.map((assignment) => (
                <Link
                  key={assignment.slug}
                  href={assignmentHref(assignment.slug)}
                  className="flex items-start justify-between gap-3 rounded-lg border px-3 py-3 hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {
                        describeAssignmentTarget(
                          assignment.lectureSlug,
                          lectures,
                          tree,
                        ).text
                      }{" "}
                      · {assignment.codePath}
                    </p>
                  </div>
                  <StatusBadge status={assignment.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Предметы</h2>
          <Link
            href="/lectures"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Все предметы <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {tree.length === 0 ? (
          <EmptyState
            title="Предметов ещё нет"
            description="Создай предмет или вставь ссылку на материал курса."
            action={<CreateTaxonomyDialog kind="subject" triggerVariant="default" />}
          />
        ) : (
          <SubjectBoard tree={tree} />
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Статусы заданий:{" "}
        {ASSIGNMENT_STATUSES.map((item) => STATUS_LABEL[item]).join(", ")}.
        Папок кода: {codeProjects.length}.{" "}
        <Link href="/code" className="underline-offset-4 hover:underline">
          <Code2 className="mr-1 inline size-3.5" />
          Смотреть код
        </Link>
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
    </Card>
  );
}
