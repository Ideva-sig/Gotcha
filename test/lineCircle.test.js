// 直线与圆互动图对课本习题 30.1 第 1 题（Q-MATH-TB9A-30.1-1）：AC = 3，BC = 4，AB = 5，d = 2.4；r = 2 相离，2.4 相切，3 相交。
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWidget } from '../src/lib/mathWidgets.js';
import { lineCircleSetup, lineCircleAt, lineCircleProject } from '../src/lib/lineCircle.js';

const config = parseWidget('type: line-circle\nac: 3\nbc: 4\nr: 2\nmax: 4\n');
const setup = lineCircleSetup(config);

test('课本 30.1 第 1 题 · 圆心 C 到 AB 的距离 d = 2.4', () => {
  assert.equal(setup.hyp, 5);
  assert.ok(Math.abs(setup.d - 2.4) < 1e-12);
});

test('课本 30.1 第 1 题 · r = 2 相离，2.4 相切，3 相交', () => {
  assert.equal(lineCircleAt(setup, 2).rel, 'apart');
  assert.equal(lineCircleAt(setup, 2.4).rel, 'tangent');
  assert.equal(lineCircleAt(setup, 3).rel, 'cross');
  // 滑杆走 0.1 一格，2.4 也要能落准（用 Math.round(r*10)/10 得到的数）
  assert.equal(lineCircleAt(setup, Math.round(24) / 10).rel, 'tangent');
});

test('公共点个数：相离 0、相切 1、相交 2，且都在圆上、在 AB 上', () => {
  for (const [r, n] of [[2, 0], [2.4, 1], [3, 2]]) {
    const s = lineCircleAt(setup, r);
    assert.equal(s.hits.length, n);
    for (const p of s.hits) {
      assert.ok(Math.abs(Math.hypot(p.x, p.y) - r) < 1e-9);
      assert.ok(Math.abs(4 * p.x + 3 * p.y - 12) < 1e-9); // 直线 AB：4x + 3y = 12
    }
  }
  const { p } = lineCircleProject(setup);
  const o = p({ x: 0, y: 0 });
  assert.ok(o.x - 4 * lineCircleProject(setup).S >= 0 && o.y + 4 * lineCircleProject(setup).S <= 400, '最大的圆也要在图里');
});

test('参数不合理就报错', () => {
  assert.throws(() => lineCircleSetup({ ac: 3, bc: 4, max: 2 }));
  assert.throws(() => lineCircleSetup({ ac: 3, bc: 0 }));
});
