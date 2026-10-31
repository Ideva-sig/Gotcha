// 平面镜互动图对 2022 广东第 13 题：白鹭距水面 5 m，像距水面 5 m，像是虚像。
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWidget } from '../src/lib/mathWidgets.js';
import { mirrorSetup, mirrorAt, MIRROR } from '../src/lib/mirrorImage.js';

const setup = mirrorSetup(parseWidget('type: mirror-image\nd: 5\n'));

test('2022 广东第 13 题 · 物距 5 m，像距也是 5 m', () => {
  const s = mirrorAt(setup, 5);
  assert.equal(s.imgDist, 5);
  assert.ok(Math.abs((s.img.y - MIRROR.surfaceY) - (MIRROR.surfaceY - s.obj.y)) < 1e-9);
  assert.equal(s.obj.x, s.img.x);
});

test('反射点满足反射定律：入射角等于反射角', () => {
  for (const d of [1, 3, 5, 8]) {
    const s = mirrorAt(setup, d), e = MIRROR.eye;
    const ai = Math.atan2(Math.abs(s.O.x - s.obj.x), s.obj.y === MIRROR.surfaceY ? 1 : MIRROR.surfaceY - s.obj.y);
    const ar = Math.atan2(Math.abs(e.x - s.O.x), MIRROR.surfaceY - e.y);
    assert.ok(Math.abs(ai - ar) < 1e-9);
    assert.ok(s.O.x > s.obj.x && s.O.x < e.x);
  }
});

test('参数不对报错', () => {
  assert.throws(() => mirrorSetup({ d: 9 }));
});
