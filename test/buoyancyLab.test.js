import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OBJECTS, LIQUIDS, H_MAX, H_MIN, H_BOTTOM, SCALE_MAX, BUCKET_WEIGHT,
  liquidOf, objectOf, readN, weightOf, volumeOf, immersedVolume, buoyancyOf, byWeighing,
  hangState, settle, floatDepth, maxHangDepth, collectedAfter, infoRow, overflowRow,
  addInfoRow, addOverflowRow, growsBeforeFull, constantAfterFull, changesWithLiquid,
  archimedesDone, sameVolumeSameBuoyancy, settleDone, settleKey,
} from '../src/lib/buoyancyLab.js';

const close = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);
const A = objectOf('A'), B = objectOf('B'), C = objectOf('C'), D = objectOf('D');
const water = liquidOf('water'), salt = liquidOf('salt'), alcohol = liquidOf('alcohol');

test('物重：G = ρVg，g 取 10 N/kg；挂得住（不超量程）', () => {
  close(weightOf(A), 1.35);
  close(weightOf(B), 4.45);
  close(weightOf(C), 2.7);
  close(weightOf(D), 0.55);
  assert.equal(volumeOf(C), 2 * volumeOf(A));
  for (const o of OBJECTS) assert.ok(weightOf(o) <= SCALE_MAX);
});

test('称重法：F浮 = G − F，浸没在水中的铝块 A 浮力 0.5 N', () => {
  const s = hangState(A, water, 5);
  close(s.Fb, 0.5);
  close(s.F, 0.85);
  assert.equal(s.readFb, 0.5);
  assert.equal(byWeighing(s.readG, s.readF), s.readFb);
  assert.equal(hangState(A, water, -1).readFb, 0); // 还没碰到水：示数就是物重
  assert.equal(hangState(A, water, -1).readF, 1.35);
  assert.equal(readN(0.87), 0.85);
  assert.equal(readN(1.0000001), 1);
});

test('浸没前：浸入体积越大，浮力越大（成正比）', () => {
  let last = -1;
  for (let h = 0; h <= 5; h += 0.5) {
    const s = hangState(A, water, h);
    assert.ok(s.Fb >= last - 1e-12);
    if (h > 0) assert.ok(s.Fb > last);
    last = s.Fb;
  }
  close(hangState(A, water, 2.5).Fb * 2, hangState(A, water, 5).Fb);
  assert.equal(immersedVolume(A, 2), 20);
  assert.equal(immersedVolume(A, -1), 0);
});

test('浸没后：浮力和深度无关', () => {
  const ref = hangState(A, salt, 5);
  for (let h = 5; h <= H_MAX; h += 0.5) {
    const s = hangState(A, salt, h);
    close(s.Fb, ref.Fb);
    assert.equal(s.readFb, ref.readFb);
    assert.equal(s.V, 50);
  }
});

test('换液体：密度越大，浮力越大；同体积的铝块、铜块浮力一样', () => {
  const fb = (l) => hangState(A, l, 5).Fb;
  assert.ok(fb(alcohol) < fb(water) && fb(water) < fb(salt));
  close(fb(alcohol), 0.4); close(fb(salt), 0.6);
  assert.equal(hangState(A, water, 5).readFb, hangState(B, water, 5).readFb);
  close(hangState(C, water, 5).Fb, 2 * hangState(A, water, 5).Fb);
});

test('阿基米德原理：溢水杯里 F浮 = G排', () => {
  for (const o of OBJECTS) {
    for (const l of LIQUIDS) {
      let col = 0;
      for (let h = H_MIN; h <= 6; h += 1) col = collectedAfter(col, immersedVolume(o, h));
      const row = overflowRow(o, l, 6, col);
      if (!row) continue;
      assert.equal(row.Fb, row.Gdisp, `${o.id} ${l.id}`);
      assert.equal(row.Gbucket, BUCKET_WEIGHT);
      close(row.Gtotal - row.Gbucket, row.Gdisp);
      close(row.Gdisp, buoyancyOf(l, volumeOf(o)));
    }
  }
  // 还没浸没、或小桶没收满，不记
  assert.equal(overflowRow(A, water, 3, 30), null);
  assert.equal(overflowRow(A, water, 6, 20), null);
  // 浸入过再提起来，小桶里的水不会回去
  assert.equal(collectedAfter(50, 10), 50);
});

test('松手：沉底、漂浮；会漂浮的物体细线压不下去', () => {
  assert.equal(settle(A, water, 5).state, 'sink');
  assert.equal(settle(A, water, 5).h, H_BOTTOM);
  assert.equal(settle(D, water, 5).state, 'sink');
  const f = settle(D, salt, 5);
  assert.equal(f.state, 'float');
  close(f.h, 5 * 1100 / 1200);
  // 漂浮时浮力等于重力
  close(buoyancyOf(salt, immersedVolume(D, f.h)), weightOf(D));
  assert.equal(floatDepth(A, water), null);
  assert.equal(maxHangDepth(A, water), H_MAX);
  assert.ok(maxHangDepth(D, salt) < 5);
  assert.equal(hangState(D, salt, maxHangDepth(D, salt)).readF, 0);
  assert.equal(settleDone([settleKey(D, water, 'sink'), settleKey(D, salt, 'float')]), true);
  assert.equal(settleDone([settleKey(D, water, 'sink')]), false);
});

test('记录表和任务判断', () => {
  let rows = [];
  for (const h of [1, 2, 3, 4, 5]) rows = addInfoRow(rows, infoRow(A, water, h));
  assert.ok(growsBeforeFull(rows));
  assert.ok(!constantAfterFull(rows));
  rows = addInfoRow(rows, infoRow(A, water, 8));
  assert.ok(constantAfterFull(rows));
  assert.ok(!changesWithLiquid(rows));
  rows = addInfoRow(rows, infoRow(A, salt, 5));
  assert.ok(changesWithLiquid(rows));
  assert.ok(!sameVolumeSameBuoyancy(rows));
  rows = addInfoRow(rows, infoRow(B, water, 5));
  assert.ok(sameVolumeSameBuoyancy(rows));
  // 同一格不重复；浸入不到 3 个深度不算
  assert.equal(addInfoRow(rows, infoRow(A, water, 5)).length, rows.length);
  assert.ok(!growsBeforeFull([infoRow(A, water, 1), infoRow(A, water, 2)]));
  // 浮力变大要靠读数相减得到的数：酒精里也是一路变大
  let al = [];
  for (const h of [1, 2, 3, 4, 5]) al = addInfoRow(al, infoRow(A, alcohol, h));
  assert.ok(growsBeforeFull(al));
  // 溢水杯
  let ov = [];
  ov = addOverflowRow(ov, overflowRow(A, water, 5, 50));
  assert.ok(!archimedesDone(ov));
  ov = addOverflowRow(ov, overflowRow(B, salt, 5, 50));
  assert.ok(archimedesDone(ov));
});
