import assert from 'node:assert/strict';
import test from 'node:test';
import { F, LENS_X, OBJ_MIN, OBJ_MAX, SCREEN_MIN, SCREEN_MAX, SCREEN_STEP, imageOf, regionOf, screenView, recordRow, addRecord, objU, screenS, snap } from '../src/lib/lensLab.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

test('成像规律和课本一致', () => {
  const far = imageOf(30);
  assert.equal(far.kind, 'real');
  assert.equal(far.size, '缩小');
  assert.ok(far.v > F && far.v < 2 * F);
  const eq = imageOf(2 * F);
  assert.equal(eq.size, '等大');
  close(eq.v, 2 * F);
  const big = imageOf(15);
  assert.equal(big.size, '放大');
  assert.ok(big.v > 2 * F);
  const vir = imageOf(5);
  assert.equal(vir.kind, 'virtual');
  assert.equal(vir.upright, true);
  assert.equal(vir.size, '放大');
  assert.equal(imageOf(F).kind, 'none');
  assert.deepEqual([30, 20, 15, 10, 5].map(regionOf), ['gt2f', 'eq2f', 'f2f', 'eqf', 'ltf']);
});

test('物近像远像变大（实像）', () => {
  let lastV = 0, lastM = 0;
  for (let u = 45; u > F; u -= 1) {
    const img = imageOf(u);
    assert.ok(img.v > lastV && img.m > lastM);
    lastV = img.v; lastM = img.m;
  }
});

test('每个能成实像且像在光具座上的物距，光屏都能挪到清晰位置', () => {
  for (let pos = OBJ_MIN; pos <= OBJ_MAX; pos++) {
    const u = objU(pos);
    const img = imageOf(u);
    if (img.kind !== 'real' || LENS_X + img.v > SCREEN_MAX) continue;
    const s = screenS(snap(LENS_X + img.v, SCREEN_STEP));
    assert.ok(LENS_X + s >= SCREEN_MIN);
    assert.ok(screenView(u, s).sharp, `u=${u}`);
  }
});

test('光屏偏离像的位置就模糊，虚像接不到', () => {
  assert.ok(screenView(30, 10).blur > 0 && !screenView(30, 10).sharp);
  assert.ok(screenView(30, 10).behind);
  assert.ok(screenView(5, 20).patch);
  assert.equal(recordRow(5, 20, false), null);
  assert.equal(recordRow(5, 20, true).nature, '虚像');
});

test('记录表：同一物距只留一行，按物距从大到小', () => {
  let rows = [];
  rows = addRecord(rows, recordRow(15, 30, false));
  rows = addRecord(rows, recordRow(30, 15, false));
  rows = addRecord(rows, recordRow(30, 15, false));
  rows = addRecord(rows, recordRow(30, 14, false)); // 不清晰，不记
  assert.deepEqual(rows.map((r) => r.u), [30, 15]);
});
