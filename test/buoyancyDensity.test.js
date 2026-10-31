// 浮力互动图对 2024 广州第 6 题：体积不变，液体密度变小 → 浮力变小，排开液体重力也变小（A 对、C D 错）。
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWidget } from '../src/lib/mathWidgets.js';
import { buoyancySetup, buoyancyAt, subY } from '../src/lib/buoyancyDensity.js';

const setup = buoyancySetup(parseWidget('type: buoyancy-density\nrho: 1.03\nmin: 1.0\nmax: 1.06\nV: 2\n'));

test('起始密度处刚好悬浮：浮力等于重力', () => {
  const s = buoyancyAt(setup, 1.03);
  assert.ok(Math.abs(s.F - s.weight) < 1e-6);
  assert.equal(s.sinking, false);
});

test('密度变小，浮力和排开液体的重力同步变小，潜水艇下沉（体积没变）', () => {
  const hi = buoyancyAt(setup, 1.03), lo = buoyancyAt(setup, 1.01);
  assert.ok(lo.F < hi.F);
  assert.equal(lo.displaced, lo.F);
  assert.equal(lo.sinking, true);
  assert.ok(subY(lo.deficit) > subY(hi.deficit));
});

test('参数不对报错', () => {
  assert.throws(() => buoyancySetup({ rho: 2, min: 1, max: 1.06 }));
});
