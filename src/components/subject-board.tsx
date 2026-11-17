import Link from "next/link";
import { DeleteSubjectDialog } from "@/components/delete-subject-dialog";
import { lectureHref } from "@/lib/links";
import type { SubjectGroup } from "@/lib/taxonomy";
import type { Lecture } from "@/lib/types";

export function SubjectBoard({
  tree,
  afterDeleteHref = "/",
}: {
  tree: SubjectGroup<Lecture>[];
  afterDeleteHref?: string;
}) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      {tree.map((subject) => {
        const lectureCount = subject.modules.reduce(
          (sum, mod) => sum + mod.lectures.length,
          0,
        );
        return (
          <article
            key={subject.subject}
            className="flex h-[min(32rem,70vh)] min-w-[17.5rem] flex-1 basis-[18rem] snap-start flex-col rounded-xl bg-card ring-1 ring-foreground/10"
          >
            <header className="flex items-start justify-between gap-2 border-b px-3 py-3">
              <div className="min-w-0">
                <Link
                  href={lectureHref(subject.subject)}
                  className="font-heading text-base font-semibold tracking-tight hover:underline"
                >
                  {subject.subject}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {subject.modules.length} мод. · {lectureCount} лекц.
                </p>
              </div>
              <DeleteSubjectDialog
                subject={subject.subject}
                moduleCount={subject.modules.length}
                lectureCount={lectureCount}
                compact
                afterHref={afterDeleteHref}
              />
            </header>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3">
              {subject.modules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Модулей пока нет.</p>
              ) : (
                subject.modules.map((mod) => (
                  <section key={mod.module} className="space-y-1.5">
                    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      <Link
                        href={lectureHref(`${subject.subject}/${mod.module}`)}
                        className="hover:text-foreground hover:underline"
                      >
                        {mod.module}
                      </Link>
                    </h3>
                    {mod.lectures.length === 0 ? (
                      <p className="rounded-md border border-dashed px-2 py-2 text-xs text-muted-foreground">
                        Лекций нет
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {mod.lectures.map((lecture) => (
                          <li key={lecture.slug}>
                            <Link
                              href={lectureHref(lecture.slug)}
                              className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                            >
                              {lecture.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
