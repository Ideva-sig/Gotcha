import assert from 'node:assert/strict';
import test from 'node:test';
import {
  NUT_BAL, NUT_START, NUT_MIN, NUT_MAX, RIDER_MAX, RIDER_DIV, WEIGHTS, STONE, BRINE, CYL_MAX, CYL_DIV, POUR_MIN,
  STONE_MIN_WATER, STONE_MAX_WATER, DIAL_HALF,
  initialState, lean, balanced, pointerPos, reading, measurement, isLeveled, adjustNut, panMassU,
  cylinderReading, pourWater, dropStone, takeStone, pourBrine, emptyRecords, updateRecords, stoneResult, brineResult,
  taskStatus, solveWeights, balanceHint, gOf,
} from '../src/lib/densityLab.js';

const withScale = (s, mass) => {
  const sol = solveWeights(mass);
  assert.ok(sol, `砝码盒配不出 ${mass} g`);
  return { ...s, nut: NUT_BAL, weights: sol.weights, rider: sol.rider };
};

test('平衡螺母：开始指针偏左，一档一档向右调到中线', () => {
  assert.ok(NUT_MIN <= NUT_START && NUT_START < NUT_BAL && NUT_BAL <= NUT_MAX);
  let s = initialState();
  assert.ok(pointerPos(s) < 0, '开始指针偏左');
  assert.ok(Math.abs(pointerPos(s)) < DIAL_HALF);
  assert.equal(isLeveled(s), false);
  let last = lean(s);
  for (let n = NUT_START + 1; n <= NUT_BAL; n++) {
    s = adjustNut(s, 1).state;
    assert.ok(lean(s) < last);
    last = lean(s);
  }
  assert.equal(s.nut, NUT_BAL);
  assert.equal(pointerPos(s), 0);
  assert.equal(balanced(s), true);
  assert.equal(isLeveled(s), true);
  // 调过头：指针偏右
  assert.ok(pointerPos(adjustNut(s, 1).state) > 0);
  // 不会调出范围
  assert.equal(adjustNut({ ...s, nut: NUT_MAX }, 1).state.nut, NUT_MAX);
  assert.ok(balanceHint(initialState()).includes('右调'));
});

test('游码不在零刻度线时调螺母会被提示', () => {
  const s = { ...initialState(), rider: 5 };
  assert.equal(adjustNut(s, 1).warn, true);
  assert.equal(adjustNut({ ...s, rider: 0 }, 1).warn, false);
  assert.equal(isLeveled({ ...s, nut: NUT_BAL }), false);
  assert.ok(balanceHint({ ...s, nut: NUT_BAL }).includes('游码'));
});

test('砝码盒 + 游码：0.2 g 的整数倍、不超过 205 g 的质量都能配平', () => {
  assert.equal(RIDER_MAX * RIDER_DIV, 5);
  for (let u = 0; u <= 2050; u += 2) {
    const sol = solveWeights(u / 10);
    assert.ok(sol, `${u / 10} g`);
    const total = WEIGHTS.reduce((a, w, i) => a + (sol.weights[i] ? w : 0), 0) * 10 + sol.rider * 2;
    assert.equal(total, u);
  }
  assert.equal(solveWeights(0.3), null, '0.3 g 超出游码分度值');
});

test('石块 62.4 g：砝码加游码正好配平，读数正确，螺母没调好则不算', () => {
  const base = { ...initialState('stone'), onPan: true };
  const ok = withScale(base, 62.4);
  assert.equal(panMassU(ok), 624);
  assert.equal(balanced(ok), true);
  assert.equal(pointerPos(ok), 0);
  assert.equal(reading(ok), 62.4);
  assert.equal(measurement(ok), 62.4);
  // 少一点：指针偏左；多一点：偏右
  assert.ok(pointerPos({ ...ok, rider: ok.rider - 1 }) < 0);
  assert.ok(pointerPos({ ...ok, rider: ok.rider + 1 }) > 0);
  assert.equal(measurement({ ...ok, rider: ok.rider + 1 }), null);
  assert.equal(measurement({ ...ok, nut: NUT_START }), null);
  assert.equal(measurement({ ...ok, onPan: false }), null);
});

test('盐水：杯和盐水、倒出任意体积后的剩余，都能配平', () => {
  const base = { ...initialState('brine'), onPan: true };
  const full = withScale(base, 107.4);
  assert.equal(measurement(full), 107.4);
  for (let v = 1; v <= BRINE.volume0; v++) {
    const s = { ...base, poured: v };
    const mass = gOf(panMassU(s));
    assert.ok(Number.isFinite(mass) && mass > 0);
    const w = withScale(s, mass);
    assert.equal(balanced(w), true, `倒出 ${v} mL，剩 ${mass} g`);
    assert.equal(measurement(w), mass);
    // 倒出的盐水质量 = 1.2 g/cm³ × V
    assert.equal(Number((107.4 - mass).toFixed(1)), Number((BRINE.rho * v).toFixed(1)));
  }
});

test('量筒：读数落在 1 mL 刻度上，石块体积 = 放入前后读数之差', () => {
  assert.equal(CYL_DIV, 1);
  let s = initialState('stone');
  assert.equal(Number.isInteger(cylinderReading(s)), true);
  // 水太少浸不没、太多会超量程
  assert.equal(dropStone(pourWater(s, STONE_MIN_WATER - 1 - s.water)).problem, 'low');
  assert.equal(dropStone({ ...s, water: STONE_MAX_WATER + 1 }).problem, 'high');
  // 倒水：+10、+1 都到得了每一个刻度
  let w = { ...s, water: 0 };
  for (let i = 0; i < 5; i++) w = pourWater(w, 10);
  w = pourWater(w, 1);
  assert.equal(cylinderReading(w), 51);
  const d = dropStone(w);
  assert.equal(d.problem, null);
  assert.equal(cylinderReading(d.state), 51 + STONE.volume);
  assert.equal(cylinderReading(d.state) - cylinderReading(w), STONE.volume);
  assert.ok(cylinderReading(d.state) <= CYL_MAX);
  // 放着石块时不能再倒水
  assert.equal(pourWater(d.state, 10).water, w.water);
  assert.equal(cylinderReading(takeStone(d.state)), 51);
  // 盐水：必须先称过杯和盐水总质量才能倒
  const b = initialState('brine');
  assert.equal(pourBrine(b, 10, false).poured, 0);
  assert.equal(pourBrine(b, 10, true).poured, 10);
  assert.equal(pourBrine({ ...b, poured: 58 }, 10, true).poured, BRINE.volume0);
  assert.equal(cylinderReading(pourBrine(b, 25, true)), 25);
});

test('石块：算出的密度 = 设定值 2.6 g/cm³，任务全部能完成', () => {
  let rec = emptyRecords();
  let s = initialState('stone');
  assert.equal(taskStatus(rec, false).level, false);
  while (s.nut < NUT_BAL) s = adjustNut(s, 1).state;
  const leveled = isLeveled(s);
  assert.equal(leveled, true);
  s = withScale({ ...s, onPan: true }, 62.4);
  rec = updateRecords(rec, s);
  s = { ...s, water: 50 };
  const d = dropStone(s).state;
  rec = updateRecords(rec, d);
  const r = stoneResult(rec);
  assert.deepEqual(r, { m: 62.4, V: 24, rho: 2.6 });
  assert.equal(r.rho, STONE.massU / 10 / STONE.volume);
  const t = taskStatus(rec, leveled);
  assert.equal(t.level && t.mass && t.volume && t.stone, true);
  assert.equal(t.brine, false);
});

test('盐水：按课本顺序测 m₁ → 倒入量筒读 V → 测 m₂，密度 = 设定值 1.2 g/cm³', () => {
  let rec = emptyRecords();
  let s = { ...initialState('brine'), nut: NUT_BAL, onPan: true };
  s = withScale(s, 107.4);
  rec = updateRecords(rec, s);
  assert.equal(rec.brine.m1, 107.4);
  assert.equal(brineResult(rec), null);
  // 倒出 40 mL，称剩余
  s = { ...s, poured: 0 };
  s = pourBrine(pourBrine(pourBrine(pourBrine(s, 10, true), 10, true), 10, true), 10, true);
  assert.equal(cylinderReading(s), 40);
  s = withScale(s, gOf(panMassU(s)));
  rec = updateRecords(rec, s);
  assert.equal(rec.brine.m2, 59.4);
  const r = brineResult(rec);
  assert.deepEqual(r, { m1: 107.4, m2: 59.4, m: 48, V: 40, rho: 1.2 });
  assert.equal(r.rho, BRINE.rho);
  assert.ok(r.V >= POUR_MIN);
  assert.equal(taskStatus(rec, true).brine, true);
  // 倒出量不够 20 mL 时不算完成
  const small = { ...rec, brine: { m1: 107.4, V: 10, m2: 95.4 } };
  assert.equal(taskStatus(small, true).brine, false);
});

test('称量中指针方向：右盘不够偏左，砝码太重偏右', () => {
  const s = withScale({ ...initialState('stone'), onPan: true }, 62.4);
  const light = { ...s, weights: s.weights.map(() => false), rider: 0 };
  assert.ok(pointerPos(light) < 0);
  assert.ok(balanceHint(light).includes('偏向左'));
  const heavy = { ...s, weights: [true, true, true, true, true, true], rider: 0 };
  assert.ok(pointerPos(heavy) > 0);
  assert.ok(balanceHint(heavy).includes('偏向右'));
  assert.ok(pointerPos(light) >= -DIAL_HALF && pointerPos(heavy) <= DIAL_HALF);
});
