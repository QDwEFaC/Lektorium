"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-3 py-16">
      <h1 className="font-heading text-2xl font-semibold">Что-то сломалось</h1>
      <p className="text-sm text-muted-foreground">
        {error.message || "Не удалось открыть страницу."}
      </p>
      <Button onClick={reset}>Попробовать снова</Button>
    </div>
  );
}
