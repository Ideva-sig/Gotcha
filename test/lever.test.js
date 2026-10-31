// 杠杆互动图对 2022 广东第 21 题第（2）问：3 个钩码每个 0.5 N 挂在离支点 4 格处，右边 3 格处竖直向下拉，最小拉力 2 N。
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWidget } from '../src/lib/mathWidgets.js';
import { leverSetup, leverAt } from '../src/lib/lever.js';

const setup = leverSetup(parseWidget('type: lever\nf1: 1.5\nl1: 4\nl2: 3\nmax: 4\n'));

test('2022 广东第 21 题（2）· 右边 3 格处要拉 2 N', () => {
  const s = leverAt(setup, 3);
  assert.ok(Math.abs(s.F - 2) < 1e-9);
});

test('力 × 力臂两边相等；作用点越远，所需拉力越小', () => {
  let last = Infinity;
  for (let l = 1; l <= 4; l++) {
    const s = leverAt(setup, l);
    assert.ok(Math.abs(s.left - s.right) < 1e-9);
    assert.ok(s.F < last);
    last = s.F;
  }
});

test('参数不对报错', () => {
  assert.throws(() => leverSetup({ f1: 0, l1: 4, l2: 3 }));
  assert.throws(() => leverSetup({ f1: 1.5, l1: 4, l2: 5, max: 4 }));
});
