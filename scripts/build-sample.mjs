// 用 sample-course/ 构建一个“样例站”（每科 1 章），给没有完整 course/ 的人看效果。
// 隔离方式：样例内容包写到 output/sample-pack，站点输出到 out-sample/，
// 构建期间会临时把 public/app-data 和 public/search-index.json 挪到 .build/sample-backup/，
// 结束（无论成败）后原样放回，不影响完整版的开发环境。
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../src/lib/contentPack.mjs";

const backup = path.join(REPO_ROOT, ".build/sample-backup");
const targets = ["public/app-data", "public/search-index.json"];
const env = { ...process.env, COURSE_DIR: "sample-course", CONTENT_PACK_DIR: "output/sample-pack", SAMPLE_BUILD: "1" };

if (fs.existsSync(backup)) {
  console.error(`发现上次中断留下的备份：${backup}\n里面是完整版的 public/app-data 等。请先手动放回 public/ 下，再删除这个目录，然后重试。`);
  process.exit(1);
}
function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: REPO_ROOT, env });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} 失败（退出码 ${r.status}）`);
}

fs.mkdirSync(backup, { recursive: true });
for (const t of targets) {
  const src = path.join(REPO_ROOT, t);
  if (fs.existsSync(src)) fs.renameSync(src, path.join(backup, path.basename(t)));
}
console.log("提示：构建期间 public/app-data 会被样例内容临时替换，结束后自动还原。");
let code = 0;
try {
  run("node", ["scripts/build-content.mjs"]);
  run("node", ["src/lib/syncCourseAssets.mjs"]);
  run("node", ["scripts/build-search-index.mjs"]);
  run("node", ["scripts/check-content-built.mjs"]);
  run("npx", ["next", "build"]);
  // distDir 设为 .next-sample 时，静态导出直接写在里面；改名为 out-sample，免得和完整版的 out/ 混淆
  const outDir = path.join(REPO_ROOT, "out-sample");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.renameSync(path.join(REPO_ROOT, ".next-sample"), outDir);
  console.log("样例站输出目录：out-sample/（用任意静态服务器打开，例如 npx serve out-sample）");
} catch (e) {
  console.error(String(e.message || e));
  code = 1;
} finally {
  for (const t of targets) {
    const dst = path.join(REPO_ROOT, t);
    fs.rmSync(dst, { recursive: true, force: true });
    const b = path.join(backup, path.basename(t));
    if (fs.existsSync(b)) fs.renameSync(b, dst);
  }
  fs.rmSync(backup, { recursive: true, force: true });
}
process.exit(code);
