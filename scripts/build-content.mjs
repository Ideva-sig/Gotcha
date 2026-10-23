// 导出所有科目的内容包：对 SUBJECTS 里每个科目运行 export-course-json.py，任何一科失败就以非零退出。
// 之后的同步（syncCourseAssets）和搜索索引由 npm 脚本 build:content 接着跑。
import { spawnSync } from "node:child_process";
import { SUBJECTS, REPO_ROOT } from "../src/lib/contentPack.mjs";
import path from "node:path";

// 找一个装了 PyYAML 的 Python：环境变量 PYTHON 优先，其次本机系统 Python，最后 PATH 里的 python3
// （云端构建机的系统 Python 没有 PyYAML，pip 装进的是 PATH 里的 python3）。
const candidates = [process.env.PYTHON, "/usr/bin/python3", "python3"].filter(Boolean);
const PYTHON =
  candidates.find((c) => spawnSync(c, ["-c", "import yaml"], { stdio: "ignore" }).status === 0) ??
  candidates[0];

for (const subject of SUBJECTS) {
  const r = spawnSync(PYTHON, [path.join(REPO_ROOT, "scripts/export-course-json.py"), subject], {
    stdio: "inherit",
    cwd: REPO_ROOT,
  });
  if (r.error) {
    console.error(`无法运行 ${PYTHON}：${r.error.message}`);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(`导出 ${subject} 失败（退出码 ${r.status}）`);
    process.exit(r.status || 1);
  }
}
