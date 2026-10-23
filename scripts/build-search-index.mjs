// 生成站内搜索索引 public/search-index.json（静态站，搜索在浏览器里做）。
// 只收已开放章节里学生看得到的文字：知识点正文、章标题、公式速查、题干。
// 不收答案、解析、来源说明、复核标记。
import fs from "node:fs";
import path from "node:path";
import { plainMathTitle } from "../src/lib/plainMathTitle.mjs";
import { packPath, SUBJECTS as SUBJECT_KEYS } from "../src/lib/contentPack.mjs";

const root = process.cwd();
// 搜索结果的科目顺序保持“数学、物理、化学”（影响索引顺序），名单本身来自 SUBJECTS
const LABELS = { math: "数学", physics: "物理", chemistry: "化学" };
const SEARCH_ORDER = ["math", "physics", "chemistry"];
const rank = (key) => (SEARCH_ORDER.includes(key) ? SEARCH_ORDER.indexOf(key) : SEARCH_ORDER.length);
const SUBJECTS = [...SUBJECT_KEYS].sort((a, b) => rank(a) - rank(b))
  .map((key) => ({ key, label: LABELS[key] || key, base: `/${key}` }));
const STEM_LIMIT = 220;

// Markdown / LaTeX → 纯文字，只用来搜索和显示摘要
const SYMBOLS = {
  quad: " ", qquad: " ", left: "", right: "", Longleftrightarrow: "⇔", Leftrightarrow: "⇔", Rightarrow: "⇒", Longrightarrow: "⇒",
  rightarrow: "→", to: "→", leftarrow: "←", leftrightarrow: "↔", rightleftharpoons: "⇌", uparrow: "↑", downarrow: "↓",
  rho: "ρ", omega: "ω", Omega: "Ω", lambda: "λ", mu: "μ", eta: "η", sigma: "σ", phi: "φ", gamma: "γ", delta: "δ", varepsilon: "ε", epsilon: "ε",
  approx: "≈", pm: "±", div: "÷", sqrt: "√", cdots: "…", ldots: "…", dots: "…", angle: "∠", triangle: "△", parallel: "∥", perp: "⊥",
  cong: "≅", propto: "∝", because: "∵", therefore: "∴", neq: "≠", le: "≤", ge: "≥", Longleftarrow: "⇐", underline: "", overline: "",
  bar: "", hat: "", vec: "", boxed: "", displaystyle: "", small: "", large: "", cancel: "", xrightarrow: "→", xlongequal: "=",
};
// plainMathTitle 自己会处理的命令，其余不认识的一律去掉，免得变成英文单词留在搜索文字里
const HANDLED = new Set(["frac", "dfrac", "tfrac", "text", "mathrm", "operatorname", "pi", "theta", "alpha", "beta", "Delta", "times", "cdot", "leq", "geq", "ne", "infty"]);

export function plainText(source) {
  // 化学式 \ce{H2O} 去掉 \ce，度数 ^\circ 写成 °，再交给公共的公式转文字
  // 数学互动小件（```cards 之类）是给程序读的，不收；只留破题钥匙（think）
  const cleaned = String(source)
    .replace(/```(?!think)[A-Za-z-]*\n[\s\S]*?```/g, " ")
    .replace(/\\(?:text)?color\{[^{}]*\}/g, "")
    .replace(/\\(?:begin|end)\{[^{}]*\}/g, " ")
    .replace(/\\(?:ce|mathrm|text|textbf|mathbf|operatorname)/g, "").replace(/\\sim/g, "~").replace(/\\%/g, "%").replace(/\\[,;:! ]|\\\\/g, " ").replace(/\^\{?\\circ\}?/g, "°").replace(/\\circ/g, "°")
    .replace(/\\([a-zA-Z]+)/g, (m, name) => (name in SYMBOLS ? SYMBOLS[name] : HANDLED.has(name) ? m : ""));
  return plainMathTitle(cleaned)
    .replace(/```[a-z]*\n?/g, "")
    .replace(/^\s*(图|招)\s*[:：].*$/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s*\|?[\s:|-]{3,}\|?\s*$/gm, " ")
    .replace(/\|/g, " ")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*(?:[-*>]|\d+\.)\s+/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\\[a-zA-Z]*/g, "")
    .replace(/[dt]?frac/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mdText(items = []) {
  return items.filter((x) => x.type === "md").map((x) => plainText(x.text)).filter(Boolean).join(" ");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(packPath(file), "utf8"));
}

function chapterShort(title) {
  return title.replace(/^第.+?(章|单元)\s*/, "");
}

function shortCode(id) {
  const parts = id.split("-");
  return `${Number(parts[parts.length - 2])}-${parts[parts.length - 1]}`;
}

function formulaDocs(subject) {
  const file = packPath(subject.key, "formulas.md"); // 内容包里的公式速查（由 export-course-json.py 从 course/<科目>/formulas.md 复制）
  if (!fs.existsSync(file)) return [];
  const [, ...sections] = fs.readFileSync(file, "utf8").split(/^## /m);
  const docs = [];
  for (const section of sections) {
    const [head, ...entries] = section.split(/^### /m);
    const sectionTitle = head.split("\n")[0].replace(/^[一二三四五六七八九十]+、\s*/, "").trim();
    for (const entry of entries) {
      const nl = entry.indexOf("\n");
      const title = (nl === -1 ? entry : entry.slice(0, nl)).trim();
      const num = title.match(/^(\d+)\./)?.[1];
      if (!num) continue;
      docs.push({
        k: "公式",
        s: subject.key,
        t: title.replace(/^\d+\.\s*/, ""),
        c: `公式速查 · ${sectionTitle}`,
        u: `${subject.base}/formulas/#formula-${num}`,
        b: plainText(nl === -1 ? "" : entry.slice(nl + 1)),
      });
    }
  }
  return docs;
}

export function buildSearchIndex() {
  const docs = [];
  for (const subject of SUBJECTS) {
    const index = readJson(`${subject.key}/index.json`);
    for (const ch of index.chapters) {
      if (!ch.available) continue;
      const data = readJson(`${subject.key}/chapters/${ch.id}.json`);
      docs.push({
        k: "章",
        s: subject.key,
        t: ch.title,
        c: ch.book,
        u: `${subject.base}/chapter/${ch.id}/`,
        b: plainText(data.intro || ""),
      });
      for (const kp of data.kps || []) {
        const meta = index.kps[kp.id] || {};
        const body = (kp.blocks || [])
          .filter((b) => b.heading !== "练一练")
          .map((b) => mdText(b.body))
          .filter(Boolean)
          .join(" ");
        docs.push({
          k: "知识点",
          s: subject.key,
          t: `${shortCode(kp.id)} ${plainMathTitle(kp.title)}`,
          c: `${chapterShort(data.title)}${meta.section_title ? ` · ${plainMathTitle(meta.section_title)}` : ""}`,
          u: `${subject.base}/kp/${kp.id}/`,
          w: kp.weight || "",
          b: body,
        });
      }
      for (const q of Object.values(data.questions || {})) {
        const stem = mdText(q.stem);
        if (!stem || !q.kp) continue;
        docs.push({
          k: "题目",
          s: subject.key,
          t: q.source || "练习题",
          c: `${chapterShort(data.title)} · ${plainMathTitle(index.kps[q.kp]?.title || "")}`,
          u: `${subject.base}/kp/${q.kp}/#practice`,
          b: stem.slice(0, STEM_LIMIT),
        });
      }
    }
    docs.push(...formulaDocs(subject));
  }
  return docs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const docs = buildSearchIndex();
  const out = path.join(root, "public/search-index.json");
  fs.writeFileSync(out, JSON.stringify(docs));
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  const counts = docs.reduce((m, d) => ((m[d.k] = (m[d.k] || 0) + 1), m), {});
  console.log(`search-index.json: ${docs.length} 条，${kb} KB`, counts);
}
