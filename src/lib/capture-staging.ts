import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { attachmentsDir } from "@/lib/paths";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCaptureId(value: string) {
  return UUID.test(value);
}

export function captureDir(captureId: string) {
  if (!isCaptureId(captureId)) throw new Error("Некорректный захват страницы");
  return path.join(os.tmpdir(), "lektorium-captures", captureId);
}

export function captureImagesDir(captureId: string) {
  return path.join(captureDir(captureId), "images");
}

export async function stageCaptureImages(
  files: { name: string; bytes: Buffer }[],
) {
  await pruneOldCaptures();
  const captureId = randomUUID();
  const dir = captureImagesDir(captureId);
  await fs.mkdir(dir, { recursive: true });
  const names: string[] = [];
  const used = new Set<string>();
  for (const file of files) {
    let name = path.basename(file.name);
    if (!name || used.has(name)) {
      const ext = path.extname(name) || ".png";
      const stem = path.basename(name, ext) || "image";
      let index = 1;
      do {
        name = `${stem}-${index}${ext}`;
        index += 1;
      } while (used.has(name));
    }
    used.add(name);
    await fs.writeFile(path.join(dir, name), file.bytes);
    names.push(name);
  }
  return { captureId, names };
}

export async function importCaptureImages(slug: string, captureId: string) {
  const from = captureImagesDir(captureId);
  const to = attachmentsDir(slug);
  await fs.mkdir(to, { recursive: true });
  let names: string[] = [];
  try {
    names = await fs.readdir(from);
  } catch {
    return [];
  }
  const copied: string[] = [];
  for (const name of names) {
    if (name.startsWith(".")) continue;
    await fs.copyFile(path.join(from, name), path.join(to, name));
    copied.push(name);
  }
  await fs.rm(captureDir(captureId), { recursive: true, force: true });
  return copied;
}

export async function pruneOldCaptures(maxAgeMs = 2 * 60 * 60 * 1000) {
  const root = path.join(os.tmpdir(), "lektorium-captures");
  let entries: { name: string; isDirectory(): boolean }[] = [];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return;
  }
  const now = Date.now();
  for (const entry of entries) {
    if (!entry.isDirectory() || !isCaptureId(entry.name)) continue;
    const dir = path.join(root, entry.name);
    try {
      const info = await fs.stat(dir);
      if (now - info.mtimeMs > maxAgeMs) {
        await fs.rm(dir, { recursive: true, force: true });
      }
    } catch {
      continue;
    }
  }
}
