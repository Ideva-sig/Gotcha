import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INC_MIN, INC_MAX, INC_STEP, FOLD_BACK, FOLD_FRONT, VIEW_R, ORIGIN_R, BOARD, RAY_LEN, EMITTER_R, GUIDE_R, TICK_R, LABEL_R, MIRROR_H,
  A_D_MIN, A_D_MAX, A_D_STEP, A_Y_MIN, A_Y_MAX, A_Y_STEP, B_D_MIN, B_D_MAX, B_Y_MIN, B_Y_MAX, B_STEP, OVERLAP_TOL,
  START_A, START_B, VIEW_I, PX_CM, CANDLE_R, LABEL_GAP, DIM_Y,
  rayState, reverseOf, reflectDir, reflectedSeen, foldTransform, rayPoint, labelBoxes, reflectRow, addAngleRow, reflectTasks,
  imageOf, overlaps, nearestB, screenView, imageRow, addImageRow, imageTasks, xOfA, xOfB, yOf,
} from '../src/lib/mirrorLab.js';

const angles = [];
for (let i = INC_MIN; i <= INC_MAX; i += INC_STEP) angles.push(i);

test('反射角恒等于入射角，反射光和入射光分居法线两侧', () => {
  for (const side of [-1, 1]) {
    for (const i of angles) {
      const s = rayState(i, side);
      assert.ok(Math.abs(s.r - i) < 1e-6, `i=${i} r=${s.r}`);
      assert.equal(s.outSide, -side);
    }
  }
  // 反射只翻转竖直分量
  assert.deepEqual(reflectDir([0.6, -0.8]), [0.6, 0.8]);
});

test('入射角步长能产生至少 3 组不同的记录', () => {
  assert.ok(angles.length >= 3);
  assert.equal(angles[0], INC_MIN);
  assert.equal(angles[angles.length - 1], INC_MAX);
  let rows = [];
  for (const i of angles) rows = addAngleRow(rows, reflectRow(i));
  rows = addAngleRow(rows, reflectRow(angles[0])); // 重复的不加
  assert.ok(rows.length >= 3);
  assert.equal(new Set(rows.map((r) => r.i)).size, rows.length);
  assert.ok(rows.every((r) => Math.abs(r.r - r.i) < 1e-6));
  assert.deepEqual(reflectTasks({ rows, foldSeen: false, reverseSeen: false }), { angles: true, fold: false, reverse: false });
  assert.equal(reflectTasks({ rows: rows.slice(0, 2) }).angles, false);
});

test('纸板折后看不到反射光，复原后又能看到', () => {
  assert.equal(reflectedSeen(0), true);
  assert.equal(reflectedSeen(FOLD_BACK), false);
  assert.equal(reflectedSeen(FOLD_FRONT), false);
  assert.ok(foldTransform(FOLD_BACK).sx < 1);
  assert.ok(foldTransform(FOLD_BACK).shear > 0 && foldTransform(FOLD_FRONT).shear < 0);
});

test('光路可逆：逆着反射光射回去，会沿原来的入射光射出', () => {
  for (const side of [-1, 1]) {
    for (const i of angles) {
      const b = reverseOf(i, side);
      assert.equal(b.retraces, true, `i=${i}`);
      assert.equal(b.side, -side); // 新的入射光就在原来反射光的位置
      assert.equal(b.outSide, side); // 射出的位置就是原来入射光的位置
    }
  }
});

// 线段（x1,y1)-(x2,y2) 是否碰到以 (cx,cy) 为中心的矩形（留 pad 的空隙）
function segHitsBox(p, q, b, pad = 1) {
  const x0 = b.cx - b.w / 2 - pad, x1 = b.cx + b.w / 2 + pad, y0 = b.cy - b.h / 2 - pad, y1 = b.cy + b.h / 2 + pad;
  for (let t = 0; t <= 1; t += 0.002) {
    const x = p.x + (q.x - p.x) * t, y = p.y + (q.y - p.y) * t;
    if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return true;
  }
  return false;
}
function circleHitsBox(c, r, b, pad = 1) {
  const dx = Math.max(Math.abs(c.x - b.cx) - b.w / 2 - pad, 0);
  const dy = Math.max(Math.abs(c.y - b.cy) - b.h / 2 - pad, 0);
  return dx * dx + dy * dy < r * r;
}
const inView = (x, y, m = 0) => ORIGIN_R.x + x >= m && ORIGIN_R.x + x <= VIEW_R.w - m && ORIGIN_R.y + y >= m && ORIGIN_R.y + y <= VIEW_R.h - m;

test('最大入射角时光线、发射器和刻度数字都不出画面，也不互相压住', () => {
  assert.ok(RAY_LEN + EMITTER_R < TICK_R && GUIDE_R <= TICK_R + 14 && GUIDE_R < LABEL_R - 13);
  const boxes = labelBoxes();
  assert.equal(boxes.length, 17);
  // 刻度数字自己都在画面里
  for (const b of boxes) {
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) assert.ok(inView(b.cx + dx * b.w / 2, b.cy + dy * b.h / 2, 2), `label ${b.text}`);
    assert.ok(b.cy + b.h / 2 < -4, '数字不压镜面');
  }
  // 纸板的四角
  assert.ok(inView(-BOARD.w, -BOARD.h, 2) && inView(BOARD.w, -BOARD.h, 2));
  assert.ok(MIRROR_H + ORIGIN_R.y <= VIEW_R.h);
  for (const side of [-1, 1]) {
    for (const i of angles) {
      const s = rayState(i, side);
      for (const [ang, sd] of [[i, side], [s.r, s.outSide]]) {
        const end = rayPoint(ang, sd, RAY_LEN);
        const guide = rayPoint(ang, sd, GUIDE_R);
        // 发射器整个圆在画面里，且离镜面还有空隙
        assert.ok(inView(end.x - EMITTER_R, end.y - EMITTER_R, 2) && inView(end.x + EMITTER_R, end.y + EMITTER_R, 2));
        assert.ok(end.y + EMITTER_R < -2, `发射器压镜面 i=${i}`);
        assert.ok(inView(guide.x, guide.y, 2));
        for (const b of boxes) {
          assert.ok(!segHitsBox({ x: 0, y: 0 }, guide, b), `光线压字 i=${i} 数字${b.text}`);
          assert.ok(!circleHitsBox(end, EMITTER_R, b), `发射器压字 i=${i} 数字${b.text}`);
        }
      }
    }
  }
  assert.ok(LABEL_R > GUIDE_R);
});

test('纸板折起来之后，右半块也不出画面', () => {
  for (const fold of [FOLD_BACK, FOLD_FRONT]) {
    const { sx, shear } = foldTransform(fold);
    const corners = [[BOARD.w, -BOARD.h], [BOARD.w, 0], [LABEL_R + 20, -LABEL_R]];
    for (const [x, y] of corners) assert.ok(inView(x * sx, y + x * shear, 2), `fold=${fold}`);
  }
});

test('A 的每个允许位置，B 用它的步长都能落进“重合”误差内', () => {
  let n = 0;
  for (let d = A_D_MIN; d <= A_D_MAX; d += A_D_STEP) {
    for (let y = A_Y_MIN; y <= A_Y_MAX; y += A_Y_STEP) {
      const a = { d, y };
      const b = nearestB(a);
      assert.ok(b.d >= B_D_MIN && b.d <= B_D_MAX && b.y >= B_Y_MIN && b.y <= B_Y_MAX, `B 超出范围 ${d},${y}`);
      assert.ok(overlaps(a, b), `d=${d} y=${y}`);
      // 偏一步（0.5 cm）就不算重合，所以确实要对准
      assert.ok(!overlaps(a, { d: b.d + B_STEP, y: b.y }));
      assert.ok(!overlaps(a, { d: b.d, y: b.y - B_STEP }));
      n++;
    }
  }
  assert.ok(n >= 3 * 3);
  assert.ok(B_STEP / 2 <= OVERLAP_TOL && OVERLAP_TOL < B_STEP);
  assert.ok(overlaps(START_A, nearestB(START_A)) && !overlaps(START_A, START_B));
});

test('像的特点：像距等于物距，连线垂直镜面，光屏上接不到', () => {
  const a = { d: 10, y: 4 };
  const img = imageOf(a);
  assert.equal(img.d, a.d); // 像距等于物距
  assert.equal(img.y, a.y); // 物和像在同一条垂直于镜面的直线上
  const b = nearestB(a);
  assert.equal(screenView(a, b).atImage, true);
  assert.equal(screenView(a, b).hasImage, false);
  assert.equal(screenView(a, { d: 20, y: 0 }).atImage, false);
});

test('记录表：每个物距一行，至少 3 组，任务按记录数和光屏完成', () => {
  let rows = [];
  for (const d of [8, 12, 5, 8]) {
    const a = { d, y: 2 };
    rows = addImageRow(rows, imageRow(a, nearestB(a)));
  }
  rows = addImageRow(rows, imageRow({ d: 6, y: 0 }, { d: 20, y: 0 })); // 没重合，不记
  assert.deepEqual(rows.map((r) => r.u), [5, 8, 12]);
  assert.ok(rows.every((r) => r.u === r.v));
  assert.deepEqual(imageTasks({ rows, screenSeen: false }), { pos: true, screen: false });
  assert.equal(imageTasks({ rows: rows.slice(0, 2), screenSeen: true }).pos, false);
});

test('俯视图：蜡烛、字母和距离线都在画面里，也不压住', () => {
  for (const d of [A_D_MIN, A_D_MAX]) for (const y of [A_Y_MIN, A_Y_MAX]) {
    const x = xOfA(d), yy = yOf(y);
    assert.ok(x - CANDLE_R >= 4 && yy - CANDLE_R - LABEL_GAP >= 4 && yy + CANDLE_R < DIM_Y - 20);
  }
  for (const d of [B_D_MIN, B_D_MAX]) for (const y of [B_Y_MIN, B_Y_MAX]) {
    const x = xOfB(d), yy = yOf(y);
    assert.ok(x + CANDLE_R <= VIEW_I.w - 4 && yy - CANDLE_R - LABEL_GAP >= 4 && yy + CANDLE_R < DIM_Y - 20);
  }
  assert.ok(DIM_Y + 24 <= VIEW_I.h);
  assert.ok(PX_CM > 0);
});
