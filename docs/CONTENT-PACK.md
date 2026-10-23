# 内容包（Content Pack）

网站前端（`src/`）不写死任何讲义内容，只读一个“内容包”。内容包就是 `npm run build:content` 导出的那一套 JSON 和图片。换一个内容包，就换了一套内容，前端代码不用改。

## 目录结构

默认位置 `output/app-data/`（由环境变量 `CONTENT_PACK_DIR` 指定，见下）：

```
<内容包根>/
  physics/  math/  chemistry/        三个科目，各一份，结构相同
    index.json                       章节与知识点目录（必须）
    chapters/<章编号>.json           每章讲义、题目、答案（index.json 里标为开放的章必须有）
    figures/<章编号>/*              章里引用的示意图、题图（讲义里用到的都要在）
    formulas.md                      公式速查（构建时读取，不对外公开）
  chemistry/periodic.json            元素周期表数据（仅化学；构建时读取，不对外公开）
```

`index.json` 里还带 `fun_lines`（角色台词）和 `thinking_intro`（“思维提升”页开头说明，源文件 `course/<科目>/thinking-intro.yml`）。公式速查 `formulas.md`、周期表数据 `chemistry/periodic.json`（源文件 `course/chemistry/periodic.yml`）与 thinking-intro 都属于内容包，前端只从内容包读。

另外，站内搜索索引 `public/search-index.json`（必须）由 `node scripts/build-search-index.mjs` 根据内容包生成，属于构建产物，不在内容包目录里。
三个科目的名单只在 `src/lib/contentPack.mjs` 的 `SUBJECTS` 定义（导出、同步、搜索索引、检查都从那里取）；`src/lib/courseV3Client.js` 的静态 import 因打包需要仍逐科写出，加科目时两处都要改。

头像、课本原图等放在 `public/` 下，目前还没有进内容包（见文末“残留耦合”）。

## 指向自己的内容包

用环境变量 `CONTENT_PACK_DIR`，相对路径按仓库根算，也可以写绝对路径，可以放在仓库外：

```bash
CONTENT_PACK_DIR=/path/to/my-pack npm run build:site
```

整个仓库只在 `src/lib/contentPack.mjs` 一处读这个变量；`next.config.mjs` 用它给前端设置别名 `@content-pack`，所有脚本和测试也都从那里取路径。目录不对时，`npm run build:site` 会在检查阶段直接报“内容包目录不对”，并列出缺的文件。

## 由 `course/` 生成

`course/<科目>/` 是内容源（Markdown + YAML），格式见 `course/FORMAT.md`。

```bash
npm run build:content   # 导出 JSON 和图到内容包，复制到 public/app-data，再生成搜索索引
npm run build:site      # 检查内容包已生成，再 next build（静态导出到 out/）
npm run build           # 上面两步连着跑
```

`build:content` 也认 `CONTENT_PACK_DIR`：导出脚本会写到那个目录。注意：`syncCourseAssets` 会把内容包复制到 `public/app-data/<科目>/`（先清空再复制），页面里的图片链接指向这里。

## 样例内容包（没有完整 `course/` 时）

`sample-course/` 是一份最小内容源：每科 1 章（物理 `g9-13-internal-energy`、数学 `g9a-29-circle`、化学 `g9a-03-matter-structure`），加上科目级文件（`kp-map.yml`、`textbook-sections.md`、`formulas.md`、`fun-lines.yml`、`thinking-intro.yml`；化学另有 `periodic.yml`）。导出脚本认环境变量 `COURSE_DIR`（默认 `course`，相对路径按仓库根算）。

```bash
npm run build:sample
```

它用 `COURSE_DIR=sample-course CONTENT_PACK_DIR=output/sample-pack` 导出，再同步、建索引、`next build`，结果在 `out-sample/`（约 66 个页面，用任意静态服务器打开）。构建期间 `public/app-data` 和 `public/search-index.json` 会被临时挪到 `.build/sample-backup/`，结束后自动还原（成败都还原），完整版的 `out/`、`.next/`、`output/app-data/` 不受影响；若上次中断留下备份，脚本会先报错让你手动放回。

样例站里只有这 3 章开放，其余章在目录里显示为未开放。题图的来源标注与完整版相同；不含课本整页扫描（original-pages）。

## 当前还没进内容包的内容

- 公式速查页的分区目录（`src/app/*/formulas/page.js` 里的 `SECTION_LINKS`）
