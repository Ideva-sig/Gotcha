// 凸透镜成像互动图对真题：2023 广州第 11 题（Q-PHY-GZ2023-11），f = 10 cm，u = 25 cm > 2f → 倒立、缩小的实像。
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWidget } from '../src/lib/mathWidgets.js';
import { lensSetup, lensAt, lensGeometry } from '../src/lib/lensImaging.js';

const config = parseWidget('type: lens-imaging\nu: 25\nf: 10\nvary: u\nmin: 5\nmax: 40\nstep: 5\n');

test('2023 广州第 11 题 · f = 10 cm，u = 25 cm：倒立、缩小的实像', () => {
  lensSetup(config);
  const r = lensAt(25, 10);
  assert.deepEqual([r.kind, r.upright, r.real, r.size], ['reduced', false, true, '缩小']);
  assert.deepEqual([5, 10, 15, 20, 30].map((u) => lensAt(u, 10).kind), ['virtual', 'none', 'enlarged', 'equal', 'reduced']);
});

test('像距：1/u + 1/v = 1/f；u = 25、f = 10 时像距 50/3 cm，在一倍到二倍焦距之间', () => {
  const r = lensAt(25, 10);
  assert.ok(Math.abs(r.v - 50 / 3) < 1e-9);
  assert.ok(r.v > 10 && r.v < 20);
  assert.equal(r.use, '照相机');
});

test('几何：实像在光屏位置，虚像用虚线反向延长，不成像时没有像', () => {
  const g = lensGeometry(25, 10);
  assert.ok(g.I && g.screenX === g.I.x && g.I.y > 150, '倒立：像在主光轴下方');
  const v = lensGeometry(10, 15);
  assert.ok(v.back.length === 2 && v.I.y < 150, '正立虚像在轴上方');
  const n = lensGeometry(20, 20);
  assert.equal(n.I, null);
  assert.equal(n.offscreen, false);
});

test('参数错误会报错', () => {
  assert.throws(() => lensSetup({ u: 25, f: 10, vary: 'x', min: 5, max: 40, step: 5 }));
  assert.throws(() => lensSetup({ u: 25, f: 10, vary: 'u', min: 30, max: 40, step: 5 }));
});
