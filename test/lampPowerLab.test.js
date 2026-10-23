import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SOURCE, RHEO_MAX, RHEO_STEP, LAMP_U, VOLTMETER, AMMETER, RATED_P,
  solveLampCircuit, brightWord, closeWarning, voltageKind, readingAt, makeRow, meterRead,
  doneSafe, doneRated, doneLow, doneHigh, doneCompare, ratedPower, addRow,
} from '../src/lib/lampPowerLab.js';

// 滑片能停的每一格（步长 0.1 Ω）
const steps = Array.from({ length: Math.round(RHEO_MAX / RHEO_STEP) + 1 }, (_, i) => Math.round(i * RHEO_STEP * 10) / 10);
const at = (Rp) => {
  const s = solveLampCircuit({ Rp, closed: true });
  return { ...s, Ur: meterRead(VOLTMETER[0], s.U).reading, Ir: meterRead(AMMETER[0], s.I).reading };
};

test('开关断开：两表和灯都没有示数；闭合后变阻器越大、灯越暗', () => {
  const open = solveLampCircuit({ Rp: 5, closed: false });
  assert.deepEqual(open, { I: 0, U: 0, brightness: 0 });
  const a = solveLampCircuit({ Rp: 3, closed: true });
  const b = solveLampCircuit({ Rp: 12, closed: true });
  assert.ok(a.U > b.U && a.I > b.I && a.brightness > b.brightness);
});

test('滑片有一格能让电压表读数正好 2.5 V，此时电流约 0.28 A，功率约 0.70 W', () => {
  const hit = steps.filter((Rp) => at(Rp).Ur === LAMP_U);
  assert.ok(hit.length >= 1, '找不到让电压表读 2.5 V 的位置');
  const m = at(hit[0]);
  assert.equal(m.Ir, 0.28);
  assert.equal(makeRow(m.Ur, m.Ir, m.brightness).P, 0.7);
  assert.equal(brightWord(m.brightness), '正常发光');
  assert.ok(Math.abs(RATED_P - 0.7) < 0.01);
  assert.equal(voltageKind(m.Ur), 'rated');
});

test('能读到低于 2.5 V 和 2.5～3.0 V 之间的读数，也有会超过 3.0 V 的位置', () => {
  const rs = steps.map((Rp) => at(Rp).Ur);
  assert.ok(rs.some((u) => u > 0 && u < LAMP_U));
  assert.ok(rs.some((u) => u > LAMP_U && u <= 3.0 + 1e-9));
  assert.ok(rs.some((u) => u > 3.0));
  // 最大阻值处灯偏暗，但电压表有读数
  assert.ok(readingAt(RHEO_MAX) > 0 && readingAt(RHEO_MAX) < LAMP_U);
  // 滑片每动一格，电压表读数不会跳过 2.5 V 这一档以外的很多（相邻两格最多差 0.1 V）
  for (let i = 1; i < steps.length; i++) assert.ok(Math.abs(rs[i] - rs[i - 1]) <= 0.1 + 1e-9);
});

test('三档亮度文字都能出现，电压越高灯越亮', () => {
  const words = new Set(steps.map((Rp) => brightWord(solveLampCircuit({ Rp, closed: true }).brightness)));
  for (const w of ['较暗', '正常发光', '较亮']) assert.ok(words.has(w), `缺少 ${w}`);
  assert.equal(brightWord(0), '不亮');
  // 亮度档随电压不降
  const order = { 不亮: 0, 较暗: 1, 正常发光: 2, 较亮: 3 };
  let last = 0;
  for (const Rp of [...steps].reverse()) {
    const lv = order[brightWord(solveLampCircuit({ Rp, closed: true }).brightness)];
    assert.ok(lv >= last);
    last = lv;
  }
});

test('各档电压都落在 0～0.6 A 和 0～3 V 量程内可读（高于 3.0 V 的位置才超量程）', () => {
  for (const Rp of steps) {
    const s = solveLampCircuit({ Rp, closed: true });
    assert.ok(!meterRead(AMMETER[0], s.I).over);
    assert.equal(meterRead(VOLTMETER[0], s.U).over, s.U > 3 * (1 + 1e-9));
  }
  assert.ok(SOURCE > 3);
});

test('开关前滑片不在最大阻值处有提示，在最大阻值处没有', () => {
  assert.equal(closeWarning(RHEO_MAX), null);
  assert.ok(closeWarning(7.1).includes('最大'));
  assert.ok(closeWarning(0).length > 0);
  assert.ok(doneSafe(true) && !doneSafe(false));
});

test('电压分档：低于、正好、略高于、超过 3.0 V', () => {
  assert.equal(voltageKind(0), 'none');
  assert.equal(voltageKind(1.8), 'low');
  assert.equal(voltageKind(2.5), 'rated');
  assert.equal(voltageKind(2.8), 'high');
  assert.equal(voltageKind(3.0), 'high');
  assert.equal(voltageKind(3.1), 'tooHigh');
});

test('任务：用真实滑片位置测出三组，就能完成比较；每个任务都做得到', () => {
  let rows = [];
  const record = (Rp) => {
    const m = at(Rp);
    rows = addRow(rows, makeRow(m.Ur, m.Ir, m.brightness), 'U');
  };
  // 低于 2.5 V：最大阻值处
  record(RHEO_MAX);
  assert.ok(doneLow(rows) && !doneRated(rows) && !doneCompare(rows));
  // 正好 2.5 V
  record(steps.find((Rp) => at(Rp).Ur === LAMP_U));
  assert.ok(doneRated(rows));
  assert.equal(ratedPower(rows), 0.7);
  // 略高于 2.5 V（不超过 3.0 V）：找一格读数在 2.7 V 附近
  const hi = steps.find((Rp) => at(Rp).Ur >= 2.7 && at(Rp).Ur <= 3.0);
  assert.ok(hi !== undefined);
  record(hi);
  assert.ok(doneHigh(rows));
  assert.ok(doneCompare(rows));
  // P 随电压增大，亮度档不降
  const s = [...rows].sort((a, b) => a.U - b.U);
  for (let i = 1; i < s.length; i++) assert.ok(s[i].P > s[i - 1].P);
  assert.deepEqual(s.map((r) => r.word).slice(-1), ['较亮']);
});

test('没有读数的行不算低于额定', () => {
  assert.ok(!doneLow([{ U: 0, I: 0, P: 0, word: '不亮' }]));
  assert.ok(!doneHigh([{ U: 3.2, I: 0.3, P: 0.96, word: '较亮' }]));
  assert.ok(!doneHigh([{ U: 2.6, I: 0.29, P: 0.75, word: '正常发光' }]));
});
