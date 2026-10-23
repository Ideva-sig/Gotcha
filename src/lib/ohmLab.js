// 欧姆定律实验室的物理模型：串联电路（电源、开关、滑动变阻器、被测电阻或小灯泡、电流表），电压表并联在被测部分两端。
// 电流表按理想的算（电阻为 0），电压表平时按理想的算；只有被测电阻断路时，才用电压表自己的大电阻 R_V 算（电流很小但不是 0）。
// 欧姆定律 I = U/R 只在程序里用；页面上只出现课本里的结论。电压 V、电流 A、电阻 Ω。

// ---------- 器材 ----------
export const SOURCE_FIXED = 4.5; // 三节干电池（模式 b、c、d）
export const SOURCE_MAX = 6; // 模式 a 的“实验电源”可调范围 0–6 V
export const SOURCE_STEP = 0.5;
export const RHEO_MAX = 20; // 滑动变阻器 0–20 Ω
export const RHEO_STEP = 0.1;
export const RA_OPTIONS = [5, 10, 15]; // 模式 a 可选的定值电阻
export const RB_OPTIONS = [5, 10, 15, 20, 25]; // 模式 b 换用的定值电阻（课本复习与提高 3 题也是 5～25 Ω）
export const STEADY_U = 2.5; // 模式 b 要保持的电压
export const U_TOL = 0.05; // 电压表读数四舍五入后等于 2.5 V，就算保持住了
export const RX_HIDDEN = 12; // 模式 c 里“未知”的待测电阻
export const R_FAULT = 10; // 模式 d 里的电阻（页面上写明）
export const R_V = 3000; // 电压表自身的电阻，只在被测电阻断路时用到

// 小灯泡：额定 2.5 V，正常发光时 0.28 A，约 8.9 Ω（课本 p.104）。灯丝越热电阻越大：
// 这里用“电阻随灯泡两端电压增大而增大”的简单关系，电压很小时约 2 Ω。
export const LAMP_U = 2.5;
export const LAMP_R_HOT = 8.9;
export const LAMP_R_COLD = 2;
export const LAMP_I = LAMP_U / LAMP_R_HOT;

export function lampResistance(U) {
  const x = Math.max(0, U) / LAMP_U;
  return LAMP_R_COLD + (LAMP_R_HOT - LAMP_R_COLD) * Math.pow(x, 0.7);
}

// 灯泡和滑动变阻器（Rp）串联在电压 Us 的电源上，解出灯泡两端的电压。灯泡电阻随电压变，所以用二分法逼近。
export function solveLamp(Us, Rp) {
  let lo = 0;
  let hi = Us;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const g = mid + (mid / lampResistance(mid)) * Rp - Us;
    if (g > 0) hi = mid;
    else lo = mid;
  }
  const U = (lo + hi) / 2;
  return { U, I: U / lampResistance(U) };
}

// 灯泡有多亮：实际功率 ÷ 额定功率（0–1.5 以上；> 1 说明比正常发光还亮）
export const lampBrightness = (U, I) => (U * I) / (LAMP_U * LAMP_I);

// ---------- 电表 ----------
// 每个量程：满偏值 max、最小分度 res、读几位小数 dec、数字标在哪些刻度（major）
export const AMMETER = [
  { max: 0.6, res: 0.02, read: 0.01, dec: 2, major: 0.2, label: "0～0.6 A" }, // 0.6 A 档每格 0.02 A，指针在两格中间时估读到 0.01 A
  { max: 3, res: 0.1, dec: 1, major: 1, label: "0～3 A" },
];
export const VOLTMETER = [
  { max: 3, res: 0.1, dec: 1, major: 1, label: "0～3 V" },
  { max: 15, res: 0.5, dec: 1, major: 5, label: "0～15 V" },
];

// 表盘上的读数。over：超过量程（指针打到头）；frac：指针位置（0–1，超量程时停在稍过满偏处）；text：读到最小分度（0.6 A 档估读到半格）。
export function meterRead(spec, value) {
  const v = Math.max(0, value);
  const over = v > spec.max * (1 + 1e-9);
  const frac = Math.min(v / spec.max, 1.05);
  const step = spec.read ?? spec.res;
  const reading = Math.round(v / step + 1e-9) * step;
  const fixed = Number(reading.toFixed(spec.dec));
  return { over, frac, reading: fixed, text: over ? "超量程" : fixed.toFixed(spec.dec) };
}

// 指针偏得太少（不到量程的 1/4）、而且还有更小的量程可换，就提示换小量程
export function suggestSmaller(specs, idx, value) {
  return idx > 0 && value > 0 && value < specs[idx].max * 0.25 && value <= specs[idx - 1].max;
}

// ---------- 电路 ----------
export const FAULTS = [
  { id: "loadOpen", choice: "被测电阻处断路了", why: "电压表和电流表、滑动变阻器串成了一条路：电压表电阻很大，电流小得几乎测不出，电流表几乎没有示数；电压表几乎分到了全部的电源电压，所以示数接近电源电压。" },
  { id: "loadShort", choice: "被测电阻被短路了", why: "电阻被导线短接，两端的电压是 0，电压表没有示数；电路里只剩滑动变阻器，总电阻变小，电流表示数比正常时大。" },
  { id: "restOpen", choice: "电阻以外的地方断路了（如导线、开关、滑动变阻器）", why: "电路没有接通：电流表没有示数。电压表和电源之间也被断开，电压表同样没有示数。" },
  { id: "voltOpen", choice: "电压表的接线断开了", why: "电路本身是通的，电流表有正常的示数；电压表没有接进电路，所以没有示数。" },
  { id: "rheoTop", choice: "滑动变阻器接了上面两个接线柱", why: "接了上面两个接线柱，相当于一根导线，电阻是 0 而且不变：电流较大，滑片怎么移动，两表的示数都不变。" },
  { id: "rheoBottom", choice: "滑动变阻器接了下面两个接线柱", why: "接了下面两个接线柱，整根电阻丝都接入电路，电阻最大而且不变：电流较小，滑片怎么移动，两表的示数都不变。" },
];

// 解电路。load：{ type: "R", R } 或 { type: "lamp" }；closed：开关是否闭合；fault：FAULTS 里的 id 或 null。
// 返回 I（电流表）、Uv（电压表）、Rp（实际接入的变阻器电阻）、brightness（灯泡亮度，只有灯泡才有）。
export function solveCircuit({ Us, Rp, load, closed, fault = null }) {
  const zero = { I: 0, Uv: 0, Rp, brightness: 0 };
  if (!closed || fault === "restOpen") return zero;
  let rp = Rp;
  if (fault === "rheoTop") rp = 0;
  if (fault === "rheoBottom") rp = RHEO_MAX;
  if (load.type === "lamp") {
    const { U, I } = solveLamp(Us, rp);
    return { I, Uv: U, Rp: rp, brightness: lampBrightness(U, I) };
  }
  const R = load.R;
  if (fault === "loadOpen") {
    const I = Us / (rp + R_V);
    return { I, Uv: Us - I * rp, Rp: rp, brightness: 0 };
  }
  if (fault === "loadShort") return { I: Us / Math.max(rp, 0.05), Uv: 0, Rp: rp, brightness: 0 };
  const I = Us / (R + rp);
  return { I, Uv: fault === "voltOpen" ? 0 : I * R, Rp: rp, brightness: 0 };
}

// 电阻 R 两端要保持电压 Uset，电源 Us，滑动变阻器要接入多大（串联分压）
export const rheostatNeeded = (Us, R, Uset) => (R * (Us - Uset)) / Uset;
export const rheostatEnough = (Us, R, Uset, max = RHEO_MAX) => rheostatNeeded(Us, R, Uset) <= max + 1e-9;

// 电压表读数和目标比：ok 保持住了；lower 偏小，要让变阻器电阻变小；higher 偏大，要让变阻器电阻变大
export function steadyHint(Uv, target = STEADY_U, tol = U_TOL) {
  if (Uv > target + tol) return "higher";
  if (Uv < target - tol) return "lower";
  return "ok";
}

// 变阻器是不是在最大阻值处（闭合开关前应该在这里）
export const rheoAtMax = (Rp) => Rp >= RHEO_MAX - 1e-9;

// ---------- 记录 ----------
// 往表里放一行：同一个键（电压或电阻）只留最新一行，按键从小到大排
export function addRow(rows, row, key, max = 8) {
  const next = [...rows.filter((r) => r[key] !== row[key]), row].sort((a, b) => a[key] - b[key]);
  return next.length > max ? next.slice(next.length - max) : next;
}

// 伏安法：用电表读到的 U、I 算电阻（读数已经取到最小分度，所以有一点误差）
export const resistanceOf = (U, I) => U / I;
export const round1 = (x) => Math.round(x * 10) / 10;

export function averageR(rows) {
  if (rows.length === 0) return null;
  return rows.reduce((s, r) => s + r.R, 0) / rows.length;
}

const span = (rows, key) => (rows.length === 0 ? 0 : Math.max(...rows.map((r) => r[key])) - Math.min(...rows.map((r) => r[key])));

// 任务完成的条件
export const doneA = (rows) => rows.length >= 5 && span(rows, "U") >= 2; // 5 组电压不同的数据，电压至少跨 2 V
export const doneB = (rows) => rows.length >= 4; // 4 个不同的电阻，每个都在 2.5 V 下记录
export const doneRx = (rows) => rows.length >= 3 && span(rows, "U") >= 0.5; // 3 次电压不同的测量
export const doneLamp = (rows) => rows.length >= 4 && span(rows, "U") >= 1;

// 小灯泡：电压越高电阻越大（按电压排好后，电阻不减）
export const lampTrendUp = (rows) => {
  const s = [...rows].sort((a, b) => a.U - b.U);
  return s.length >= 2 && s[s.length - 1].R > s[0].R + 0.5;
};

// 电路故障：随机换一个。尽量先出还没判断对的；rnd 是 0–1 的随机数
export function nextFault(currentId, solvedIds, rnd) {
  const others = FAULTS.filter((f) => f.id !== currentId);
  const fresh = others.filter((f) => !solvedIds.includes(f.id));
  const pool = fresh.length > 0 ? fresh : others;
  return pool[Math.min(pool.length - 1, Math.floor(rnd * pool.length))];
}

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const snap = (x, step) => Math.round(x / step) * step;
