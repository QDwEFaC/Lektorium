"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Layers, Loader2 } from "lucide-react";
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

export function CreateTaxonomyDialog({
  kind,
  subject,
  triggerVariant = "outline",
}: {
  kind: "subject" | "module";
  subject?: string;
  triggerVariant?: "default" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubject = kind === "subject";
  const triggerLabel = isSubject ? "Новый предмет" : "Новый модуль";
  const Icon = isSubject ? FolderPlus : Layers;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/taxonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: kind,
          title: value,
          subject,
        }),
      });
      const data = (await response.json()) as {
        subject?: string;
        module?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Не удалось создать");
      toast.success(isSubject ? "Предмет создан" : "Модуль создан");
      setOpen(false);
      setValue("");
      router.refresh();
      if (isSubject && data.subject) {
        router.push(lectureHref(data.subject));
      } else if (data.subject && data.module) {
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
        if (!next) {
          setValue("");
          setError(null);
        }
      }}
    >
      <DialogTrigger render={<Button variant={triggerVariant} />}>
        <Icon data-icon="inline-start" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
          <DialogDescription>
            {isSubject
              ? "Появится папка в vault/Лекции. Модули и лекции можно добавить следом, без URL."
              : `Модуль появится в предмете «${subject}». Лекцию можно вставить текстом.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor={`create-${kind}`}>Название</Label>
          <Input
            id={`create-${kind}`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={isSubject ? "Машинное обучение" : "Модуль 1. Введение"}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button disabled={saving || !value.trim()} onClick={save}>
            {saving ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : null}
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
