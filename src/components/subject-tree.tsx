import Link from "next/link";
import { BookOpen, ListChecks } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { lectureHref } from "@/lib/links";
import { taxonomySectionId } from "@/lib/outline";
import { assignmentCountLabel, type SubjectGroup } from "@/lib/taxonomy";
import type { Lecture } from "@/lib/types";

export function SubjectTree({
  tree,
  showSubjectHeading = true,
}: {
  tree: SubjectGroup<Lecture>[];
  showSubjectHeading?: boolean;
}) {
  return (
    <div className="space-y-8">
      {tree.map((subject) => (
        <section key={subject.subject} className="space-y-4">
          {showSubjectHeading ? (
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Предмет
              </p>
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                <Link
                  href={lectureHref(subject.subject)}
                  className="hover:underline"
                >
                  {subject.subject}
                </Link>
              </h2>
            </div>
          ) : null}
          {subject.modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Модулей пока нет.</p>
          ) : (
            subject.modules.map((mod) => (
              <div
                key={mod.module}
                id={taxonomySectionId("mod", subject.subject, mod.module)}
                className="space-y-2 scroll-mt-20 pl-0 sm:pl-2"
              >
                <h3 className="text-sm font-medium text-muted-foreground">
                  <Link
                    href={lectureHref(`${subject.subject}/${mod.module}`)}
                    className="hover:text-foreground hover:underline"
                  >
                    {mod.module}
                  </Link>
                </h3>
                <div className="grid gap-2">
                  {mod.lectures.length === 0 ? (
                    <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                      В модуле ещё нет лекций. Добавь конспект вручную или из
                      URL.
                    </p>
                  ) : (
                    mod.lectures.map((lecture) => (
                      <Link
                        key={lecture.slug}
                        id={taxonomySectionId("lec", lecture.slug)}
                        href={lectureHref(lecture.slug)}
                        className="scroll-mt-20"
                      >
                        <Card className="hover:bg-muted/40">
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                              {lecture.title}
                            </CardTitle>
                            <CardDescription>{lecture.excerpt}</CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <ListChecks className="size-3.5" />
                              {assignmentCountLabel(
                                lecture.assignmentSlugs.length,
                              )}
                            </span>
                            <span>{lecture.captured || "без даты"}</span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      ))}
    </div>
  );
}
