export type AssignmentStatus = "todo" | "in-progress" | "done";
export const CODE_LANGUAGES = [
  "python",
  "typescript",
  "javascript",
  "rust",
  "markdown",
] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const CODE_LANGUAGE_LABEL: Record<CodeLanguage, string> = {
  python: "Python",
  typescript: "TypeScript",
  javascript: "JavaScript",
  rust: "Rust",
  markdown: "Markdown",
};

export function isCodeLanguage(value: string): value is CodeLanguage {
  return (CODE_LANGUAGES as readonly string[]).includes(value);
}

export type Lecture = {
  slug: string;
  title: string;
  subject: string;
  module: string;
  source?: string;
  captured: string;
  tags: string[];
  assignmentSlugs: string[];
  excerpt: string;
  body: string;
};

export type Assignment = {
  slug: string;
  title: string;
  status: AssignmentStatus;
  lectureSlug?: string;
  codePath: string;
  language: CodeLanguage;
  created: string;
  tags: string[];
  body: string;
};

export type CodeProject = {
  slug: string;
  path: string;
  assignmentSlug?: string;
  language?: CodeLanguage;
};

export type Overview = {
  lectures: Lecture[];
  assignments: Assignment[];
  codeProjects: CodeProject[];
};

export const STATUS_LABEL: Record<AssignmentStatus, string> = {
  todo: "Не начато",
  "in-progress": "В работе",
  done: "Сдано",
};
