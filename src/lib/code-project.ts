import fs from "node:fs/promises";
import path from "node:path";
import type { Assignment, CodeLanguage, Lecture } from "@/lib/types";
import { CODE_DIR } from "@/lib/paths";

const STARTERS: Record<
  CodeLanguage,
  (title: string) => { file: string; contents: string }
> = {
  python: (title) => ({
    file: "main.py",
    contents: `"""
Задание: ${title}

Открой связанную заметку в Obsidian (папка vault/Задания).
Когда закончишь — отметь статус «Сдано» в Лектории.
"""


def solve() -> None:
    # Напиши решение здесь
    raise NotImplementedError


if __name__ == "__main__":
    solve()
`,
  }),
  typescript: (title) => ({
    file: "src/index.ts",
    contents: `/**
 * Задание: ${title}
 *
 * Открой связанную заметку в Obsidian (папка vault/Задания).
 */

export function solve(): void {
  throw new Error("Напиши решение здесь");
}

solve();
`,
  }),
  javascript: (title) => ({
    file: "src/index.js",
    contents: `/**
 * Задание: ${title}
 *
 * Открой связанную заметку в Obsidian (папка vault/Задания).
 */

export function solve() {
  throw new Error("Напиши решение здесь");
}

solve();
`,
  }),
  rust: (title) => ({
    file: "main.rs",
    contents: `//! Задание: ${title}
//!
//! Открой связанную заметку в Obsidian (папка vault/Задания).

fn solve() {
    todo!("Напиши решение здесь");
}

fn main() {
    solve();
}
`,
  }),
  markdown: (title) => ({
    file: "notes.md",
    contents: `# ${title}

Открой связанную заметку в Obsidian (папка vault/Задания).

Напиши решение здесь.
`,
  }),
};

export async function createCodeProject(input: {
  folder: string;
  assignment: Assignment;
  lecture?: Lecture;
  targetSlug?: string;
}) {
  const dir = path.join(CODE_DIR, input.folder);
  await fs.mkdir(dir, { recursive: true });

  const starter = STARTERS[input.assignment.language](input.assignment.title);
  const filePath = path.join(dir, starter.file);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, starter.contents, "utf8");

  const attached =
    input.lecture?.slug ?? input.targetSlug ?? input.assignment.lectureSlug;
  const lectureLine = attached
    ? `- Привязка: \`vault/Лекции/${attached}.md\``
    : "- Привязка: нет";

  const prompt =
    input.assignment.body
      .split("## Условие")[1]
      ?.split("## Код")[0]
      ?.trim() ?? "См. заметку задания в vault.";

  const readme = `# ${input.assignment.title}

Эта папка — место для кода в **Zed**. Заметки живут в Obsidian.

${lectureLine}
- Задание: \`vault/Задания/${input.assignment.slug}.md\`
- Язык: ${input.assignment.language}

## Как работать

1. В Zed открой корень репозитория (или сразу эту папку).
2. Пиши решение в \`${starter.file}\`.
3. Когда закончишь, в Лектории поставь статус «Сдано» — ссылка в Obsidian обновится.
`;

  await fs.writeFile(path.join(dir, "README.md"), readme, "utf8");

  const taskNote = `# ${input.assignment.title}

${prompt}

---

- Заметка: \`vault/Задания/${input.assignment.slug}.md\`
${attached ? `- Привязка: \`vault/Лекции/${attached}.md\`` : ""}
`;
  await fs.writeFile(path.join(dir, "ЗАДАНИЕ.md"), taskNote, "utf8");

  return { path: `code/${input.folder}`, file: starter.file };
}
