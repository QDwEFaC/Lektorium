import { lectureHref } from "@/lib/links";
import { TARGET_KIND_LABEL, type AssignmentTargetKind } from "@/lib/types";
import type { SubjectGroup } from "@/lib/taxonomy";

export function assignmentsForTarget<T extends { lectureSlug?: string }>(
  assignments: T[],
  slug: string,
) {
  return assignments.filter((item) => item.lectureSlug === slug);
}

export function describeAssignmentTarget(
  slug: string | undefined,
  lectures: { slug: string; title: string; subject: string; module: string }[],
  tree: SubjectGroup<unknown>[],
): {
  kind?: AssignmentTargetKind;
  href?: string;
  text: string;
  short: string;
} {
  if (!slug) return { text: "Без привязки", short: "Без привязки" };
  const lecture = lectures.find((item) => item.slug === slug);
  if (lecture) {
    return {
      kind: "lecture",
      href: lectureHref(slug),
      text: `${lecture.subject} · ${lecture.module} · ${lecture.title}`,
      short: lecture.title,
    };
  }
  const subject = tree.find((item) => item.subject === slug);
  if (subject) {
    return {
      kind: "subject",
      href: lectureHref(slug),
      text: `${TARGET_KIND_LABEL.subject} · ${subject.subject}`,
      short: subject.subject,
    };
  }
  for (const item of tree) {
    const mod = item.modules.find(
      (entry) => `${item.subject}/${entry.module}` === slug,
    );
    if (mod) {
      return {
        kind: "module",
        href: lectureHref(slug),
        text: `${TARGET_KIND_LABEL.module} · ${item.subject} · ${mod.module}`,
        short: mod.module,
      };
    }
  }
  const leaf = slug.split("/").pop() ?? slug;
  return { href: lectureHref(slug), text: slug, short: leaf };
}
