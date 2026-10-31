// 微观示意图互动图对真题：2023 广州第 11 题（Q-CHEM-GZ2023-11），N2 + 3H2 → 2NH3。
// 答案 D：反应前后分子种类和数目改变（4 个分子 → 2 个分子）；B 错：N2、H2 按 1:3 反应。
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWidget } from '../src/lib/mathWidgets.js';
import { reactionSetup, reactionLayout, atomAt, parseFormula, subscript } from '../src/lib/reactionMicro.js';

// 和题目 yaml 里的 widget 写法一致（方程式有空格，要加双引号）
const config = parseWidget('type: reaction-micro\nequation: "N2 + 3H2 -> 2NH3"\ncondition: 催化剂\n');
const setup = reactionSetup(config);

test('2023 广州第 11 题 · 原子种类、个数不变：N 2 个、H 6 个', () => {
  assert.deepEqual(setup.atoms, { N: 2, H: 6 });
  assert.deepEqual(setup.reactants.map((s) => [s.formula, s.count]), [['N2', 1], ['H2', 3]]);
});

test('2023 广州第 11 题 · 分子数目改变：4 个 → 2 个（D 对）', () => {
  assert.equal(setup.moleculesBefore, 4);
  assert.equal(setup.moleculesAfter, 2);
});

test('方程式不配平就报错；化学式解析', () => {
  assert.throws(() => reactionSetup({ equation: 'N2 + H2 -> NH3' }));
  assert.throws(() => reactionSetup({ equation: 'N2 + 3H2 = 2NH3' }));
  assert.deepEqual(parseFormula('NH3'), ['N', 'H', 'H', 'H']);
  assert.equal(subscript('NH3'), 'NH₃');
});

test('每个原子从反应物走到生成物，任何时刻原子都不重叠到看不清（拆开时完全分开）', () => {
  const L = reactionLayout(setup);
  assert.equal(L.atoms.length, 8);
  for (const t of [0.2, 0.5, 0.8]) {
    const pts = L.atoms.map((a) => ({ ...atomAt(a, t), r: a.r }));
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      assert.ok(d > pts[i].r + pts[j].r, `t=${t} 第 ${i}、${j} 个原子重叠`);
    }
  }
  // 两个 N 原子来自同一个 N2，去了两个不同的 NH3
  const n = L.atoms.filter((a) => a.el === 'N');
  assert.equal(n[0].from, n[1].from);
  assert.notEqual(n[0].to, n[1].to);
  // t=0、t=1 停在原位
  for (const a of L.atoms) {
    assert.deepEqual(atomAt(a, 0), a.keys[0]);
    assert.deepEqual(atomAt(a, 1), a.keys[4]);
  }
});

// 2023 广东第 11 题（Q-CHEM-GD2023-11）：CH4 + 2O2 -> CO2 + 2H2O，分子个数 3 → 3（B 对），质量比 44:36 = 11:9（D 错）
test('2023 广东第 11 题 · 甲烷燃烧：分子个数不变 3 → 3，原子不重叠', () => {
  const s = reactionSetup(parseWidget('type: reaction-micro\nequation: "CH4 + 2O2 -> CO2 + 2H2O"\ncondition: 点燃\n'));
  assert.deepEqual(s.atoms, { C: 1, H: 4, O: 4 });
  assert.equal(s.moleculesBefore, 3);
  assert.equal(s.moleculesAfter, 3);
  const L = reactionLayout(s);
  for (const t of [0.2, 0.5, 0.8]) {
    const pts = L.atoms.map((a) => ({ ...atomAt(a, t), r: a.r }));
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      assert.ok(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) > pts[i].r + pts[j].r, `t=${t} 第 ${i}、${j} 个原子重叠`);
    }
  }
});
