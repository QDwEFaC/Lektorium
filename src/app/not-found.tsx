import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="space-y-3 py-16">
      <h1 className="font-heading text-2xl font-semibold">Нет такой заметки</h1>
      <p className="text-muted-foreground">
        Файл не найден в vault. Возможно, его переименовали в Obsidian.
      </p>
      <Button render={<Link href="/" />}>На главную</Button>
    </div>
  );
}
