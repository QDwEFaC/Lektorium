import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Лекторий",
  description:
    "Сохраняй лекции из URL в Obsidian и связывай их с заданиями и кодом в Zed.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${manrope.variable} ${plexMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AppShell>{children}</AppShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
