import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LIQUIDS, DIRECTIONS, DEPTH_MIN, DEPTH_MAX, DEPTH_STEP, RECORD_MIN_DEPTH, DH_STEP, U_TOP_H, U_MID_H, U_MARGIN,
  VIEW_W, VIEW_H, YS, SP, BEAKER_BOTTOM_Y, BEAKER_RIM_Y, BEAKER_X0, BEAKER_X1, U_BASE_Y, U_TOP_Y, ROD_TOP,
  liquidOf, deltaH, readDh, levelsOf, readLevels, probeBox, membraneY, uY, stemX, maxLevelH, minLevelH,
  depthFromY, clampDepth, record, addRow, directionsDone, depthDone, densityDone,
} from '../src/lib/liquidPressureLab.js';

const close = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);
const water = liquidOf('water'), salt = liquidOf('salt'), alcohol = liquidOf('alcohol');
const depths = []; for (let h = DEPTH_MIN; h <= DEPTH_MAX; h += DEPTH_STEP) depths.push(h);

test('Δh = ρ液 h / ρ管：水里 Δh 等于深度，盐水 1.2 倍，酒精 0.8 倍', () => {
  close(deltaH(water, 5), 5); close(deltaH(salt, 5), 6); close(deltaH(alcohol, 5), 4);
  assert.equal(deltaH(water, 0), 0);
  assert.equal(readDh(deltaH(salt, 3)), 3.6);
  assert.equal(readDh(deltaH(alcohol, 7)), 5.6);
});

test('同一深度，三个朝向 Δh 相等（膜中心深度一样）', () => {
  for (const l of LIQUIDS) for (const h of depths) {
    const rows = DIRECTIONS.map((d) => record(l, d.id, h)).filter(Boolean);
    if (h < RECORD_MIN_DEPTH) { assert.equal(rows.length, 0); continue; }
    assert.equal(rows.length, 3);
    assert.ok(rows.every((r) => r.dh === rows[0].dh));
    // 画面里三个朝向的膜中心也都在同一高度
    const ym = membraneY(h);
    close(probeBox('up', h).top, ym); close(probeBox('down', h).bottom, ym); close(probeBox('side', h).cy, ym);
  }
});

test('深度越大 Δh 越大（每一级读数都变大）', () => {
  for (const l of LIQUIDS) {
    let last = -1;
    for (const h of depths) {
      const v = readDh(deltaH(l, h));
      assert.ok(v > last, `${l.id} ${h}`);
      last = v;
    }
  }
});

test('同一深度，水、盐水、酒精的 Δh 读数（0.1 cm）都看得出差别', () => {
  for (const h of depths.filter((x) => x >= RECORD_MIN_DEPTH)) {
    const a = readDh(deltaH(alcohol, h)), w = readDh(deltaH(water, h)), s = readDh(deltaH(salt, h));
    assert.ok(a < w && w < s);
    assert.ok(w - a >= 0.4 - 1e-9 && s - w >= 0.4 - 1e-9, `${h}: ${a} ${w} ${s}`);
  }
  assert.equal(DH_STEP, 0.1);
});

test('U 形管两边液面：各动一半，读数相减得 Δh，且都读得到 0.1 cm', () => {
  for (const l of LIQUIDS) for (const h of depths) {
    const dh = deltaH(l, h);
    const lv = levelsOf(dh);
    close(lv.right - lv.left, dh);
    close((lv.left + lv.right) / 2, U_MID_H);
    const r = readLevels(dh);
    assert.equal(Number((r.right - r.left).toFixed(1)), r.dh);
  }
  assert.deepEqual(readLevels(0), { left: 8, right: 8, dh: 0 });
});

test('几何上限：最深处 U 形管液柱和探头都在画面里，也不压住字', () => {
  // U 形管：两边液面都在刻度范围内（留 0.5 cm 余量）
  assert.ok(maxLevelH() <= U_TOP_H - U_MARGIN, `${maxLevelH()}`);
  assert.ok(minLevelH() >= U_MARGIN, `${minLevelH()}`);
  assert.ok(uY(maxLevelH()) >= U_TOP_Y + U_MARGIN * 14 - 1e-9);
  assert.ok(U_TOP_Y > 150 && U_BASE_Y + 40 < VIEW_H); // 管子（含底部弯）在画面里，并在读数框下面
  // 探头：在最深处，每个朝向都在烧杯液体里，没碰杯底，也没出左右边
  for (const d of DIRECTIONS) for (const h of depths) {
    const b = probeBox(d.id, h);
    assert.ok(b.bottom <= BEAKER_BOTTOM_Y - 8, `${d.id} ${h} bottom ${b.bottom}`);
    assert.ok(b.left > BEAKER_X0 + 40 && b.right < BEAKER_X1 - 40, `${d.id} ${h}`);
    assert.ok(b.top >= ROD_TOP && b.bottom < VIEW_H);
    assert.ok(stemX(d.id) > BEAKER_X0 + 40);
  }
  assert.ok(BEAKER_BOTTOM_Y + 4 < VIEW_H - 60 && BEAKER_RIM_Y < YS);
  assert.ok(YS + DEPTH_MAX * SP < BEAKER_BOTTOM_Y);
  assert.ok(VIEW_W >= 520);
});

test('拖动：指针 y 能落到每个整数厘米；越界会夹在范围内', () => {
  for (const h of depths) {
    assert.equal(depthFromY(membraneY(h)), h);
    assert.equal(depthFromY(membraneY(h) + SP * 0.4), h);
  }
  assert.equal(depthFromY(-100), DEPTH_MIN);
  assert.equal(depthFromY(10000), DEPTH_MAX);
  assert.equal(clampDepth(3.4), 3);
});

test('记录和三个任务：用 1 cm 的步长都能做到', () => {
  let rows = [];
  const put = (l, d, h) => { rows = addRow(rows, record(l, d, h)); };
  assert.ok(!directionsDone(rows) && !depthDone(rows) && !densityDone(rows));
  // ① 水里 5 cm，上、下、侧各一次
  for (const d of ['up', 'down', 'side']) put(water, d, 5);
  assert.ok(directionsDone(rows));
  assert.ok(!depthDone(rows) && !densityDone(rows));
  // 只做两个朝向不算
  assert.ok(!directionsDone([record(water, 'up', 5), record(water, 'down', 5)]));
  // ② 朝上：3、5、8 cm
  put(water, 'up', 3); assert.ok(!depthDone(rows));
  put(water, 'up', 8); assert.ok(depthDone(rows));
  // 重复不增加
  const n = rows.length; put(water, 'up', 8); assert.equal(rows.length, n);
  // ③ 换盐水，朝上 5 cm
  assert.ok(!densityDone(rows));
  put(salt, 'up', 5); assert.ok(densityDone(rows));
  // 探头没完全浸入（深度 < 2 cm）不记
  assert.equal(record(water, 'up', 0), null);
  assert.equal(record(water, 'up', 1), null);
  // 每个液体、每个深度都只有一个 Δh，酒精 < 水 < 盐水
  const r = [alcohol, water, salt].map((l) => record(l, 'side', 9).dh);
  assert.deepEqual(r, [7.2, 9, 10.8]);
});
