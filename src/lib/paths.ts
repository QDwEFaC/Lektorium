import path from "node:path";
import { assertSafeRelPath } from "@/lib/slug";

export const ROOT = process.cwd();
export const VAULT_DIR = path.join(ROOT, "vault");
export const LECTURES_DIR = path.join(VAULT_DIR, "Лекции");
export const ASSIGNMENTS_DIR = path.join(VAULT_DIR, "Задания");
export const TEMPLATES_DIR = path.join(VAULT_DIR, "Шаблоны");
export const ATTACHMENTS_FOLDER = "Вложения";
export const VAULT_ATTACHMENTS_DIR = path.join(VAULT_DIR, ATTACHMENTS_FOLDER);
export const CODE_DIR = path.join(ROOT, "code");
export const COURSE_MAP = path.join(VAULT_DIR, "Карта курса.md");
export const HOME_NOTE = path.join(VAULT_DIR, "00 Главная.md");

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);

function assertInside(resolved: string, root: string) {
  const base = path.resolve(root);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error("Некорректное имя файла");
  }
}

export function isAllowedImageExt(ext: string) {
  return IMAGE_EXT.has(ext.toLowerCase());
}

export function lecturePath(slug: string) {
  assertSafeRelPath(slug);
  const resolved = path.resolve(LECTURES_DIR, `${slug}.md`);
  assertInside(resolved, LECTURES_DIR);
  return resolved;
}

/** Каталог `Вложения` рядом с файлом лекции: `…/01 — Название/Вложения`. */
export function attachmentsDir(slug: string) {
  const note = lecturePath(slug);
  const stem = path.basename(note, ".md");
  return path.join(path.dirname(note), stem, ATTACHMENTS_FOLDER);
}

export function lectureFolderPath(slug: string) {
  return path.dirname(attachmentsDir(slug));
}

export function vaultFilePath(rel: string) {
  assertSafeRelPath(rel);
  const resolved = path.resolve(VAULT_DIR, rel);
  assertInside(resolved, VAULT_DIR);
  return resolved;
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
