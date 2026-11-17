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
  captureId?: string;
  images?: string[];
  error?: string;
};

const NEW_VALUE = "__new__";
const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

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
  defaultMode?: "url" | "manual" | "html";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"url" | "manual" | "html">(
    defaultMode ?? "url",
  );
  const [htmlFiles, setHtmlFiles] = useState<File[]>([]);
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
  const [captureId, setCaptureId] = useState<string | undefined>();
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
    setHtmlFiles([]);
    setError(null);
    setPreviewed(false);
    setStub(false);
    setCaptureId(undefined);
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
      if (data.title) setTitle(data.title);
      setMarkdown(data.markdown);
      setSource(data.source);
      setPreviewed(true);
      setStub(Boolean(data.stub));
      setCaptureId(data.captureId);
      if (data.error) setError(data.error);
      if (data.stub) {
        toast.message("Текст со страницы не прочитан", {
          description:
            data.error ||
            "Вставь конспект вручную или подключи локальный модуль разбора.",
        });
      } else if (data.images?.length) {
        toast.success(`Скачано картинок: ${data.images.length}`);
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

  function applyExtracted(data: Extracted) {
    if (data.title) setTitle(data.title);
    setMarkdown(data.markdown);
    setSource(data.source || source || url);
    setPreviewed(true);
    setStub(Boolean(data.stub));
    setCaptureId(data.captureId);
    if (data.error) setError(data.error);
    if (data.stub) {
      toast.message("Конспект из HTML не собран", {
        description:
          data.error ||
          "Модуль разбора не собрал текст. Вставь конспект вручную.",
      });
    } else if (data.images?.length) {
      toast.success(`Скачано картинок: ${data.images.length}`);
    }
  }

  function isCaptureFile(file: File) {
    const name = file.webkitRelativePath || file.name;
    return (
      /\.html?$|\.xhtml$/i.test(name) ||
      /html/i.test(file.type) ||
      /\.(png|jpe?g|gif|webp|svg)$/i.test(name) ||
      /^image\//i.test(file.type)
    );
  }

  async function previewHtml() {
    setLoading(true);
    setError(null);
    try {
      const selected = htmlFiles.filter(isCaptureFile);
      const hasHtml = selected.some((file) => {
        const name = file.webkitRelativePath || file.name;
        return /\.html?$|\.xhtml$/i.test(name) || /html/i.test(file.type);
      });
      if (!hasHtml) {
        throw new Error("Выбери .html сохранённой страницы");
      }
      const form = new FormData();
      if (url.trim()) form.append("source", url.trim());
      form.append(
        "paths",
        JSON.stringify(
          selected.map((file) => file.webkitRelativePath || file.name),
        ),
      );
      for (const file of selected) {
        form.append("files", file, file.webkitRelativePath || file.name);
      }
      const response = await fetch("/api/capture", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as Extracted & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Не удалось разобрать HTML");
      }
      applyExtracted(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось разобрать HTML",
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
          captureId,
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
          <TabsList className="h-auto min-h-8 w-full flex-wrap">
            <TabsTrigger value="url">Из URL</TabsTrigger>
            <TabsTrigger value="html">HTML целиком</TabsTrigger>
            <TabsTrigger value="manual">Вставить текст</TabsTrigger>
          </TabsList>
          <TabsContent value="url" className="space-y-3 pt-3">
            <p className="text-sm text-muted-foreground">
              Если подключён локальный модуль разбора страниц, по ссылке
              соберётся черновик. Иначе вставь текст на вкладке «Вставить текст».
            </p>
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
          <TabsContent value="html" className="space-y-3 pt-3">
            <p className="text-sm text-muted-foreground">
              Сюда можно передать сохранённый HTML (и папку с картинками),
              если твой модуль разбора это умеет. Без модуля вкладка ничего
              не соберёт — используй «Вставить текст».
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="saved-html">HTML и картинки</Label>
              <Input
                id="saved-html"
                type="file"
                multiple
                accept=".html,.htm,.xhtml,.png,.jpg,.jpeg,.gif,.webp,.svg,text/html,image/*"
                onChange={(event) =>
                  setHtmlFiles(Array.from(event.target.files ?? []))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="saved-folder">Или папка сохранённой страницы</Label>
              <Input
                id="saved-folder"
                type="file"
                multiple
                {...{ webkitdirectory: "", directory: "" }}
                onChange={(event) =>
                  setHtmlFiles(Array.from(event.target.files ?? []))
                }
              />
            </div>
            {htmlFiles.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Выбрано файлов: {htmlFiles.length}
              </p>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="html-source">Ссылка-источник (необязательно)</Label>
              <Input
                id="html-source"
                placeholder="https://..."
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || htmlFiles.length === 0}
              onClick={previewHtml}
            >
              {loading ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : null}
              Разобрать HTML
            </Button>
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
                <select
                  id="lecture-subject"
                  className={selectClass}
                  value={
                    taxonomy.some((item) => item.subject === subject)
                      ? subject
                      : subject.trim()
                        ? NEW_VALUE
                        : ""
                  }
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === NEW_VALUE) {
                      setSubject("");
                      setModuleName("");
                      return;
                    }
                    setSubject(value);
                    const mods =
                      taxonomy.find((item) => item.subject === value)?.modules ??
                      [];
                    setModuleName(mods.includes(moduleName) ? moduleName : "");
                  }}
                >
                  <option value="" disabled>
                    Выбери предмет
                  </option>
                  {taxonomy.map((item) => (
                    <option key={item.subject} value={item.subject}>
                      {item.subject}
                    </option>
                  ))}
                  <option value={NEW_VALUE}>Новый предмет…</option>
                </select>
                {!taxonomy.some((item) => item.subject === subject) ? (
                  <Input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Название нового предмета"
                  />
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lecture-module">Модуль</Label>
                <select
                  id="lecture-module"
                  className={selectClass}
                  value={
                    moduleOptions.includes(moduleName)
                      ? moduleName
                      : moduleName.trim()
                        ? NEW_VALUE
                        : ""
                  }
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === NEW_VALUE) {
                      setModuleName("");
                      return;
                    }
                    setModuleName(value);
                  }}
                >
                  <option value="" disabled>
                    Выбери модуль
                  </option>
                  {moduleOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value={NEW_VALUE}>Новый модуль…</option>
                </select>
                {!moduleOptions.includes(moduleName) ? (
                  <Input
                    value={moduleName}
                    onChange={(event) => setModuleName(event.target.value)}
                    placeholder="Название нового модуля"
                  />
                ) : null}
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
            {(mode === "manual" || (mode === "html" && previewed)) && (
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
