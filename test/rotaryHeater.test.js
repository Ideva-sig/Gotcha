// 旋转开关电热器互动图对真题：2024 广州第 15 题（Q-PHY-GZ2024-15）。
// 题给：U=220 V，R1=R2=1100 Ω，高温挡总电流 0.25 A，bc 时功率 22 W。
// 答案：（1）de；（2）3.3×10⁴ J；（3）0.1 A；（4）44 W。
import assert from 'node:assert/strict';
import test from 'node:test';
import { rotaryHeaterSetup, rotaryHeaterAt, ROTARY_POSITIONS } from '../src/lib/rotaryHeater.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);
const setup = rotaryHeaterSetup({ U: 220, R1: 1100, R2: 1100, I_high: 0.25 });

test('2024 广州第 15 题 · bc 时 R1、R2 串联：2200 Ω、0.1 A、22 W（第 3 问）', () => {
  const bc = rotaryHeaterAt(setup, 'bc');
  close(bc.R, 2200); close(bc.I, 0.1); close(bc.P, 22);
  close(bc.branch.R1, 0.1); close(bc.branch.R3, 0);
});

test('2024 广州第 15 题 · cd 时 R1 被短路，只有 R2：44 W（第 4 问）', () => {
  const cd = rotaryHeaterAt(setup, 'cd');
  close(cd.branch.R1, 0); close(cd.R, 1100); close(cd.P, 44);
});

test('2024 广州第 15 题 · de 时 R2、R3 并联，总电流 0.25 A，10 min 耗电 3.3×10⁴ J（第 2 问）', () => {
  const de = rotaryHeaterAt(setup, 'de');
  close(de.I, 0.25); close(de.branch.R2, 0.2); close(de.branch.R3, 0.05);
  close(setup.R3, 4400); close(de.P, 55);
  close(setup.U * de.I * 600, 3.3e4, 1e-6);
});

test('ab 断开没有电流；功率 bc < cd < de，de 是高温挡（第 1 问）', () => {
  const p = ROTARY_POSITIONS.map((pos) => rotaryHeaterAt(setup, pos).P);
  assert.deepEqual(p.map((v) => Math.round(v)), [0, 22, 44, 55]);
  assert.equal(rotaryHeaterAt(setup, 'ab').I, 0);
  assert.throws(() => rotaryHeaterAt(setup, 'ae'));
  assert.throws(() => rotaryHeaterSetup({ U: 220, R1: 1100, R2: 1100, I_high: 0.2 }));
});

test('拖开关：按角度落到最近的挡位', async () => {
  const { rotaryNearest } = await import('../src/lib/rotaryHeater.js');
  assert.equal(rotaryNearest(25), 'de');
  assert.equal(rotaryNearest(-20), 'de');
  assert.equal(rotaryNearest(95), 'cd');
  assert.equal(rotaryNearest(160), 'bc');
  assert.equal(rotaryNearest(250), 'ab');
});
