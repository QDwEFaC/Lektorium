import path from "node:path";

export const ROOT = process.cwd();
export const VAULT_DIR = path.join(ROOT, "vault");
export const LECTURES_DIR = path.join(VAULT_DIR, "Лекции");
export const ASSIGNMENTS_DIR = path.join(VAULT_DIR, "Задания");
export const TEMPLATES_DIR = path.join(VAULT_DIR, "Шаблоны");
export const CODE_DIR = path.join(ROOT, "code");
export const COURSE_MAP = path.join(VAULT_DIR, "Карта курса.md");
export const HOME_NOTE = path.join(VAULT_DIR, "00 Главная.md");

export function lecturePath(slug: string) {
  return path.join(LECTURES_DIR, `${slug}.md`);
}

export function assignmentPath(slug: string) {
  return path.join(ASSIGNMENTS_DIR, `${slug}.md`);
}

export function wikiLecture(slug: string) {
  return `[[Лекции/${slug}]]`;
}

export function wikiAssignment(slug: string) {
  return `[[Задания/${slug}]]`;
}
