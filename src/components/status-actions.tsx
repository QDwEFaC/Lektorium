"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ASSIGNMENT_STATUSES,
  STATUS_LABEL,
  type AssignmentStatus,
} from "@/lib/types";

export function StatusActions({
  slug,
  status,
}: {
  slug: string;
  status: AssignmentStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setStatus(next: AssignmentStatus) {
    setPending(true);
    try {
      const response = await fetch(
        `/api/assignments/${encodeURIComponent(slug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Не удалось обновить статус");
      }
      toast.success(`Статус: ${STATUS_LABEL[next]}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ASSIGNMENT_STATUSES.map((item) => (
        <Button
          key={item}
          size="sm"
          variant={item === status ? "default" : "outline"}
          disabled={pending || item === status}
          onClick={() => setStatus(item)}
        >
          {STATUS_LABEL[item]}
        </Button>
      ))}
    </div>
  );
}
