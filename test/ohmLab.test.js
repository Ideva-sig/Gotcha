import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SOURCE_FIXED, RHEO_MAX, STEADY_U, RX_HIDDEN, R_FAULT, LAMP_U, LAMP_R_HOT, FAULTS, AMMETER, VOLTMETER,
  lampResistance, solveLamp, lampBrightness, meterRead, suggestSmaller, solveCircuit,
  rheostatNeeded, rheostatEnough, steadyHint, rheoAtMax, addRow, averageR, resistanceOf,
  doneA, doneB, doneRx, doneLamp, lampTrendUp, nextFault,
} from '../src/lib/ohmLab.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);
const R10 = { type: 'R', R: 10 };

test('串联电路里 I = U/R，变阻器分走一部分电压', () => {
  const s = solveCircuit({ Us: 4.5, Rp: 5, load: R10, closed: true });
  close(s.I, 0.3);
  close(s.Uv, 3);
  // 变阻器电阻变大，电流变小，电阻两端电压变小
  const s2 = solveCircuit({ Us: 4.5, Rp: 15, load: R10, closed: true });
  assert.ok(s2.I < s.I && s2.Uv < s.Uv);
  // 没有变阻器（模式 a）：电压表就是电源电压，I 和 U 成正比
  const a1 = solveCircuit({ Us: 1.5, Rp: 0, load: { type: 'R', R: 5 }, closed: true });
  const a2 = solveCircuit({ Us: 3, Rp: 0, load: { type: 'R', R: 5 }, closed: true });
  close(a1.Uv, 1.5);
  close(a2.I / a1.I, 2);
  // 开关断开：两表都是 0
  const open = solveCircuit({ Us: 4.5, Rp: 5, load: R10, closed: false });
  assert.equal(open.I, 0);
  assert.equal(open.Uv, 0);
});

test('保持电压不变：换大电阻，变阻器要接入更大的电阻', () => {
  const need = [5, 10, 15, 20, 25].map((R) => rheostatNeeded(SOURCE_FIXED, R, STEADY_U));
  for (let i = 1; i < need.length; i++) assert.ok(need[i] > need[i - 1]);
  close(need[0], 4);
  close(need[4], 20);
  // 按算出的电阻接入，电压表正好是 2.5 V
  for (const R of [5, 10, 15, 20, 25]) {
    const s = solveCircuit({ Us: SOURCE_FIXED, Rp: rheostatNeeded(SOURCE_FIXED, R, STEADY_U), load: { type: 'R', R }, closed: true });
    close(s.Uv, STEADY_U);
    close(s.I * R, STEADY_U);
  }
  // 换大电阻、变阻器不动：电压表示数变大
  const before = solveCircuit({ Us: SOURCE_FIXED, Rp: 4, load: { type: 'R', R: 5 }, closed: true });
  const after = solveCircuit({ Us: SOURCE_FIXED, Rp: 4, load: { type: 'R', R: 10 }, closed: true });
  assert.ok(after.Uv > before.Uv);
  assert.equal(steadyHint(after.Uv), 'higher');
  assert.equal(steadyHint(2.52), 'ok');
  assert.equal(steadyHint(2.2), 'lower');
});

test('变阻器的最大阻值够不够', () => {
  assert.ok(rheostatEnough(SOURCE_FIXED, 25, STEADY_U)); // 刚好 20 Ω
  assert.ok(!rheostatEnough(SOURCE_FIXED, 30, STEADY_U)); // 要 24 Ω
  assert.ok(!rheostatEnough(SOURCE_FIXED, 25, 2)); // 保持 2 V 要 31.25 Ω
  assert.ok(rheoAtMax(RHEO_MAX));
  assert.ok(!rheoAtMax(10));
});

test('电表：量程、最小分度、超量程', () => {
  const [a06, a3] = AMMETER;
  const [v3, v15] = VOLTMETER;
  let r = meterRead(a06, 0.237);
  assert.equal(r.text, '0.24');
  assert.ok(!r.over);
  assert.equal(meterRead(v3, 2.54).text, '2.5');
  assert.equal(meterRead(v15, 4.4).text, '4.5'); // 15 V 量程每格 0.5 V
  assert.equal(meterRead(a3, 0.9).text, '0.9');
  r = meterRead(a06, 0.9); // 4.5 V 接 5 Ω、变阻器 0
  assert.ok(r.over);
  assert.equal(r.text, '超量程');
  assert.ok(r.frac <= 1.05 && r.frac > 1);
  assert.ok(!meterRead(v3, 3).over);
  assert.ok(meterRead(v3, 3.01).over);
  assert.ok(suggestSmaller(VOLTMETER, 1, 2));
  assert.ok(!suggestSmaller(VOLTMETER, 1, 4));
  assert.ok(!suggestSmaller(VOLTMETER, 0, 0.2));
});

test('伏安法：多次测量求平均', () => {
  const rows = [];
  let acc = rows;
  for (const Rp of [6, 10, 20]) {
    const s = solveCircuit({ Us: SOURCE_FIXED, Rp, load: { type: 'R', R: RX_HIDDEN }, closed: true });
    const U = meterRead(VOLTMETER[0], s.Uv).reading;
    const I = meterRead(AMMETER[0], s.I).reading;
    acc = addRow(acc, { U, I, R: resistanceOf(U, I) }, 'U');
  }
  assert.equal(acc.length, 3);
  assert.ok(doneRx(acc));
  assert.ok(Math.abs(averageR(acc) - RX_HIDDEN) < 1); // 读数取到最小分度，平均值接近真值
  assert.equal(averageR([]), null);
  assert.ok(!doneRx(acc.slice(0, 2)));
  // 同一个电压只留最新一行
  const dup = addRow(acc, { U: acc[0].U, I: 1, R: 1 }, 'U');
  assert.equal(dup.length, 3);
});

test('小灯泡：电阻随亮度（温度）升高而变大', () => {
  close(lampResistance(LAMP_U), LAMP_R_HOT);
  let last = 0;
  for (let U = 0.1; U <= 3; U += 0.1) {
    const r = lampResistance(U);
    assert.ok(r > last);
    last = r;
  }
  // 变阻器电阻变小：灯泡两端电压、电流、亮度、电阻一起变大
  const dim = solveLamp(SOURCE_FIXED, 20);
  const mid = solveLamp(SOURCE_FIXED, 8);
  assert.ok(mid.U > dim.U && mid.I > dim.I);
  assert.ok(mid.U / mid.I > dim.U / dim.I);
  assert.ok(lampBrightness(mid.U, mid.I) > lampBrightness(dim.U, dim.I));
  // 正常发光：2.5 V 时约 0.28 A（课本 p.104）
  const s = solveLamp(SOURCE_FIXED, (SOURCE_FIXED - LAMP_U) / (LAMP_U / LAMP_R_HOT));
  close(s.U, LAMP_U, 1e-6);
  close(s.I, 0.28, 0.005);
  close(lampBrightness(s.U, s.I), 1, 1e-6);
  // 电路求解和 solveLamp 一致，也不是定值
  const c = solveCircuit({ Us: SOURCE_FIXED, Rp: 8, load: { type: 'lamp' }, closed: true });
  close(c.Uv, mid.U);
  assert.ok(c.brightness > 0);
  // 记录判断
  const rows = [0.6, 1.2, 1.8, 2.4].map((Up) => ({ U: Up, I: 1, R: lampResistance(Up) }));
  assert.ok(doneLamp(rows));
  assert.ok(lampTrendUp(rows));
  assert.ok(!doneLamp(rows.slice(0, 3).map((r) => ({ ...r, U: 1 + r.U / 10 }))));
});

test('电路故障：两表示数能区分', () => {
  const sol = (fault, Rp = 8) => solveCircuit({ Us: SOURCE_FIXED, Rp, load: { type: 'R', R: R_FAULT }, closed: true, fault });
  const normal = sol(null);
  // 电阻断路：电流表几乎 0，电压表接近电源电压
  const open = sol('loadOpen');
  assert.ok(open.I < 0.005);
  assert.equal(meterRead(AMMETER[0], open.I).text, '0.00');
  assert.ok(Math.abs(open.Uv - SOURCE_FIXED) < 0.05);
  assert.equal(meterRead(VOLTMETER[1], open.Uv).text, '4.5');
  assert.ok(meterRead(VOLTMETER[0], open.Uv).over); // 4.5 V 超过 3 V 量程
  // 电阻短路：电压表 0，电流表比正常大
  const short = sol('loadShort');
  assert.equal(short.Uv, 0);
  assert.ok(short.I > normal.I);
  // 其他地方断路：两表都是 0
  const rest = sol('restOpen');
  assert.equal(rest.I, 0);
  assert.equal(rest.Uv, 0);
  // 电压表断开：电流表正常，电压表 0
  const vo = sol('voltOpen');
  close(vo.I, normal.I);
  assert.equal(vo.Uv, 0);
  // 变阻器接上面两个：电阻 0，移动滑片示数不变，且比正常大
  const top1 = sol('rheoTop', 5);
  const top2 = sol('rheoTop', 15);
  close(top1.I, top2.I);
  close(top1.Uv, SOURCE_FIXED);
  assert.ok(top1.I > normal.I);
  // 变阻器接下面两个：电阻最大，示数不变且较小
  const b1 = sol('rheoBottom', 2);
  const b2 = sol('rheoBottom', 18);
  close(b1.I, b2.I);
  close(b1.I, SOURCE_FIXED / (R_FAULT + RHEO_MAX));
  assert.ok(b1.I < normal.I);
  // 开关断开时任何故障都看不出来
  assert.equal(solveCircuit({ Us: 4.5, Rp: 8, load: R10, closed: false, fault: 'loadShort' }).I, 0);
  // 六种故障的两表示数组合互不相同（0 / 大 / 小 的粗分类 + 滑片是否有用）
  assert.equal(FAULTS.length, 6);
  assert.equal(new Set(FAULTS.map((f) => f.id)).size, 6);
  for (const f of FAULTS) assert.ok(f.choice && f.why);
});

test('换故障：不重复当前这个，先出没判断对的', () => {
  const ids = FAULTS.map((f) => f.id);
  for (let i = 0; i < 20; i++) {
    const f = nextFault('loadOpen', [], i / 20);
    assert.notEqual(f.id, 'loadOpen');
  }
  const solved = ids.filter((id) => id !== 'rheoTop' && id !== 'loadOpen');
  assert.equal(nextFault('loadOpen', solved, 0.99).id, 'rheoTop');
  assert.notEqual(nextFault('loadOpen', ids, 0.5).id, 'loadOpen'); // 全对了也能继续换
});

test('任务条件', () => {
  const U = (arr) => arr.map((u) => ({ U: u, I: u / 10 }));
  assert.ok(doneA(U([0.5, 1, 1.5, 2, 3])));
  assert.ok(!doneA(U([0.5, 1, 1.5, 2])));
  assert.ok(!doneA(U([1, 1.5, 2, 2.5, 2.9]))); // 电压只跨 1.9 V
  assert.ok(doneB([{ R: 5 }, { R: 10 }, { R: 15 }, { R: 20 }]));
  assert.ok(!doneB([{ R: 5 }, { R: 10 }, { R: 15 }]));
});
