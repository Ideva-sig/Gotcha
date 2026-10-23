import test from "node:test";
import assert from "node:assert/strict";
import { THINK_MOVES, THINK_MOVES_CHEM } from "../src/lib/thinkMoves.js";

test("化学卡片可用 证据、类别预测，原有六招不删", () => {
  for (const m of ["理想化", "控制变量", "转换", "等效", "画图", "守恒", "证据", "类别预测"]) {
    assert.ok(THINK_MOVES_CHEM.includes(m), m);
  }
});

test("物理卡片不可用 证据、类别预测", () => {
  assert.deepEqual(THINK_MOVES, ["理想化", "控制变量", "转换", "等效", "画图", "守恒"]);
});
