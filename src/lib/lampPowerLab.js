// 测量小灯泡的电功率实验室的物理模型：电源、开关、滑动变阻器、小灯泡、电流表串联，电压表并联在小灯泡两端。
// 小灯泡的数据（额定 2.5 V、灯丝电阻随电压变）直接用欧姆定律实验室里的那一个，两个实验室里是同一个灯泡。
// 电功率 P = UI 只在程序里用来算表里的 P；页面上只出现课本里的结论。
import {
  AMMETER, LAMP_I, LAMP_U, RHEO_MAX, RHEO_STEP, SOURCE_FIXED, VOLTMETER,
  addRow, clamp, lampBrightness, meterRead, rheoAtMax, snap, solveLamp, suggestSmaller,
} from "./ohmLab.js";

export { AMMETER, LAMP_U, RHEO_MAX, RHEO_STEP, VOLTMETER, addRow, clamp, meterRead, rheoAtMax, snap, suggestSmaller };

// ---------- 器材 ----------
export const SOURCE = SOURCE_FIXED; // 三节干电池 4.5 V
export const RATED_P = LAMP_U * LAMP_I; // 额定功率约 0.70 W（2.5 V × 0.28 A）
export const HIGH_LIMIT = 1.2; // 略高于额定：不超过额定电压的 1.2 倍（3.0 V），再高就不让记录
export const U_HIGH_MAX = LAMP_U * HIGH_LIMIT;

// ---------- 电路 ----------
// 返回 U（灯泡两端，也是电压表）、I（电流表）、brightness（实际功率 ÷ 额定功率）。开关断开时全是 0。
export function solveLampCircuit({ Rp, closed }) {
  if (!closed) return { I: 0, U: 0, brightness: 0 };
  const { U, I } = solveLamp(SOURCE, Rp);
  return { I, U, brightness: lampBrightness(U, I) };
}

// 灯的亮度档（文字）：比正常发光暗、正常发光、比正常发光亮
export function brightWord(b) {
  if (b < 0.03) return "不亮";
  if (b < 0.92) return "较暗";
  if (b <= 1.1) return "正常发光";
  return "较亮";
}

// 闭合开关前滑片应在最大阻值处；不在时给提示（返回提示文字，没问题返回 null）
export function closeWarning(Rp) {
  if (rheoAtMax(Rp)) return null;
  return "闭合开关前，滑片应该放在阻值最大的一端。这样电路里的电流最小，不容易损坏器材。这次先闭合了，下次记得先把滑片调到最右边。";
}

// 电压表读数（取到 0.1 V）落在哪一档，决定能不能记录、记成哪一类
// rated：正好 2.5 V；low：低于 2.5 V（且有读数）；high：2.5 V 以上、不超过 3.0 V；tooHigh：超过 3.0 V
export function voltageKind(Ureading) {
  if (Ureading > U_HIGH_MAX + 1e-9) return "tooHigh";
  if (Math.abs(Ureading - LAMP_U) < 1e-9) return "rated";
  if (Ureading > LAMP_U) return "high";
  if (Ureading > 0) return "low";
  return "none";
}

// 滑片在 Rp 时，用 3 V 量程的电压表读到什么（找“能不能调到”的任务用）
export function readingAt(Rp) {
  const s = solveLampCircuit({ Rp, closed: true });
  return meterRead(VOLTMETER[0], s.U).reading;
}

// ---------- 记录 ----------
// 表里一行：电压 U、电流 I（都是表上读到的）、P = UI（取两位小数）、亮度文字
export function makeRow(Ureading, Ireading, brightness) {
  return { U: Ureading, I: Ireading, P: Math.round(Ureading * Ireading * 100) / 100, word: brightWord(brightness) };
}

const hasKind = (rows, kind) => rows.some((r) => voltageKind(r.U) === kind);

// 任务完成条件
export const doneSafe = (safeClosed) => safeClosed; // ① 滑片在最大阻值处闭合了开关
export const doneRated = (rows) => hasKind(rows, "rated"); // ② 电压表正好 2.5 V 时记录过
export const doneLow = (rows) => hasKind(rows, "low"); // ③ 低于 2.5 V 记录过
export const HIGH_MIN = 2.7; // 高于额定的任务要读到 2.7 V 以上，灯才明显“较亮”
export const doneHigh = (rows) => rows.some((r) => voltageKind(r.U) === "high" && r.U >= HIGH_MIN - 1e-9); // ④ 2.7～3.0 V 记录过

// ⑤ 三种情况都有，而且电压越高，实际功率越大、灯越亮（按电压排好，P 不减，亮度档不降）
const LEVEL = { 不亮: 0, 较暗: 1, 正常发光: 2, 较亮: 3 };
export function doneCompare(rows) {
  if (!(doneRated(rows) && doneLow(rows) && doneHigh(rows))) return false;
  const s = [...rows].sort((a, b) => a.U - b.U);
  return s.every((r, i) => i === 0 || (r.P >= s[i - 1].P && LEVEL[r.word] >= LEVEL[s[i - 1].word]));
}

// 额定功率：电压表正好 2.5 V 那一行的 P
export function ratedPower(rows) {
  const r = rows.find((x) => voltageKind(x.U) === "rated");
  return r ? r.P : null;
}
