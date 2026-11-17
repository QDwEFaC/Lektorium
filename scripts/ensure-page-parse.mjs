import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "src/lib/page-parse/impl.local");
const index = path.join(dir, "index.ts");
if (fs.existsSync(index)) process.exit(0);

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  index,
  `export {
  fetchAuthorizedImages,
  pageParseAvailable,
  parseFromHtmlBundle,
  parseFromUrl,
  wikiEmbedsFromImages,
} from "../stub";
`,
);
console.info("[lektorium] нет локального разбора страниц — подключена заглушка src/lib/page-parse/stub.ts");
