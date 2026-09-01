import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  ATTACHMENTS_FOLDER,
  isAllowedImageExt,
  vaultFilePath,
} from "@/lib/paths";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: parts } = await context.params;
    if (!parts?.length) {
      return new NextResponse("Not found", { status: 404 });
    }
    const rel = parts.map((part) => decodeURIComponent(part)).join("/");
    const filePath = await resolveMediaFile(rel);
    if (!filePath) {
      return new NextResponse("Not found", { status: 404 });
    }
    const ext = path.extname(filePath).toLowerCase();
    const data = await readFile(/* turbopackIgnore: true */ filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

async function resolveMediaFile(rel: string): Promise<string | null> {
  const normalized = rel.replaceAll("\\", "/");
  const candidates = [normalized];
  const base = normalized.split("/").filter(Boolean).at(-1);
  if (base && !normalized.startsWith(`${ATTACHMENTS_FOLDER}/`)) {
    candidates.push(`${ATTACHMENTS_FOLDER}/${base}`);
  }
  for (const candidate of candidates) {
    try {
      const abs = vaultFilePath(candidate);
      if (!isAllowedImageExt(path.extname(abs))) continue;
      const info = await stat(abs);
      if (info.isFile()) return abs;
    } catch {
      continue;
    }
  }
  return null;
}
