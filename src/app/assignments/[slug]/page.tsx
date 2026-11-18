import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyPath } from "@/components/copy-path";
import { MarkdownView } from "@/components/markdown-view";
import { StatusActions } from "@/components/status-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { describeAssignmentTarget } from "@/lib/assignment-target";
import { CODE_LANGUAGE_LABEL, TARGET_KIND_LABEL } from "@/lib/types";
import {
  getAssignmentOrNull,
  listLectures,
  listTaxonomy,
} from "@/lib/vault";

export const dynamic = "force-dynamic";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const [assignment, lectures, tree] = await Promise.all([
    getAssignmentOrNull(slug),
    listLectures(),
    listTaxonomy(),
  ]);
  if (!assignment) notFound();

  const target = describeAssignmentTarget(
    assignment.lectureSlug,
    lectures,
    tree,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Задание</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {assignment.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Файл: <code>vault/Задания/{assignment.slug}.md</code>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardHeader>
            <CardTitle>Условие</CardTitle>
            <CardDescription>
              Этот текст продублирован в папке кода как ЗАДАНИЕ.md — его видно
              из Zed, не переключаясь в Obsidian.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MarkdownView markdown={assignment.body} />
          </CardContent>
        </Card>

        <aside className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Привязка</CardTitle>
            </CardHeader>
            <CardContent>
              {target.href ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {target.kind
                      ? TARGET_KIND_LABEL[target.kind]
                      : "Заметка"}
                  </p>
                  <Button
                    variant="outline"
                    className="h-auto w-full justify-start whitespace-normal py-2"
                    render={<Link href={target.href} />}
                  >
                    {target.short}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Не привязано</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Код в Zed</CardTitle>
              <CardDescription>
                Открой репозиторий в Zed и работай в этой папке.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <CopyPath value={assignment.codePath} />
              <p className="text-xs text-muted-foreground">
                Язык: {CODE_LANGUAGE_LABEL[assignment.language]}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Статус</CardTitle>
              <CardDescription>
                Смена статуса обновит frontmatter и карту курса в vault.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusActions slug={assignment.slug} status={assignment.status} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
