import { CONTENT_PACK_DIR, REPO_ROOT } from "./src/lib/contentPack.mjs";
import path from "node:path";

// Turbopack 的别名写相对仓库根的路径（"./…"）；内容包在仓库外时退回绝对路径。
const rel = path.relative(REPO_ROOT, CONTENT_PACK_DIR);
const packAlias = rel && !rel.startsWith("..") ? `./${rel}` : CONTENT_PACK_DIR;

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  distDir: process.env.SAMPLE_BUILD === "1" ? ".next-sample" : process.env.IPAD_RELEASE_BUILD === "1" ? ".next-ipad-local" : ".next",
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // 内容包：前端用 @content-pack/… 引用，实际指向 CONTENT_PACK_DIR（默认 output/app-data）
  turbopack: {
    resolveAlias: { "@content-pack": packAlias },
  },
  webpack(config) {
    config.resolve.alias["@content-pack"] = CONTENT_PACK_DIR;
    return config;
  },
};

export default nextConfig;
