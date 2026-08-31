import Link from "next/link";
import { CaptureDialog } from "@/components/capture-dialog";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { lectureHref } from "@/lib/links";
import { listLectures } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default async function LecturesPage() {
  const lectures = await listLectures();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Лекции
          </h1>
          <p className="text-sm text-muted-foreground">
            Каждая заметка — файл в <code className="rounded bg-muted px-1">vault/Лекции</code>.
          </p>
        </div>
        <CaptureDialog />
      </div>

      {lectures.length === 0 ? (
        <EmptyState
          title="Пока пусто"
          description="Сохрани материал из URL или вставь конспект вручную."
          action={<CaptureDialog />}
        />
      ) : (
        <div className="grid gap-3">
          {lectures.map((lecture) => (
            <Link key={lecture.slug} href={lectureHref(lecture.slug)}>
              <Card className="hover:bg-muted/40">
                <CardHeader>
                  <CardTitle>{lecture.title}</CardTitle>
                  <CardDescription>{lecture.excerpt}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{lecture.captured || "без даты"}</span>
                  <span>
                    {lecture.assignmentSlugs.length === 0
                      ? "нет заданий"
                      : `${lecture.assignmentSlugs.length} связанн. зад.`}
                  </span>
                  {lecture.source ? (
                    <span className="truncate">{lecture.source}</span>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
