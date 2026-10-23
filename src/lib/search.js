// 站内搜索：没有分词库，直接做“包含”匹配。多个词用空格隔开，每个词都要出现。
// 索引文件 public/search-index.json 由 scripts/build-search-index.mjs 生成。

const norm = (text) => String(text).normalize("NFKC").toLowerCase();
// 显示用：NFKC 偶尔会改变字数（如 ㎏），那就退回只转小写，保证位置对得上
const sameLength = (text) => {
  const n = norm(text);
  return n.length === text.length ? n : text.toLowerCase();
};
const squash = (text) => norm(text).replace(/\s+/g, "");

export const TYPE_BOOST = { 知识点: 40, 公式: 30, 章: 25, 题目: 0 };
const WEIGHT_BOOST = { 重点: 8, 一般: 3, 了解: 0 };
const SNIPPET_BEFORE = 18;
const SNIPPET_AFTER = 56;

export function parseQuery(query) {
  return norm(query).split(/\s+/).filter(Boolean);
}

// 给每条文档预先算好“去空格的小写”文本，搜索时直接比
export function prepareDocs(docs) {
  return docs.map((doc) => ({
    ...doc,
    _t: squash(doc.t),
    _ts: squash(doc.t.replace(/^\d+-\d+[a-z]?\s+/, "")),
    _c: squash(doc.c || ""),
    _b: squash(doc.b || ""),
  }));
}

function scoreDoc(doc, terms) {
  let score = 0;
  for (const term of terms) {
    const flat = term.replace(/\s+/g, "");
    const inTitle = doc._ts.indexOf(flat);
    if (inTitle !== -1) {
      score += 100 + (inTitle === 0 ? 30 : 0) + (doc._ts === flat ? 40 : 0);
    } else if (doc._t.includes(flat)) {
      score += 100;
    } else if (doc._c.includes(flat)) {
      score += 45;
    } else if (doc._b.includes(flat)) {
      score += 10;
    } else {
      return 0;
    }
  }
  return score + (TYPE_BOOST[doc.k] ?? 0) + (WEIGHT_BOOST[doc.w] ?? 0);
}

// 取第一个出现在正文里的词，截一小段给人看
export function snippetFor(doc, terms) {
  const text = doc.b || "";
  if (!text) return "";
  const lower = sameLength(text);
  for (const term of terms) {
    const at = lower.indexOf(term);
    if (at !== -1) {
      const start = Math.max(0, at - SNIPPET_BEFORE);
      const end = Math.min(text.length, at + term.length + SNIPPET_AFTER);
      return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
    }
  }
  return text.slice(0, SNIPPET_BEFORE + SNIPPET_AFTER) + (text.length > SNIPPET_BEFORE + SNIPPET_AFTER ? "…" : "");
}

export function searchDocs(prepared, query, { subject = "all", limit = 80 } = {}) {
  const terms = parseQuery(query);
  if (!terms.length) return { terms, hits: [], counts: {} };
  const scored = [];
  for (const doc of prepared) {
    const score = scoreDoc(doc, terms);
    if (score > 0) scored.push({ doc, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const counts = { all: scored.length };
  for (const { doc } of scored) counts[doc.s] = (counts[doc.s] || 0) + 1;
  const filtered = subject === "all" ? scored : scored.filter(({ doc }) => doc.s === subject);
  const hits = filtered.slice(0, limit).map(({ doc }) => ({
    id: doc.u,
    kind: doc.k,
    subject: doc.s,
    title: doc.t,
    crumb: doc.c,
    url: doc.u,
    weight: doc.w || "",
    snippet: snippetFor(doc, terms),
  }));
  return { terms, hits, counts, total: filtered.length };
}

// 把命中的词切出来，页面里用 <mark> 标出
export function splitHighlight(text, terms) {
  if (!terms.length) return [{ text, hit: false }];
  const lower = sameLength(text);
  const marks = new Array(text.length).fill(false);
  for (const term of terms) {
    let from = 0;
    for (;;) {
      const at = lower.indexOf(term, from);
      if (at === -1) break;
      for (let i = at; i < at + term.length && i < marks.length; i += 1) marks[i] = true;
      from = at + term.length;
    }
  }
  const parts = [];
  for (let i = 0; i < text.length; i += 1) {
    const last = parts[parts.length - 1];
    if (last && last.hit === marks[i]) last.text += text[i];
    else parts.push({ text: text[i], hit: marks[i] });
  }
  return parts;
}
