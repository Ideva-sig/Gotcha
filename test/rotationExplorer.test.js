// 图形旋转互动图对课本习题 28.1 第 7 题（Q-MATH-TB9A-28.1-7）：BC = 3，AC = 4，绕点 B 逆时针旋转 90°，AA′ = 5√2。
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWidget } from '../src/lib/mathWidgets.js';
import { rotationSetup, rotationAt } from '../src/lib/rotationExplorer.js';

const setup = rotationSetup(parseWidget('type: rotation-explorer\nbc: 3\nac: 4\nstart: 90\n'));

test('28.1 第 7 题 · 转 90°：A′ = (3, 7)，C′ = (3, 3)，AA′ = 5√2', () => {
  const s = rotationAt(setup, 90);
  assert.ok(Math.abs(s.A2.x - 3) < 1e-9 && Math.abs(s.A2.y - 7) < 1e-9);
  assert.ok(Math.abs(s.C2.x - 3) < 1e-9 && Math.abs(s.C2.y - 3) < 1e-9);
  assert.ok(Math.abs(s.AA2 - 5 * Math.SQRT2) < 1e-9);
  assert.ok(Math.abs(s.BA - 5) < 1e-9);
});

test('旋转性质：BA = BA′、BC = BC′；转 0° 重合；AA′ = 2·BA·sin(θ/2)', () => {
  for (const deg of [0, 30, 90, 135, 180]) {
    const s = rotationAt(setup, deg);
    assert.ok(Math.abs(s.BA - s.BA2) < 1e-9);
    assert.ok(Math.abs(s.BC - s.BC2) < 1e-9);
    assert.ok(Math.abs(s.AA2 - 2 * s.BA * Math.sin(deg * Math.PI / 360)) < 1e-9);
  }
  assert.ok(rotationAt(setup, 0).AA2 < 1e-9);
});

test('参数不对报错', () => {
  assert.throws(() => rotationSetup({ bc: 0, ac: 4 }));
  assert.throws(() => rotationSetup({ bc: 3, ac: 4, start: 200 }));
});
