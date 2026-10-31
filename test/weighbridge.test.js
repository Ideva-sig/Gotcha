// 地磅互动图对真题：2024 广州第 9 题（Q-PHY-GZ2024-09）。答案 A：电压表示数越大；电流表示数不变。
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWidget } from '../src/lib/mathWidgets.js';
import { weighbridgeSetup, weighbridgeAt, wbSlideY, WB } from '../src/lib/weighbridge.js';

const setup = weighbridgeSetup(parseWidget('type: weighbridge\nU: 6\nR0: 10\nR: 20\np: 40\n'));

test('2024 广州第 9 题 · 车越重，电流表示数不变（C、D 错）', () => {
  const currents = [0, 25, 50, 75, 100].map((p) => weighbridgeAt(setup, p).I);
  for (const i of currents) assert.equal(i, 0.2);
  assert.equal(weighbridgeAt(setup, 60).total, 30);
});

test('2024 广州第 9 题 · 车越重，电压表示数越大（A 对、B 错）', () => {
  const v = [0, 25, 50, 75, 100].map((p) => weighbridgeAt(setup, p).Uv);
  assert.equal(v[0], 0);
  for (let i = 1; i < v.length; i++) assert.ok(v[i] > v[i - 1]);
  assert.equal(weighbridgeAt(setup, 100).Uv, 4);
});

test('滑片位置在变阻器两端之间；参数不对就报错', () => {
  assert.equal(wbSlideY(0), WB.top);
  assert.equal(wbSlideY(100), WB.bottom);
  assert.throws(() => weighbridgeSetup({ U: 6, R0: 0, R: 20 }));
  assert.throws(() => weighbridgeSetup({ U: 6, R0: 10, R: 20, p: 120 }));
});
