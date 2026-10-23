import fs from 'node:fs';
import path from 'node:path';
import { packPath, CONTENT_PACK_DIR, SUBJECTS } from './contentPack.mjs';

// Only the supported course subjects; v1 assets are untouched.
for (const subject of SUBJECTS) {
  const source = packPath(subject);
  const target = path.join(process.cwd(), 'public/app-data', subject);
  if (!fs.existsSync(path.join(source, 'index.json'))) {
    throw new Error(`Missing course export: ${source}（内容包目录 CONTENT_PACK_DIR=${CONTENT_PACK_DIR}，请先运行 npm run build:content 或检查该变量）`);
  }
  // 先清空再复制：已下线或改名的章、图不会残留在公开目录里
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  // formulas.md、periodic.json 只在构建时由服务端读取，不需要公开
  const buildOnly = new Set(['formulas.md', 'periodic.json']);
  fs.cpSync(source, target, { recursive: true, filter: (src) => !buildOnly.has(path.basename(src)) });
}
