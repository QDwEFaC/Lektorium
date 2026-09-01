export type AssignmentStatus = "todo" | "in-progress" | "done";
export type CodeLanguage = "python" | "typescript" | "javascript";

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
