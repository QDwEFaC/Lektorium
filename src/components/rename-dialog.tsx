"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
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
import { lectureHref } from "@/lib/links";

export function RenameDialog({
  kind,
  current,
  subject,
  slug,
}: {
  kind: "subject" | "module" | "lecture";
  current: string;
  subject?: string;
  slug?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = {
    subject: {
      trigger: "Переименовать предмет",
      title: "Название предмета",
      description: "Папка в vault/Лекции и все wiki-ссылки обновятся.",
    },
    module: {
      trigger: "Переименовать модуль",
      title: "Название модуля",
      description: "Папка модуля и ссылки в заметках обновятся.",
    },
    lecture: {
      trigger: "Переименовать лекцию",
      title: "Название лекции",
      description: "Имя файла и ссылки из заданий обновятся.",
    },
  }[kind];

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (kind === "lecture") {
        const response = await fetch("/api/lectures", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, title: value }),
        });
        const data = (await response.json()) as { slug?: string; error?: string };
        if (!response.ok) throw new Error(data.error || "Не удалось переименовать");
        toast.success("Лекция переименована");
        setOpen(false);
        router.refresh();
        if (data.slug) router.push(lectureHref(data.slug));
        return;
      }
      const response = await fetch("/api/taxonomy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: kind,
          from: current,
          to: value,
          subject,
        }),
      });
      const data = (await response.json()) as {
        subject?: string;
        module?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Не удалось переименовать");
      toast.success("Название обновлено");
      setOpen(false);
      router.refresh();
      if (kind === "subject" && data.subject) {
        router.push(lectureHref(data.subject));
      }
      if (kind === "module" && data.subject && data.module) {
        router.push(lectureHref(`${data.subject}/${data.module}`));
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
        if (next) {
          setValue(current);
          setError(null);
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <Pencil data-icon="inline-start" />
        {labels.trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.trigger}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor={`rename-${kind}`}>{labels.title}</Label>
          <Input
            id={`rename-${kind}`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            disabled={saving || !value.trim() || value.trim() === current}
            onClick={save}
          >
            {saving ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : null}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
