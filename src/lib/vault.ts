import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { createCodeProject } from "@/lib/code-project";
import {
  ASSIGNMENTS_DIR,
  assignmentPath,
  attachmentsDir,
  CODE_DIR,
  COURSE_MAP,
  LECTURES_DIR,
  lectureFolderPath,
  lecturePath,
  VAULT_ATTACHMENTS_DIR,
  VAULT_DIR,
  wikiAssignment,
  wikiLecture,
} from "@/lib/paths";
import {
  assertSafeRelPath,
  assertSafeSlug,
  folderSlug,
  nextIndex,
  noteFileName,
  numberedTitle,
} from "@/lib/slug";
import {
  assignmentCountLabel,
  groupLectures,
  type SubjectGroup,
} from "@/lib/taxonomy";
import type {
  Assignment,
  AssignmentStatus,
  CodeLanguage,
  Lecture,
  Overview,
} from "@/lib/types";

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function ensureWorkspace() {
  await Promise.all([
    ensureDir(LECTURES_DIR),
    ensureDir(ASSIGNMENTS_DIR),
    ensureDir(CODE_DIR),
    ensureDir(VAULT_ATTACHMENTS_DIR),
  ]);
}

export async function ensureLectureAttachments(slug: string) {
  await ensureDir(attachmentsDir(slug));
}

function excerptFrom(body: string) {
  return body
    .replace(/[#>*`[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

async function listMarkdown(dir: string) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.replace(/\.md$/, ""))
      .sort((a, b) => a.localeCompare(b, "ru"));
  } catch {
    return [];
  }
}

async function listMarkdownTree(dir: string, prefix = ""): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const slugs: string[] = [];
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        slugs.push(...(await listMarkdownTree(path.join(dir, entry.name), rel)));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        slugs.push(rel.replace(/\.md$/, ""));
      }
    }
    return slugs.sort((a, b) => a.localeCompare(b, "ru"));
  } catch {
    return [];
  }
}

function replaceSection(body: string, heading: string, content: string) {
  const headingLine = `## ${heading}`;
  const start = body.indexOf(headingLine);
  if (start === -1) {
    return `${body.trim()}\n\n${headingLine}\n\n${content}\n`;
  }
  const after = start + headingLine.length;
  const rest = body.slice(after);
  const next = rest.search(/\n## /);
  const before = body.slice(0, start);
  const afterSection = next === -1 ? "" : rest.slice(next);
  return `${before}${headingLine}\n\n${content}\n${afterSection}`;
}

function subjectAndModule(
  slug: string,
  data: Record<string, unknown>,
): { subject: string; module: string } {
  const parts = slug.split("/");
  return {
    subject:
      String(data.subject ?? "").trim() ||
      (parts.length >= 2 ? parts[0] : "Разное"),
    module:
      String(data.module ?? "").trim() ||
      (parts.length >= 3 ? parts[1] : "Общее"),
  };
}

export async function readLecture(slug: string): Promise<Lecture> {
  assertSafeRelPath(slug);
  const raw = await fs.readFile(lecturePath(slug), "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  if (String(data.type ?? "lecture") !== "lecture") {
    throw new Error("Это не лекция");
  }
  await ensureLectureAttachments(slug);
  const { subject, module } = subjectAndModule(slug, data);
  return {
    slug,
    title: String(data.title ?? slug),
    subject,
    module,
    source: data.source ? String(data.source) : undefined,
    captured: String(data.captured ?? ""),
    tags: stringList(data.tags),
    assignmentSlugs: stringList(data.assignments),
    excerpt: excerptFrom(parsed.content),
    body: parsed.content,
  };
}

export async function readAssignment(slug: string): Promise<Assignment> {
  assertSafeSlug(slug);
  const raw = await fs.readFile(assignmentPath(slug), "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const status = String(data.status ?? "todo") as AssignmentStatus;
  const language = String(data.language ?? "python") as CodeLanguage;
  return {
    slug,
    title: String(data.title ?? slug),
    status: ["todo", "in-progress", "done"].includes(status) ? status : "todo",
    lectureSlug: data.lecture ? String(data.lecture) : undefined,
    codePath: String(data.code_path ?? ""),
    language: ["python", "typescript", "javascript"].includes(language)
      ? language
      : "python",
    created: String(data.created ?? ""),
    tags: stringList(data.tags),
    body: parsed.content,
  };
}

export async function listLectures(): Promise<Lecture[]> {
  await ensureWorkspace();
  const slugs = await listMarkdownTree(LECTURES_DIR);
  const notes = await Promise.all(
    slugs.map(async (slug) => {
      try {
        return await readLecture(slug);
      } catch {
        return null;
      }
    }),
  );
  return notes.filter((note): note is Lecture => note !== null);
}

export async function listAssignments(): Promise<Assignment[]> {
  await ensureWorkspace();
  const slugs = await listMarkdown(ASSIGNMENTS_DIR);
  return Promise.all(slugs.map((slug) => readAssignment(slug)));
}

export async function listCodeProjects() {
  await ensureWorkspace();
  const assignments = await listAssignments();
  try {
    const entries = await fs.readdir(CODE_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => {
        const rel = `code/${entry.name}`;
        const assignment = assignments.find((item) => item.codePath === rel);
        return {
          slug: entry.name,
          path: rel,
          assignmentSlug: assignment?.slug,
          language: assignment?.language,
        };
      })
      .sort((a, b) => a.slug.localeCompare(b.slug, "ru"));
  } catch {
    return [];
  }
}

export async function getOverview(): Promise<Overview> {
  const [lectures, assignments, codeProjects] = await Promise.all([
    listLectures(),
    listAssignments(),
    listCodeProjects(),
  ]);
  return { lectures, assignments, codeProjects };
}

function serializeFrontmatter(data: Record<string, unknown>) {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      next[key] = value.toISOString().slice(0, 10);
    } else {
      next[key] = value;
    }
  }
  return next;
}

async function writeNote(
  file: string,
  data: Record<string, unknown>,
  body: string,
) {
  await ensureDir(path.dirname(file));
  const serialized = matter.stringify(
    `${body.trim()}\n`,
    serializeFrontmatter(data),
  );
  await fs.writeFile(file, serialized, "utf8");
}

function subjectIndexBody(subject: string, modules: string[]) {
  const lines =
    modules.length === 0
      ? "_Модулей пока нет._"
      : modules.map((name) => `- ${wikiLecture(`${subject}/${name}`)}`).join("\n");
  return [`# ${subject}`, "", "## Модули", "", lines, ""].join("\n");
}

function moduleIndexBody(
  subject: string,
  moduleName: string,
  lectures: Lecture[],
) {
  const lines =
    lectures.length === 0
      ? "_Лекций пока нет._"
      : lectures
          .map(
            (lecture) =>
              `- ${wikiLecture(lecture.slug)} — ${assignmentCountLabel(lecture.assignmentSlugs.length)}`,
          )
          .join("\n");
  return [
    `# ${moduleName}`,
    "",
    `Предмет: ${wikiLecture(subject)}`,
    "",
    "## Лекции",
    "",
    lines,
    "",
  ].join("\n");
}

async function rewriteTaxonomyNotes(tree: SubjectGroup<Lecture>[]) {
  for (const subject of tree) {
    await writeNote(
      path.join(LECTURES_DIR, `${subject.subject}.md`),
      { type: "subject", title: subject.subject },
      subjectIndexBody(
        subject.subject,
        subject.modules.map((item) => item.module),
      ),
    );
    for (const mod of subject.modules) {
      await writeNote(
        path.join(LECTURES_DIR, subject.subject, `${mod.module}.md`),
        {
          type: "module",
          title: mod.module,
          subject: subject.subject,
        },
        moduleIndexBody(subject.subject, mod.module, mod.lectures),
      );
    }
  }
}

export async function listTaxonomy(): Promise<SubjectGroup<Lecture>[]> {
  const lectures = await listLectures();
  const tree = groupLectures(lectures);
  const bySubject = new Map(tree.map((item) => [item.subject, item]));

  let entries: Dirent[] = [];
  try {
    entries = await fs.readdir(LECTURES_DIR, { withFileTypes: true });
  } catch {
    return tree;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isFile() && entry.name.endsWith(".md")) {
      const name = entry.name.replace(/\.md$/, "");
      try {
        const raw = await fs.readFile(path.join(LECTURES_DIR, entry.name), "utf8");
        if (String(matter(raw).data.type ?? "") === "subject" && !bySubject.has(name)) {
          bySubject.set(name, { subject: name, modules: [] });
        }
      } catch {
        /* ignore unreadable note */
      }
    }
    if (!entry.isDirectory()) continue;
    const subject = entry.name;
    if (!bySubject.has(subject)) {
      bySubject.set(subject, { subject, modules: [] });
    }
    const group = bySubject.get(subject)!;
    let children: Dirent[] = [];
    try {
      children = await fs.readdir(path.join(LECTURES_DIR, subject), {
        withFileTypes: true,
      });
    } catch {
      continue;
    }
    for (const child of children) {
      if (child.name.startsWith(".")) continue;
      let moduleName: string | null = null;
      if (child.isDirectory()) {
        moduleName = child.name;
      } else if (child.isFile() && child.name.endsWith(".md")) {
        try {
          const raw = await fs.readFile(
            path.join(LECTURES_DIR, subject, child.name),
            "utf8",
          );
          if (String(matter(raw).data.type ?? "") === "module") {
            moduleName = child.name.replace(/\.md$/, "");
          }
        } catch {
          /* ignore */
        }
      }
      if (
        moduleName &&
        !group.modules.some((item) => item.module === moduleName)
      ) {
        group.modules.push({ module: moduleName, lectures: [] });
      }
    }
  }

  return [...bySubject.values()]
    .map((subject) => ({
      ...subject,
      modules: subject.modules.sort((left, right) =>
        left.module.localeCompare(right.module, "ru"),
      ),
    }))
    .sort((left, right) => left.subject.localeCompare(right.subject, "ru"));
}

export async function rebuildCourseMap() {
  const { assignments } = await getOverview();
  const tree = await listTaxonomy();
  await rewriteTaxonomyNotes(tree);
  const subjectSections =
    tree.length === 0
      ? "_Предметов пока нет._"
      : tree
          .map((subject) => {
            const modules =
              subject.modules.length === 0
                ? "_Модулей пока нет._"
                : subject.modules
                    .map((mod) => {
                      const items =
                        mod.lectures.length === 0
                          ? "_Лекций пока нет._"
                          : mod.lectures
                              .map(
                                (lecture) =>
                                  `- ${wikiLecture(lecture.slug)} — ${assignmentCountLabel(lecture.assignmentSlugs.length)}`,
                              )
                              .join("\n");
                      return `#### ${wikiLecture(`${subject.subject}/${mod.module}`)}\n\n${items}`;
                    })
                    .join("\n\n");
            return `### ${wikiLecture(subject.subject)}\n\n${modules}`;
          })
          .join("\n\n");

  const assignmentLines =
    assignments.length === 0
      ? "_Заданий пока нет._"
      : assignments
          .map((assignment) => {
            const lecture = assignment.lectureSlug
              ? wikiLecture(assignment.lectureSlug)
              : "без лекции";
            const status =
              assignment.status === "done"
                ? "сдано"
                : assignment.status === "in-progress"
                  ? "в работе"
                  : "не начато";
            return `- ${wikiAssignment(assignment.slug)} — ${status} · ${lecture} · \`${assignment.codePath}\``;
          })
          .join("\n");

  const body = [
    "# Карта курса",
    "",
    "Эта заметка обновляется Лекторием. В Obsidian по ней строится граф: предмет → модуль → лекция → задание.",
    "",
    "## Предметы",
    "",
    subjectSections,
    "",
    "## Задания",
    "",
    assignmentLines,
    "",
    "## Как открывать",
    "",
    "- **Obsidian:** Open folder as vault → папка `vault/`.",
    "- **Zed:** File → Open → корень репозитория, затем работай в `code/`.",
    "",
  ].join("\n");

  await writeNote(
    COURSE_MAP,
    {
      type: "map",
      title: "Карта курса",
    },
    body,
  );
}

function lectureBody(input: {
  title: string;
  subject: string;
  module: string;
  source?: string;
  markdown: string;
}) {
  const sourceLine = input.source
    ? `> Источник: [${input.title}](${input.source})`
    : "> Источник: конспект без ссылки";
  return [
    `# ${input.title}`,
    "",
    sourceLine,
    "",
    `Предмет: ${wikiLecture(input.subject)} · Модуль: ${wikiLecture(`${input.subject}/${input.module}`)}`,
    "",
    "## Конспект",
    "",
    input.markdown.trim(),
    "",
    "## Связанные задания",
    "",
    "_Пока нет. Создай задание в Лектории — ссылка появится здесь и в графе Obsidian._",
    "",
  ].join("\n");
}

function assignmentSection(assignmentSlugs: string[]) {
  if (assignmentSlugs.length === 0) {
    return "_Пока нет. Создай задание в Лектории — ссылка появится здесь и в графе Obsidian._";
  }
  return assignmentSlugs.map((slug) => `- ${wikiAssignment(slug)}`).join("\n");
}

export async function createLecture(input: {
  title: string;
  markdown: string;
  subject: string;
  module: string;
  source?: string;
  tags?: string[];
}) {
  await ensureWorkspace();
  const subject = noteFileName(input.subject);
  const moduleName = noteFileName(input.module);
  const moduleDir = path.join(LECTURES_DIR, subject, moduleName);
  await ensureDir(moduleDir);
  const existing = await listMarkdown(moduleDir);
  const slug = `${subject}/${moduleName}/${numberedTitle(nextIndex(existing), input.title)}`;
  const captured = new Date().toISOString().slice(0, 10);
  const body = lectureBody({
    title: input.title.trim(),
    subject,
    module: moduleName,
    source: input.source,
    markdown: input.markdown,
  });
  await writeNote(
    lecturePath(slug),
    {
      type: "lecture",
      title: input.title.trim(),
      subject,
      module: moduleName,
      source: input.source ?? "",
      captured,
      tags: input.tags ?? [],
      assignments: [],
    },
    body,
  );
  await ensureLectureAttachments(slug);
  await rebuildCourseMap();
  return readLecture(slug);
}

async function rewriteLectureAssignments(
  lectureSlug: string,
  assignmentSlugs: string[],
) {
  const raw = await fs.readFile(lecturePath(lectureSlug), "utf8");
  const parsed = matter(raw);
  const nextBody = replaceSection(
    parsed.content,
    "Связанные задания",
    assignmentSection(assignmentSlugs),
  );
  await writeNote(
    lecturePath(lectureSlug),
    {
      ...parsed.data,
      assignments: assignmentSlugs,
    },
    nextBody,
  );
}

function assignmentMarkdown(input: {
  title: string;
  prompt: string;
  lectureSlug?: string;
  codePath: string;
}) {
  const lectureBlock = input.lectureSlug
    ? wikiLecture(input.lectureSlug)
    : "_Задание пока не привязано к лекции._";
  return [
    `# ${input.title}`,
    "",
    "## Лекция",
    "",
    lectureBlock,
    "",
    "## Условие",
    "",
    input.prompt.trim(),
    "",
    "## Код",
    "",
    `Папка для Zed: \`${input.codePath}\``,
    "",
    "Открой корень репозитория в Zed и работай в этой папке. Заметки смотри в Obsidian (`vault/`).",
    "",
    "## Статус",
    "",
    "не начато",
    "",
  ].join("\n");
}

export async function createAssignment(input: {
  title: string;
  prompt: string;
  lectureSlug?: string;
  language: CodeLanguage;
}) {
  await ensureWorkspace();
  const lecture = input.lectureSlug
    ? await readLecture(input.lectureSlug)
    : undefined;
  const existing = await listMarkdown(ASSIGNMENTS_DIR);
  const index = nextIndex(existing);
  const slug = numberedTitle(index, input.title);
  const folder = `${index}-${folderSlug(input.title)}`;
  const codePath = `code/${folder}`;
  const created = new Date().toISOString().slice(0, 10);
  const body = assignmentMarkdown({
    title: input.title.trim(),
    prompt: input.prompt,
    lectureSlug: input.lectureSlug,
    codePath,
  });

  await writeNote(
    assignmentPath(slug),
    {
      type: "assignment",
      title: input.title.trim(),
      status: "todo",
      lecture: input.lectureSlug ?? "",
      code_path: codePath,
      language: input.language,
      created,
      tags: [],
    },
    body,
  );

  const assignment = await readAssignment(slug);
  await createCodeProject({ folder, assignment, lecture });

  if (lecture) {
    const next = [...new Set([...lecture.assignmentSlugs, slug])];
    await rewriteLectureAssignments(lecture.slug, next);
  }

  await rebuildCourseMap();
  return { assignment: await readAssignment(slug), folder, codePath };
}

export async function updateAssignmentStatus(
  slug: string,
  status: AssignmentStatus,
) {
  const raw = await fs.readFile(assignmentPath(slug), "utf8");
  const parsed = matter(raw);
  const statusLabel =
    status === "done"
      ? "сдано"
      : status === "in-progress"
        ? "в работе"
        : "не начато";
  const body = replaceSection(parsed.content, "Статус", statusLabel);
  await writeNote(
    assignmentPath(slug),
    {
      ...parsed.data,
      status,
    },
    body,
  );
  await rebuildCourseMap();
  return readAssignment(slug);
}

export async function getLectureOrNull(slug: string) {
  try {
    return await readLecture(slug);
  } catch {
    return null;
  }
}

export async function getAssignmentOrNull(slug: string) {
  try {
    return await readAssignment(slug);
  } catch {
    return null;
  }
}

export function codeAbsPath(codePath: string) {
  const rel = codePath.replace(/^code\/?/, "");
  assertSafeSlug(rel.split("/")[0] ?? "");
  return path.join(CODE_DIR, rel);
}

async function pathExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceLecturePath(text: string, from: string, to: string) {
  if (!from || from === to) return text;
  const escaped = escapeRegExp(from);
  return text.replace(
    new RegExp(
      `((?:Лекции/)|(?:vault/Лекции/))${escaped}(?=/|\\||\\]|\\.md|"|'|$)`,
      "g",
    ),
    `$1${to}`,
  );
}

function replaceBareLectureSlug(text: string, from: string, to: string) {
  if (!from || from === to) return text;
  const escaped = escapeRegExp(from);
  return text
    .replace(
      new RegExp(`^(lecture:\\s*["']?)${escaped}(["']?\\s*)$`, "gm"),
      `$1${to}$2`,
    )
    .replace(
      new RegExp(`^(lecture:\\s*["']?)${escaped}/`, "gm"),
      `$1${to}/`,
    );
}

async function listVaultMarkdownFiles() {
  const slugs = await listMarkdownTree(VAULT_DIR);
  return slugs.map((slug) => path.join(VAULT_DIR, `${slug}.md`));
}

async function listCodeNoteFiles() {
  try {
    const entries = await fs.readdir(CODE_DIR, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      for (const name of ["README.md", "ЗАДАНИЕ.md"]) {
        const file = path.join(CODE_DIR, entry.name, name);
        if (await pathExists(file)) files.push(file);
      }
    }
    return files;
  } catch {
    return [];
  }
}

async function rewritePathRefs(from: string, to: string) {
  const files = [
    ...(await listVaultMarkdownFiles()),
    ...(await listCodeNoteFiles()),
  ];
  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const next = replaceBareLectureSlug(
      replaceLecturePath(raw, from, to),
      from,
      to,
    );
    if (next !== raw) {
      await fs.writeFile(file, next, "utf8");
    }
  }
}

async function syncLecturePlacement() {
  const slugs = await listMarkdownTree(LECTURES_DIR);
  for (const slug of slugs) {
    let lecture: Lecture;
    try {
      lecture = await readLecture(slug);
    } catch {
      continue;
    }
    const parts = slug.split("/");
    if (parts.length < 3) continue;
    const [subject, moduleName] = parts;
    if (lecture.subject === subject && lecture.module === moduleName) continue;
    const raw = await fs.readFile(lecturePath(slug), "utf8");
    const parsed = matter(raw);
    let body = parsed.content;
    body = replaceLecturePath(body, lecture.subject, subject);
    body = replaceLecturePath(
      body,
      `${lecture.subject}/${lecture.module}`,
      `${subject}/${moduleName}`,
    );
    await writeNote(
      lecturePath(slug),
      {
        ...parsed.data,
        subject,
        module: moduleName,
      },
      body,
    );
  }
}

export async function createSubject(title: string) {
  await ensureWorkspace();
  const name = noteFileName(title);
  const note = path.join(LECTURES_DIR, `${name}.md`);
  const dir = path.join(LECTURES_DIR, name);
  if ((await pathExists(note)) || (await pathExists(dir))) {
    throw new Error("Такой предмет уже есть");
  }
  await writeNote(
    note,
    { type: "subject", title: name },
    subjectIndexBody(name, []),
  );
  await ensureDir(dir);
  await rebuildCourseMap();
  return { subject: name };
}

export async function createModule(subjectInput: string, title: string) {
  await ensureWorkspace();
  const subject = noteFileName(subjectInput);
  const moduleName = noteFileName(title);
  const subjectDir = path.join(LECTURES_DIR, subject);
  const subjectNote = path.join(LECTURES_DIR, `${subject}.md`);
  if (!(await pathExists(subjectDir)) && !(await pathExists(subjectNote))) {
    await createSubject(subject);
  }
  const note = path.join(subjectDir, `${moduleName}.md`);
  const dir = path.join(subjectDir, moduleName);
  if ((await pathExists(note)) || (await pathExists(dir))) {
    throw new Error("Такой модуль уже есть");
  }
  await writeNote(
    note,
    { type: "module", title: moduleName, subject },
    moduleIndexBody(subject, moduleName, []),
  );
  await ensureDir(dir);
  await rebuildCourseMap();
  return { subject, module: moduleName };
}

export async function renameSubject(from: string, toRaw: string) {
  await ensureWorkspace();
  const to = noteFileName(toRaw);
  if (from === to) return { subject: to };
  assertSafeRelPath(to);
  const fromDir = path.join(LECTURES_DIR, from);
  const toDir = path.join(LECTURES_DIR, to);
  const fromNote = path.join(LECTURES_DIR, `${from}.md`);
  const toNote = path.join(LECTURES_DIR, `${to}.md`);
  if ((await pathExists(toDir)) || (await pathExists(toNote))) {
    throw new Error("Предмет с таким именем уже есть");
  }
  if (!(await pathExists(fromDir)) && !(await pathExists(fromNote))) {
    throw new Error("Предмет не найден");
  }
  if (await pathExists(fromDir)) await fs.rename(fromDir, toDir);
  if (await pathExists(fromNote)) await fs.rename(fromNote, toNote);
  await rewritePathRefs(from, to);
  await syncLecturePlacement();
  await rebuildCourseMap();
  return { subject: to };
}

export async function renameModule(
  subject: string,
  from: string,
  toRaw: string,
) {
  await ensureWorkspace();
  const to = noteFileName(toRaw);
  if (from === to) return { subject, module: to };
  const fromDir = path.join(LECTURES_DIR, subject, from);
  const toDir = path.join(LECTURES_DIR, subject, to);
  const fromNote = path.join(LECTURES_DIR, subject, `${from}.md`);
  const toNote = path.join(LECTURES_DIR, subject, `${to}.md`);
  if ((await pathExists(toDir)) || (await pathExists(toNote))) {
    throw new Error("Модуль с таким именем уже есть");
  }
  if (!(await pathExists(fromDir)) && !(await pathExists(fromNote))) {
    throw new Error("Модуль не найден");
  }
  if (await pathExists(fromDir)) await fs.rename(fromDir, toDir);
  if (await pathExists(fromNote)) await fs.rename(fromNote, toNote);
  await rewritePathRefs(`${subject}/${from}`, `${subject}/${to}`);
  await syncLecturePlacement();
  await rebuildCourseMap();
  return { subject, module: to };
}

export async function renameLecture(slug: string, titleRaw: string) {
  await ensureWorkspace();
  await readLecture(slug);
  const parts = slug.split("/");
  const currentName = parts.at(-1) ?? slug;
  const index = currentName.match(/^(\d+)/)?.[1] ?? "01";
  const nextName = numberedTitle(index, titleRaw);
  const title = nextName.replace(/^\d+\s*[—-]\s*/, "");
  const newSlug = [...parts.slice(0, -1), nextName].join("/");
  if (newSlug !== slug) {
    if (await pathExists(lecturePath(newSlug))) {
      throw new Error("Лекция с таким именем уже есть");
    }
    const fromFolder = lectureFolderPath(slug);
    const toFolder = lectureFolderPath(newSlug);
    if (
      (await pathExists(fromFolder)) &&
      (await pathExists(toFolder))
    ) {
      throw new Error("Папка вложений с таким именем уже есть");
    }
    await fs.rename(lecturePath(slug), lecturePath(newSlug));
    if (await pathExists(fromFolder)) {
      await fs.rename(fromFolder, toFolder);
    }
    await rewritePathRefs(slug, newSlug);
  }
  const raw = await fs.readFile(lecturePath(newSlug), "utf8");
  const parsed = matter(raw);
  const body = parsed.content.replace(/^# .+$/m, `# ${title}`);
  await writeNote(
    lecturePath(newSlug),
    {
      ...parsed.data,
      title,
    },
    body,
  );
  await rebuildCourseMap();
  return readLecture(newSlug);
}
