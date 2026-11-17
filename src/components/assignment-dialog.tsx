"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { assignmentHref } from "@/lib/links";
import { groupLectures } from "@/lib/taxonomy";
import {
  CODE_LANGUAGES,
  CODE_LANGUAGE_LABEL,
  type CodeLanguage,
} from "@/lib/types";

export function AssignmentDialog({
  lectures,
  defaultLectureSlug,
  triggerLabel = "Новое задание",
}: {
  lectures: { slug: string; title: string; subject: string; module: string }[];
  defaultLectureSlug?: string;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [lectureSlug, setLectureSlug] = useState(defaultLectureSlug ?? "");
  const [language, setLanguage] = useState<CodeLanguage>("python");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setPrompt("");
    setLectureSlug(defaultLectureSlug ?? "");
    setLanguage("python");
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          prompt,
          lectureSlug: lectureSlug || undefined,
          language,
        }),
      });
      const data = (await response.json()) as {
        assignment?: { slug: string };
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать задание");
      }
      toast.success("Задание связано с лекцией и папкой кода");
      setOpen(false);
      reset();
      router.refresh();
      if (data.assignment?.slug) {
        router.push(assignmentHref(data.assignment.slug));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <ListChecks data-icon="inline-start" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Задание</DialogTitle>
          <DialogDescription>
            Создастся заметка в Obsidian и папка в <code>code/</code> для Zed.
            Wiki-ссылка на лекцию проставится сама.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="assignment-title">Название</Label>
            <Input
              id="assignment-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Написать функцию greet"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assignment-lecture">Лекция</Label>
            <select
              id="assignment-lecture"
              value={lectureSlug}
              onChange={(event) => setLectureSlug(event.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">Без лекции</option>
              {groupLectures(lectures).map((subject) =>
                subject.modules.map((mod) => (
                  <optgroup
                    key={`${subject.subject}/${mod.module}`}
                    label={`${subject.subject} · ${mod.module}`}
                  >
                    {mod.lectures.map((lecture) => (
                      <option key={lecture.slug} value={lecture.slug}>
                        {lecture.title}
                      </option>
                    ))}
                  </optgroup>
                )),
              )}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assignment-language">Язык кода</Label>
            <select
              id="assignment-language"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as CodeLanguage)
              }
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              {CODE_LANGUAGES.map((item) => (
                <option key={item} value={item}>
                  {CODE_LANGUAGE_LABEL[item]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assignment-prompt">Условие</Label>
            <Textarea
              id="assignment-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-32"
              placeholder="Что нужно сделать, ограничения, примеры входа и выхода."
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            disabled={saving || !title.trim() || !prompt.trim()}
            onClick={save}
          >
            {saving ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : null}
            Создать и связать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
