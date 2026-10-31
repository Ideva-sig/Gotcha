// 串联灯泡互动图对真题：2023 广东第 14 题（Q-PHY-GD2023-14），串联；先正常发光的是 L2；此时通过 L1 的电流 0.15 A。
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWidget } from '../src/lib/mathWidgets.js';
import { seriesSetup, seriesAt } from '../src/lib/seriesLamps.js';

const config = parseWidget('type: series-lamps\nl1v: 2.5\nl1a: 0.3\nl2v: 6\nl2a: 0.15\nmax: 8\nstep: 0.25\n');
const setup = seriesSetup(config);

test('2023 广东第 14 题 · 先正常发光的是 L2，此时电源 7.25 V', () => {
  assert.equal(setup.lamps[setup.first].name, 'L2');
  assert.ok(Math.abs(setup.Ufirst - 7.25) < 1e-9);
  const now = seriesAt(setup, setup.Ufirst);
  assert.equal(now.lamps[1].state, 'normal');
});

test('2023 广东第 14 题 · 串联电流处处相等，此时通过 L1 的电流 0.15 A，L1 还没到额定', () => {
  const now = seriesAt(setup, 7.25);
  assert.ok(Math.abs(now.I - 0.15) < 1e-9);
  assert.equal(now.lamps[0].I, now.lamps[1].I);
  assert.equal(now.lamps[0].state, 'dim');
  assert.ok(Math.abs(now.lamps[0].u - 1.25) < 1e-9); // L1 两端 1.25 V，不到 2.5 V
});

test('电压从 0 增加：先不亮，到 8 V 时 L2 超过额定；电压要能落在滑杆刻度上', () => {
  assert.equal(seriesAt(setup, 0).lamps[1].state, 'off');
  assert.equal(seriesAt(setup, 8).lamps[1].state, 'over');
  assert.equal(((setup.Ufirst - 0) / setup.step) % 1, 0);
  assert.throws(() => seriesSetup({ ...config, max: 5 }));
});
