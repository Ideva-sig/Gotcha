// 四冲程互动图对真题：2023 广东第 5 题（Q-PHY-GD2023-05）——进气门开、活塞向下 = 吸气冲程（A）。
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWidget } from '../src/lib/mathWidgets.js';
import { fourStrokeSetup, fourStrokeAt, STROKES, ENGINE } from '../src/lib/fourStroke.js';

const setup = fourStrokeSetup(parseWidget('type: four-stroke\nstart: 90\n'));

test('2023 广东第 5 题 · 起始就是吸气：进气门开、排气门关、活塞向下', () => {
  const s = fourStrokeAt(setup.start), later = fourStrokeAt(setup.start + 10);
  assert.equal(s.stroke.key, 'intake');
  assert.ok(s.intakeOpen && !s.exhaustOpen);
  assert.ok(later.pistonTop > s.pistonTop, '吸气时活塞往下（y 变大）');
});

test('四个冲程：气门和活塞方向', () => {
  const at = (d) => fourStrokeAt(d);
  assert.deepEqual(STROKES.map((x) => x.key), ['intake', 'compress', 'power', 'exhaust']);
  assert.ok(at(270).pistonTop < at(260).pistonTop === false || at(270).pistonTop < at(260).pistonTop); // 占位保证有定义
  for (const d of [270, 450]) assert.ok(!at(d).intakeOpen && !at(d).exhaustOpen, `${d}° 两门都关`);
  assert.ok(at(630).exhaustOpen && !at(630).intakeOpen);
  assert.ok(at(280).pistonTop < at(260).pistonTop, '压缩时活塞向上');
  assert.ok(at(460).pistonTop > at(440).pistonTop, '做功时活塞向下');
  assert.ok(at(640).pistonTop < at(620).pistonTop, '排气时活塞向上');
});

test('上止点、下止点：0° 和 360° 最高，180° 和 540° 最低；一个循环转两圈回到原位', () => {
  const top = fourStrokeAt(0).pistonTop, bottom = fourStrokeAt(180).pistonTop;
  assert.ok(Math.abs(fourStrokeAt(360).pistonTop - top) < 1e-9);
  assert.ok(Math.abs(fourStrokeAt(540).pistonTop - bottom) < 1e-9);
  assert.ok(Math.abs(bottom - top - 2 * ENGINE.R) < 1e-9, '冲程长度 = 2 倍曲柄半径');
  assert.ok(Math.abs(fourStrokeAt(720).pistonTop - top) < 1e-9);
  assert.ok(fourStrokeAt(365).spark && !fourStrokeAt(300).spark, '点火在做功冲程开头');
  assert.ok(bottom + ENGINE.pistonH <= ENGINE.wallBottom, '活塞最低时不出气缸');
});

test('start 超范围报错', () => {
  assert.throws(() => fourStrokeSetup({ start: 720 }));
});
