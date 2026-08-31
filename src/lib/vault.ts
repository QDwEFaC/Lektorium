import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { createCodeProject } from "@/lib/code-project";
import {
  ASSIGNMENTS_DIR,
  assignmentPath,
  CODE_DIR,
  COURSE_MAP,
  LECTURES_DIR,
  lecturePath,
  wikiAssignment,
  wikiLecture,
} from "@/lib/paths";
import { assertSafeSlug, folderSlug, nextIndex, numberedTitle } from "@/lib/slug";
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
  ]);
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

export async function readLecture(slug: string): Promise<Lecture> {
  assertSafeSlug(slug);
  const raw = await fs.readFile(lecturePath(slug), "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  return {
    slug,
    title: String(data.title ?? slug),
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
  const slugs = await listMarkdown(LECTURES_DIR);
  return Promise.all(slugs.map((slug) => readLecture(slug)));
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

async function writeNote(
  file: string,
  data: Record<string, unknown>,
  body: string,
) {
  const serialized = matter.stringify(`${body.trim()}\n`, data);
  await fs.writeFile(file, serialized, "utf8");
}

export async function rebuildCourseMap() {
  const { lectures, assignments } = await getOverview();
  const lectureLines =
    lectures.length === 0
      ? "_Лекций пока нет._"
      : lectures
          .map((lecture) => {
            const count = lecture.assignmentSlugs.length;
            const suffix =
              count === 0
                ? "нет заданий"
                : count === 1
                  ? "1 задание"
                  : `${count} задания`;
            return `- ${wikiLecture(lecture.slug)} — ${suffix}`;
          })
          .join("\n");

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
    "Эта заметка обновляется Лекторием. В Obsidian по ней строится граф: лекция → задание → папка кода.",
    "",
    "## Лекции",
    "",
    lectureLines,
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

function lectureBody(
  title: string,
  source: string | undefined,
  markdown: string,
) {
  const sourceLine = source
    ? `> Источник: [${title}](${source})`
    : "> Источник: конспект без ссылки";
  return [
    `# ${title}`,
    "",
    sourceLine,
    "",
    "## Конспект",
    "",
    markdown.trim(),
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
  source?: string;
  tags?: string[];
}) {
  await ensureWorkspace();
  const existing = await listMarkdown(LECTURES_DIR);
  const slug = numberedTitle(nextIndex(existing), input.title);
  const captured = new Date().toISOString().slice(0, 10);
  const body = lectureBody(input.title.trim(), input.source, input.markdown);
  await writeNote(
    lecturePath(slug),
    {
      type: "lecture",
      title: input.title.trim(),
      source: input.source ?? "",
      captured,
      tags: input.tags ?? [],
      assignments: [],
    },
    body,
  );
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
