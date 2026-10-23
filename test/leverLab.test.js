import assert from 'node:assert/strict';
import test from 'node:test';
import { NUT_BAL, NUT_START, NUT_MIN, NUT_MAX, HOOK_N, SCALE_MAX, barTorque, tiltOf, evaluate, tiltDir, recordRow, addRecord, taskStatus, roundScale, initialState, arm } from '../src/lib/leverLab.js';

const close = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);
const st = (nut, left, right) => ({ nut, left, right: { mode: 'hooks', theta: 0, ...right } });

test('平衡螺母：开始左端重，调到位后水平', () => {
  assert.ok(NUT_START >= NUT_MIN && NUT_START < NUT_BAL && NUT_BAL <= NUT_MAX);
  const s = initialState();
  const ev = evaluate(s);
  assert.equal(tiltDir(ev), 'left');
  assert.ok(ev.angle < 0 && !ev.balanced);
  // 向右一档一档调
  let last = ev.tau;
  for (let n = NUT_START + 1; n <= NUT_BAL; n++) {
    const e = evaluate({ ...s, nut: n });
    assert.ok(e.tau > last);
    last = e.tau;
  }
  const lv = evaluate({ ...s, nut: NUT_BAL });
  assert.equal(lv.balanced, true);
  assert.equal(lv.angle, 0);
  assert.equal(barTorque(NUT_BAL), 0);
  // 调过头：右端重
  assert.equal(tiltDir(evaluate({ ...s, nut: NUT_BAL + 1 })), 'right');
});

test('两侧挂钩码：F₁l₁ = F₂l₂ 时平衡', () => {
  // 左 2 个钩码挂 3 格，右 3 个挂 2 格：1 N × 0.15 m = 1.5 N × 0.1 m
  const ev = evaluate(st(NUT_BAL, { hole: 3, n: 2 }, { hole: 2, n: 3 }));
  close(ev.F2, 1); close(ev.l2, 0.15); close(ev.F1, 1.5); close(ev.l1, 0.1);
  assert.equal(ev.balanced, true);
  const row = recordRow(st(NUT_BAL, { hole: 3, n: 2 }, { hole: 2, n: 3 }));
  assert.equal(row.kind, 'hooks');
  close(row.F1 * row.l1, row.F2 * row.l2);
  // 平衡的状态很多：6 个钩码×1格 对 3 个钩码×2格
  assert.equal(evaluate(st(NUT_BAL, { hole: 2, n: 3 }, { hole: 1, n: 5 })).balanced, false);
  assert.equal(evaluate(st(NUT_BAL, { hole: 2, n: 4 }, { hole: 4, n: 2 })).balanced, true);
});

test('不平衡：乘积大的一端下沉，差得越多倾斜越大，到限位为止', () => {
  const r = evaluate(st(NUT_BAL, { hole: 2, n: 1 }, { hole: 3, n: 1 }));
  assert.equal(tiltDir(r), 'right');
  assert.ok(r.angle > 0 && !r.balanced);
  const l = evaluate(st(NUT_BAL, { hole: 4, n: 2 }, { hole: 1, n: 1 }));
  assert.equal(tiltDir(l), 'left');
  assert.ok(l.angle < 0);
  const big = evaluate(st(NUT_BAL, { hole: 8, n: 5 }, { hole: 1, n: 0 }));
  assert.equal(big.angle, -10);
  assert.equal(tiltOf(0), 0);
  assert.ok(Math.abs(tiltOf(0.025)) < 10);
  // 螺母没调平时不记录，即使钩码把杠杆配平了也不行
  assert.equal(recordRow(st(NUT_START, { hole: 4, n: 2 }, { hole: 4, n: 2 })), null);
  // 空载不记录
  assert.equal(recordRow(st(NUT_BAL, { hole: 4, n: 0 }, { hole: 4, n: 0 })), null);
});

test('测力计竖直拉：示数 = 阻力×阻力臂 ÷ 动力臂，按 0.1 N 取整', () => {
  const s = { nut: NUT_BAL, left: { hole: 4, n: 2 }, right: { hole: 2, n: 0, mode: 'scale', theta: 0 } };
  const ev = evaluate(s);
  assert.equal(ev.reading, 2); // 1 N × 0.2 m ÷ 0.1 m
  assert.equal(ev.balanced, true);
  close(ev.l1, 0.1);
  const row = recordRow(s);
  assert.equal(row.kind, 'scale');
  assert.equal(row.F1, 2);
  // 取整：1 N × 0.15 ÷ 0.2 m = 0.75 N → 0.8 N
  const odd = evaluate({ nut: NUT_BAL, left: { hole: 3, n: 2 }, right: { hole: 4, n: 0, mode: 'scale', theta: 0 } });
  assert.equal(odd.reading, 0.8);
  assert.equal(roundScale(0.349), 0.3);
  assert.equal(roundScale(2.3094), 2.3);
});

test('测力计斜拉：力臂变短，示数变大（1/cosθ）', () => {
  const mk = (theta) => ({ nut: NUT_BAL, left: { hole: 4, n: 2 }, right: { hole: 2, n: 0, mode: 'scale', theta } });
  const v = evaluate(mk(0));
  const a30 = evaluate(mk(30));
  const a60 = evaluate(mk(60));
  close(a60.l1, 0.05); // 0.1 m × cos60°
  assert.ok(a30.l1 < v.l1 && a60.l1 < a30.l1);
  assert.equal(a30.reading, 2.3);
  assert.equal(a60.reading, 4);
  assert.ok(a30.reading > v.reading && a60.reading > a30.reading);
  assert.ok(a60.balanced && a30.balanced);
  // 斜拉也满足 F₁l₁ = F₂l₂（取整误差内）
  assert.ok(Math.abs(a30.F1 * a30.l1 - a30.F2 * a30.l2) < 0.05 * a30.l1 + 1e-9);
});

test('测力计超量程或不用拉的情况', () => {
  const over = evaluate({ nut: NUT_BAL, left: { hole: 8, n: 5 }, right: { hole: 1, n: 0, mode: 'scale', theta: 0 } });
  assert.equal(over.over, true);
  assert.equal(over.reading, SCALE_MAX);
  assert.equal(tiltDir(over), 'left');
  assert.equal(recordRow({ nut: NUT_BAL, left: { hole: 8, n: 5 }, right: { hole: 1, n: 0, mode: 'scale', theta: 0 } }), null);
  // 左边没挂东西：不用拉，水平，示数 0，不记录
  const none = evaluate({ nut: NUT_BAL, left: { hole: 4, n: 0 }, right: { hole: 3, n: 0, mode: 'scale', theta: 0 } });
  assert.equal(none.reading, 0);
  assert.equal(none.noPull, true);
  assert.equal(none.balanced, true);
  // 螺母调偏时，右端重，不拉也往右倾
  const heavy = evaluate({ nut: NUT_BAL + 1, left: { hole: 4, n: 0 }, right: { hole: 3, n: 0, mode: 'scale', theta: 0 } });
  assert.equal(tiltDir(heavy), 'right');
});

test('记录与任务', () => {
  let rows = [];
  const hooks = (ln, lh, rn, rh) => recordRow(st(NUT_BAL, { hole: lh, n: ln }, { hole: rh, n: rn }));
  rows = addRecord(rows, hooks(2, 3, 3, 2));
  rows = addRecord(rows, hooks(2, 3, 3, 2)); // 重复不记
  assert.equal(rows.length, 1);
  assert.equal(taskStatus(rows, true).hooks, true);
  assert.equal(taskStatus(rows, true).three, false);
  rows = addRecord(rows, hooks(2, 4, 4, 2));
  rows = addRecord(rows, hooks(1, 4, 2, 2));
  assert.equal(taskStatus(rows, true).three, true);
  assert.equal(taskStatus(rows, false).nut, false);
  const mk = (theta) => recordRow({ nut: NUT_BAL, left: { hole: 4, n: 2 }, right: { hole: 2, n: 0, mode: 'scale', theta } });
  rows = addRecord(rows, mk(60));
  assert.equal(taskStatus(rows, true).oblique, false); // 还没竖直拉过
  rows = addRecord(rows, mk(0));
  assert.equal(taskStatus(rows, true).scale, true);
  assert.equal(taskStatus(rows, true).oblique, true);
  assert.equal(arm(8), 0.4);
  assert.equal(HOOK_N, 0.5);
});
