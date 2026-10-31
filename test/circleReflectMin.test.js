// 圆内动点最值互动图对真题：2025 广州第 9 题（Q-MATH-GZ2025-09）。
// 解析：∠BOD=30°，∠COD=60°，CD=2；作 C 关于 AB 的对称点 C′，C′D=2√3，周长最小值 2+2√3（选 B）。
import assert from 'node:assert/strict';
import test from 'node:test';
import { circleReflectSetup, circleReflectAt, circleReflectMinimum } from '../src/lib/circleReflectMin.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);
const setup = circleReflectSetup({ radius: 2, C: 90, D: 30 });

test('2025 广州第 9 题 · 各点位置和 CD、C′D', () => {
  close(setup.C.x, 0); close(setup.C.y, 2);
  close(setup.D.x, Math.sqrt(3)); close(setup.D.y, 1);
  close(setup.C2.y, -2);
  const min = circleReflectMinimum(setup);
  close(min.cd, 2);
  close(min.c2d, 2 * Math.sqrt(3));
});

test('2025 广州第 9 题 · 最小周长 2+2√3，在 C′D 与 AB 的交点', () => {
  const min = circleReflectMinimum(setup);
  close(setup.bestX, 2 * Math.sqrt(3) / 3);
  close(min.perimeter, 2 + 2 * Math.sqrt(3));
  // P 走遍 AB，周长都不小于这个值；网格上最接近的点就在交点旁边
  let lowest = { x: 0, perimeter: Infinity };
  for (let i = 0; i <= 4000; i++) {
    const x = -2 + i / 1000;
    const { perimeter } = circleReflectAt(setup, x);
    assert.ok(perimeter >= min.perimeter - 1e-12, `x=${x} 时周长 ${perimeter} 比最小值还小`);
    if (perimeter < lowest.perimeter) lowest = { x, perimeter };
  }
  assert.ok(Math.abs(lowest.x - setup.bestX) <= 0.001);
});

test('P 超出直径时停在端点；C、D 不在上半圆时报错', () => {
  close(circleReflectAt(setup, 5).P.x, 2);
  close(circleReflectAt(setup, -5).P.x, -2);
  assert.throws(() => circleReflectSetup({ radius: 2, C: 90, D: -30 }));
  assert.throws(() => circleReflectSetup({ radius: 2, C: 60, D: 60 }));
});
