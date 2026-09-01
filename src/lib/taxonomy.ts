export type ModuleGroup<T> = {
  module: string;
  lectures: T[];
};

export type SubjectGroup<T> = {
  subject: string;
  modules: ModuleGroup<T>[];
};

export function groupLectures<
  T extends { slug: string; subject: string; module: string },
>(lectures: T[]): SubjectGroup<T>[] {
  const subjects = new Map<string, Map<string, T[]>>();
  for (const lecture of lectures) {
    const subject = lecture.subject.trim() || "Разное";
    const moduleName = lecture.module.trim() || "Общее";
    if (!subjects.has(subject)) {
      subjects.set(subject, new Map());
    }
    const modules = subjects.get(subject)!;
    const list = modules.get(moduleName) ?? [];
    list.push(lecture);
    modules.set(moduleName, list);
  }

  return [...subjects.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "ru"))
    .map(([subject, modules]) => ({
      subject,
      modules: [...modules.entries()]
        .sort(([left], [right]) => left.localeCompare(right, "ru"))
        .map(([moduleName, items]) => ({
          module: moduleName,
          lectures: items.sort((left, right) =>
            left.slug.localeCompare(right.slug, "ru"),
          ),
        })),
    }));
}

export function taxonomyFromLectures(
  lectures: { subject: string; module: string; slug: string }[],
) {
  return groupLectures(lectures).map((subject) => ({
    subject: subject.subject,
    modules: subject.modules.map((item) => item.module),
  }));
}

export function assignmentCountLabel(count: number) {
  if (count === 0) return "нет заданий";
  if (count === 1) return "1 задание";
  if (count < 5) return `${count} задания`;
  return `${count} заданий`;
}
