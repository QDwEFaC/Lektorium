"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Code2, Home, ListChecks, Menu } from "lucide-react";
import { CaptureDialog } from "@/components/capture-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Курс", icon: Home },
  { href: "/lectures", label: "Предметы", icon: BookOpen },
  { href: "/assignments", label: "Задания", icon: ListChecks },
  { href: "/code", label: "Код", icon: Code2 },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-4 border-r bg-sidebar p-4 md:flex">
        <div>
          <p className="font-heading text-lg font-semibold tracking-tight">
            Лекторий
          </p>
          <p className="text-xs text-muted-foreground">
            Предмет → модуль → лекция
          </p>
        </div>
        <CaptureDialog />
        <Separator />
        <NavLinks />
        <div className="mt-auto space-y-2 text-xs leading-5 text-muted-foreground">
          <p>Obsidian: папка <span className="font-mono">vault/</span></p>
          <p>Zed: папка <span className="font-mono">code/</span></p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3 md:hidden">
          <p className="font-heading font-semibold">Лекторий</p>
          <div className="flex items-center gap-2">
            <CaptureDialog triggerLabel="URL" />
            <Sheet>
              <SheetTrigger render={<Button variant="outline" size="icon-sm" />}>
                <Menu />
                <span className="sr-only">Меню</span>
              </SheetTrigger>
              <SheetContent side="left" className="p-4">
                <SheetHeader>
                  <SheetTitle>Лекторий</SheetTitle>
                </SheetHeader>
                <NavLinks />
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
