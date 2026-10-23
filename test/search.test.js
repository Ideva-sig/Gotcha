import assert from "node:assert/strict";
import test from "node:test";
import { prepareDocs, searchDocs, splitHighlight } from "../src/lib/search.js";

const docs = prepareDocs([
  { k: "知识点", s: "physics", t: "6-2 密度的计算", c: "质量与密度 · 密度", u: "/physics/kp/A/", w: "重点", b: "密度等于质量除以体积，单位是 kg/m³。" },
  { k: "题目", s: "physics", t: "2023 年广东第 5 题", c: "质量与密度", u: "/physics/kp/A/#practice", b: "一瓶水的密度是多少？" },
  { k: "知识点", s: "math", t: "3-1 二次函数的图象", c: "二次函数", u: "/math/kp/B/", w: "一般", b: "抛物线的开口方向由 a 决定。" },
]);

test("标题命中排在正文命中前面", () => {
  const { hits } = searchDocs(docs, "密度");
  assert.equal(hits[0].title, "6-2 密度的计算");
  assert.equal(hits.length, 2);
});

test("多个词要同时出现，空格和全角字符不影响", () => {
  assert.equal(searchDocs(docs, "密度 体积").hits.length, 1);
  assert.equal(searchDocs(docs, "ＫＧ/m³").hits.length, 1);
  assert.equal(searchDocs(docs, "密度 抛物线").hits.length, 0);
});

test("按科目筛选，数量不受筛选影响", () => {
  const r = searchDocs(docs, "密度", { subject: "math" });
  assert.equal(r.hits.length, 0);
  assert.equal(r.counts.physics, 2);
});

test("没有关键词时没有结果", () => {
  assert.deepEqual(searchDocs(docs, "  ").hits, []);
});

test("高亮把命中的词切出来", () => {
  const parts = splitHighlight("水的密度", ["密度"]);
  assert.deepEqual(parts, [{ text: "水的", hit: false }, { text: "密度", hit: true }]);
});
