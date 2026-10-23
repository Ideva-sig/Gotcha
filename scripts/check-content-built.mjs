// 前端构建 / 开发前的检查：内容包（讲义 JSON、搜索索引）必须已经生成。
// 内容包由 `npm run build:content` 生成，前端不再自动重跑。
import fs from "node:fs";
import path from "node:path";
import { CONTENT_PACK_DIR, packPath, SUBJECTS } from "../src/lib/contentPack.mjs";

const need = [
  ...SUBJECTS.map((s) => `public/app-data/${s}/index.json`),
  "public/search-index.json",
];
const packMissing = SUBJECTS.map((s) => packPath(s, "index.json")).filter((f) => !fs.existsSync(f));
const missing = need.filter((f) => !fs.existsSync(path.join(process.cwd(), f)));
if (packMissing.length) {
  console.error(`内容包目录不对或还没生成（CONTENT_PACK_DIR=${CONTENT_PACK_DIR}），缺：\n  ${packMissing.join("\n  ")}\n请检查环境变量 CONTENT_PACK_DIR，或先运行：npm run build:content`);
  process.exit(1);
}
if (missing.length) {
  console.error(`内容包还没生成，缺：\n  ${missing.join("\n  ")}\n请先运行：npm run build:content`);
  process.exit(1);
}
