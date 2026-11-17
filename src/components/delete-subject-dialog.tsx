"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
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

function countLabel(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} ${few}`;
  }
  return `${count} ${many}`;
}

export function DeleteSubjectDialog({
  subject,
  moduleCount,
  lectureCount,
  compact = false,
  afterHref = "/",
}: {
  subject: string;
  moduleCount: number;
  lectureCount: number;
  compact?: boolean;
  afterHref?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/taxonomy", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subject", subject }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Не удалось удалить");
      toast.success(`Предмет «${subject}» удалён`);
      setOpen(false);
      router.refresh();
      router.push(afterHref);
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
        if (!next) setError(null);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            size={compact ? "xs" : "default"}
          />
        }
      >
        <Trash2 data-icon="inline-start" />
        {compact ? "Удалить" : "Удалить предмет"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Удалить предмет «{subject}»?</DialogTitle>
          <DialogDescription>
            Из vault пропадут{" "}
            {countLabel(moduleCount, "модуль", "модуля", "модулей")} и{" "}
            {countLabel(lectureCount, "лекция", "лекции", "лекций")}. Задания и
            папки кода останутся, но ссылка на лекцию в них снимется.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button variant="destructive" disabled={saving} onClick={remove}>
            {saving ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Trash2 data-icon="inline-start" />
            )}
            Удалить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
