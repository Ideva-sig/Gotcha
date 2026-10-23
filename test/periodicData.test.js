import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { packPath } from "../src/lib/contentPack.mjs";

// 周期表数据来自内容包 chemistry/periodic.json（源：course/chemistry/periodic.yml），需先 npm run build:content
const { elements, junior } = JSON.parse(fs.readFileSync(packPath("chemistry", "periodic.json"), "utf8"));

test("周期表有 118 个元素，原子序数 1..118 连续", () => {
  assert.equal(elements.length, 118);
  elements.forEach((e, i) => assert.equal(e.z, i + 1));
});

test("元素符号唯一，位置不重复，字段齐全", () => {
  assert.equal(new Set(elements.map((e) => e.symbol)).size, 118);
  assert.equal(new Set(elements.map((e) => `${e.row}-${e.col}`)).size, 118);
  for (const e of elements) {
    assert.ok(e.symbol && e.name && e.mass, `元素 ${e.z} 缺字段`);
    assert.equal(typeof e.calc, "string");
    assert.ok(e.row >= 1 && e.row <= 9 && e.col >= 1 && e.col <= 18);
  }
});

test("初中常用名单都在 1..118 内且无重复", () => {
  assert.equal(new Set(junior).size, junior.length);
  assert.ok(junior.every((z) => z >= 1 && z <= 118));
});
