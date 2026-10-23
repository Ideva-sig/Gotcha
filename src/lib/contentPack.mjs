// 内容包路径的唯一出处（Node 脚本、Next 配置、服务端渲染共用）。
// 环境变量 CONTENT_PACK_DIR 指向内容包根目录（里面是 physics/ math/ chemistry/ 三个子目录）；
// 相对路径按仓库根解析，默认 output/app-data。
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const CONTENT_PACK_DIR = path.resolve(
  REPO_ROOT,
  process.env.CONTENT_PACK_DIR || "output/app-data",
);

export function packPath(...parts) {
  return path.join(CONTENT_PACK_DIR, ...parts);
}

// 科目集合的唯一来源：脚本（导出、同步、搜索索引、检查）都从这里取。
export const SUBJECTS = ["physics", "math", "chemistry"];
