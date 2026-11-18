import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignmentDialog } from "@/components/assignment-dialog";
import { CaptureDialog } from "@/components/capture-dialog";
import { CreateTaxonomyDialog } from "@/components/create-taxonomy-dialog";
import { EmptyState } from "@/components/empty-state";
import { LectureOutline } from "@/components/lecture-outline";
import { MarkdownView } from "@/components/markdown-view";
import { DeleteLectureDialog } from "@/components/delete-lecture-dialog";
import { DeleteSubjectDialog } from "@/components/delete-subject-dialog";
import { LinkedAssignments } from "@/components/linked-assignments";
import { RenameDialog } from "@/components/rename-dialog";
import { SubjectTree } from "@/components/subject-tree";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { assignmentsForTarget } from "@/lib/assignment-target";
import { lectureHref } from "@/lib/links";
import { lectureOutline, subjectOutline } from "@/lib/outline";
import { cn } from "@/lib/utils";
import {
  getLectureOrNull,
  listAssignments,
  listTaxonomy,
} from "@/lib/vault";

export const dynamic = "force-dynamic";

function decodeParts(parts: string[]) {
  return parts.map((part) => decodeURIComponent(part));
}

export default async function LectureCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: rawParts } = await params;
  const parts = decodeParts(rawParts);
  const [assignments, tree] = await Promise.all([
    listAssignments(),
    listTaxonomy(),
  ]);

  if (parts.length === 1) {
    const subject = tree.find((item) => item.subject === parts[0]);
    if (!subject) notFound();
    const subjectLectures = subject.modules.flatMap((mod) => mod.lectures);
    const outline = subjectOutline(subject);
    const hasOutline = outline.length > 0;
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <Link href="/lectures" className="hover:underline">
                Предметы
              </Link>
            </p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {subject.subject}
            </h1>
            <p className="text-sm text-muted-foreground">
              {subject.modules.length} модул.
              {" · "}
              {subjectLectures.length} лекц.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <RenameDialog kind="subject" current={subject.subject} />
            <DeleteSubjectDialog
              subject={subject.subject}
              moduleCount={subject.modules.length}
              lectureCount={subjectLectures.length}
            />
            <CreateTaxonomyDialog kind="module" subject={subject.subject} />
            <AssignmentDialog
              tree={tree}
              defaultTargetSlug={subject.subject}
              triggerLabel="Задание к предмету"
            />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Задания предмета</CardTitle>
            <CardDescription>
              Практика, привязанная ко всему предмету, не к отдельной лекции.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkedAssignments
              assignments={assignmentsForTarget(assignments, subject.subject)}
              emptyDescription="Создай задание к предмету — ссылка появится здесь и в графе Obsidian."
            />
          </CardContent>
        </Card>
        {subject.modules.length === 0 ? (
          <EmptyState
            title="Модулей нет"
            description="Добавь модуль без URL, затем лекцию текстом или из ссылки."
            action={
              <CreateTaxonomyDialog
                kind="module"
                subject={subject.subject}
                triggerVariant="default"
              />
            }
          />
        ) : (
          <div
            className={cn(
              "grid gap-4",
              hasOutline ? "lg:grid-cols-[14rem_minmax(0,1fr)]" : "",
            )}
          >
            {hasOutline ? (
              <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto">
                <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10 lg:bg-transparent lg:p-0 lg:ring-0">
                  <LectureOutline nodes={outline} />
                </div>
              </aside>
            ) : null}
            <SubjectTree tree={[subject]} showSubjectHeading={false} />
          </div>
        )}
      </div>
    );
  }

  if (parts.length === 2) {
    const [subjectName, moduleName] = parts;
    const subject = tree.find((item) => item.subject === subjectName);
    const mod = subject?.modules.find((item) => item.module === moduleName);
    if (!subject || !mod) notFound();
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <Link href="/lectures" className="hover:underline">
                Предметы
              </Link>
              {" · "}
              <Link
                href={lectureHref(subject.subject)}
                className="hover:underline"
              >
                {subject.subject}
              </Link>
            </p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {mod.module}
            </h1>
            <p className="text-sm text-muted-foreground">
              Файл:{" "}
              <code>
                vault/Лекции/{subject.subject}/{mod.module}.md
              </code>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <RenameDialog
              kind="module"
              current={mod.module}
              subject={subject.subject}
            />
            <CaptureDialog
              triggerLabel="Добавить лекцию"
              triggerVariant="outline"
              defaultSubject={subject.subject}
              defaultModule={mod.module}
              defaultMode="manual"
            />
            <AssignmentDialog
              tree={tree}
              defaultTargetSlug={`${subject.subject}/${mod.module}`}
              triggerLabel="Задание к модулю"
            />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Задания модуля</CardTitle>
            <CardDescription>
              Практика на весь модуль, без привязки к одной лекции.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkedAssignments
              assignments={assignmentsForTarget(
                assignments,
                `${subject.subject}/${mod.module}`,
              )}
              emptyDescription="Создай задание к модулю — ссылка появится в заметке модуля."
            />
          </CardContent>
        </Card>
        {mod.lectures.length === 0 ? (
          <EmptyState
            title="Лекций нет"
            description="Вставь конспект вручную — URL не обязателен."
            action={
              <CaptureDialog
                triggerLabel="Вставить текст"
                defaultSubject={subject.subject}
                defaultModule={mod.module}
                defaultMode="manual"
              />
            }
          />
        ) : (
          <SubjectTree tree={[{ ...subject, modules: [mod] }]} />
        )}
      </div>
    );
  }

  const slug = parts.join("/");
  const lecture = await getLectureOrNull(slug);
  if (!lecture) notFound();

  const linked = assignmentsForTarget(assignments, lecture.slug);
  const outline = lectureOutline(lecture.body);
  const hasOutline = outline.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <Link href={lectureHref(lecture.subject)} className="hover:underline">
              {lecture.subject}
            </Link>
            {" · "}
            <Link
              href={lectureHref(`${lecture.subject}/${lecture.module}`)}
              className="hover:underline"
            >
              {lecture.module}
            </Link>
          </p>
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
        <div className="flex flex-wrap gap-2">
          <RenameDialog
            kind="lecture"
            current={lecture.title}
            slug={lecture.slug}
          />
          <DeleteLectureDialog
            slug={lecture.slug}
            title={lecture.title}
            subject={lecture.subject}
            module={lecture.module}
            assignmentCount={linked.length}
          />
          <AssignmentDialog
            tree={tree}
            defaultTargetSlug={lecture.slug}
            triggerLabel="Задание к этой лекции"
          />
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4",
          hasOutline
            ? "lg:grid-cols-[14rem_minmax(0,1fr)_16rem]"
            : "lg:grid-cols-[minmax(0,1fr)_16rem]",
        )}
      >
        {hasOutline ? (
          <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto">
            <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10 lg:bg-transparent lg:p-0 lg:ring-0">
              <LectureOutline nodes={outline} />
            </div>
          </aside>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Конспект</CardTitle>
            <CardDescription>
              Тот же текст, что в Obsidian. Wiki-ссылки кликабельны и здесь.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MarkdownView markdown={lecture.body} lectureSlug={lecture.slug} />
          </CardContent>
        </Card>

        <aside className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Задания</CardTitle>
              <CardDescription>Связь лекция → практика.</CardDescription>
            </CardHeader>
            <CardContent>
              <LinkedAssignments
                assignments={linked}
                emptyDescription="Создай задание — в заметке лекции появится [[вики-ссылка]]."
              />
            </CardContent>
          </Card>
          <Button variant="outline" render={<Link href="/lectures" />}>
            Все предметы
          </Button>
        </aside>
      </div>
    </div>
  );
}
