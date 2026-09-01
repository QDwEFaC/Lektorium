"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lectureHref } from "@/lib/links";

type Extracted = {
  title: string;
  markdown: string;
  excerpt: string;
  source: string;
  stub: boolean;
  suggestedSubject?: string;
};

type Taxonomy = { subject: string; modules: string[] }[];

export function CaptureDialog({
  triggerLabel = "Сохранить из URL",
  triggerVariant = "default",
  defaultSubject = "",
  defaultModule = "",
  defaultMode,
}: {
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
  defaultSubject?: string;
  defaultModule?: string;
  defaultMode?: "url" | "manual";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"url" | "manual">(defaultMode ?? "url");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [moduleName, setModuleName] = useState(defaultModule);
  const [markdown, setMarkdown] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewed, setPreviewed] = useState(false);
  const [stub, setStub] = useState(false);
  const [taxonomy, setTaxonomy] = useState<Taxonomy>([]);

  function applyDefaults() {
    setSubject(defaultSubject);
    setModuleName(defaultModule);
    if (defaultMode) setMode(defaultMode);
    if (defaultMode === "manual") {
      setMarkdown((current) => current || "_Конспект пока не записан._");
    }
  }

  function reset() {
    setUrl("");
    setTitle("");
    setSubject(defaultSubject);
    setModuleName(defaultModule);
    setMarkdown("");
    setSource("");
    setError(null);
    setPreviewed(false);
    setStub(false);
    setMode(defaultMode ?? "url");
  }

  useEffect(() => {
    if (!open) return;
    fetch("/api/lectures")
      .then((response) => response.json())
      .then((data: { taxonomy?: Taxonomy }) => {
        setTaxonomy(data.taxonomy ?? []);
      })
      .catch(() => {
        setTaxonomy([]);
      });
  }, [open]);

  const moduleOptions = useMemo(() => {
    const match = taxonomy.find((item) => item.subject === subject);
    return match?.modules ?? [];
  }, [taxonomy, subject]);

  async function preview() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await response.json()) as Extracted & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Не удалось прочитать страницу");
      }
      if (data.suggestedSubject) {
        setSubject(data.suggestedSubject);
        setTitle(data.title === data.suggestedSubject ? "" : data.title);
      } else {
        setTitle(data.title);
      }
      setMarkdown(data.markdown);
      setSource(data.source);
      setPreviewed(true);
      setStub(Boolean(data.stub));
      if (data.stub) {
        toast.message("Текст со страницы не прочитан", {
          description:
            "Укажи предмет, модуль и название урока, затем вставь конспект.",
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Страница недоступна. Вставь текст вручную.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          markdown,
          subject,
          module: moduleName,
          source: source || url || undefined,
        }),
      });
      const data = (await response.json()) as { slug?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Не удалось сохранить");
      }
      toast.success("Лекция сохранена в предмет и модуль");
      setOpen(false);
      reset();
      router.refresh();
      if (data.slug) {
        router.push(lectureHref(data.slug));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  const canSave =
    Boolean(title.trim()) &&
    Boolean(markdown.trim()) &&
    Boolean(subject.trim()) &&
    Boolean(moduleName.trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
        else applyDefaults();
      }}
    >
      <DialogTrigger render={<Button variant={triggerVariant} />}>
        <Link2 data-icon="inline-start" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Сохранить материал</DialogTitle>
          <DialogDescription>
            Заметка попадёт в Obsidian как предмет → модуль → лекция. Потом к
            ней можно привязать задание и папку кода для Zed.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
          <TabsList>
            <TabsTrigger value="url">Из URL</TabsTrigger>
            <TabsTrigger value="manual">Вставить текст</TabsTrigger>
          </TabsList>
          <TabsContent value="url" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="source-url">Ссылка на лекцию или статью</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="source-url"
                  placeholder="https://..."
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading || !url.trim()}
                  onClick={preview}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : null}
                  Прочитать
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="manual" className="space-y-3 pt-3">
            <p className="text-sm text-muted-foreground">
              Если страница не открывается (видео, PDF, закрытый курс) — вставь
              заголовок и конспект сами.
            </p>
          </TabsContent>
        </Tabs>

        {(previewed || mode === "manual") && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lecture-subject">Предмет</Label>
                <Input
                  id="lecture-subject"
                  list="subject-options"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Машинное обучение"
                />
                <datalist id="subject-options">
                  {taxonomy.map((item) => (
                    <option key={item.subject} value={item.subject} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lecture-module">Модуль</Label>
                <Input
                  id="lecture-module"
                  list="module-options"
                  value={moduleName}
                  onChange={(event) => setModuleName(event.target.value)}
                  placeholder="Модуль 1. Введение"
                />
                <datalist id="module-options">
                  {moduleOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lecture-title">Название лекции</Label>
              <Input
                id="lecture-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Как устроены функции"
              />
            </div>
            {mode === "manual" && (
              <div className="space-y-1.5">
                <Label htmlFor="manual-source">Источник (необязательно)</Label>
                <Input
                  id="manual-source"
                  placeholder="https://..."
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="lecture-body">Конспект в markdown</Label>
              {stub ? (
                <p className="text-sm text-muted-foreground">
                  Автоматически вытащить текст не получилось. Открой урок в
                  браузере, скопируй конспект и вставь сюда.
                </p>
              ) : null}
              <Textarea
                id="lecture-body"
                value={markdown}
                onChange={(event) => setMarkdown(event.target.value)}
                className="min-h-48 font-mono text-sm"
                placeholder="Основные мысли, формулы, примеры..."
              />
            </div>
          </div>
        )}

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          >
            Отмена
          </Button>
          <Button disabled={saving || !canSave} onClick={save}>
            {saving ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : null}
            Сохранить в vault
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
