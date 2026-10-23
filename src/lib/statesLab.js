// 物态变化实验室的物理模型：一烧杯水（1 份质量）在标准大气压下吸热、放热。
// 输入是热量，温度是结果——熔化、沸腾、凝固时吸热或放热而温度不变，图像上出现水平段。
// 比热容、熔化热、汽化热按真实比例（冰 2.1、水 4.2、熔化 334、汽化 2260，单位统一后约去），
// 所以同样加热，冰升温比水快一倍。时间单位是“分钟”（图像横轴）。

export const C_ICE = 2.1;
export const C_WATER = 4.2;
export const L_MELT = 334;
export const L_BOIL = 2260;
export const MELT_T = 0;
export const BOIL_T = 100;
export const ROOM_T = 20;
export const FREEZER_T = -20;
export const START_T = -20;
export const FLAME_POWER = 42; // 只看火焰：1 份水从 0 °C 烧到 100 °C 约 10 分钟
export const ROOM_K = 0.15; // 和室温空气交换热量的快慢
export const FREEZER_K = 1.2; // 冰柜里放热的快慢
export const MAX_BOIL_LOSS = 0.3; // 烧掉三成水后自动熄火

const EPS = 1e-9;

export function initialLab() {
  return { t: 0, T: START_T, ice: 1, water: 0, boiled: 0 };
}

// 现在是哪种状态
export function phaseOf(s, mode) {
  if (s.ice > EPS && s.water > EPS) return "mixed";
  if (s.water <= EPS) return "solid";
  if (s.T >= BOIL_T - EPS && mode === "heat") return "boiling";
  return "liquid";
}

// 这一刻的吸热（正）或放热（负）快慢，单位：热量 / 分钟
export function heatRate(s, mode) {
  if (mode === "freezer") return -FREEZER_K * (s.T - FREEZER_T);
  const room = -ROOM_K * (s.T - ROOM_T);
  return mode === "heat" ? FLAME_POWER + room : room;
}

// 给烧杯里的东西加上热量 q（负数就是放出热量），按“先升温到转变点，再整段转变”的顺序处理
export function applyHeat(state, q) {
  const s = { ...state };
  let left = q;
  for (let guard = 0; guard < 8 && Math.abs(left) > EPS; guard++) {
    if (left > 0) {
      if (s.water <= EPS && s.T < MELT_T) {
        const need = C_ICE * s.ice * (MELT_T - s.T);
        if (left < need) { s.T += left / (C_ICE * s.ice); left = 0; } else { s.T = MELT_T; left -= need; }
      } else if (s.ice > EPS) {
        s.T = MELT_T;
        const melt = left / L_MELT;
        if (melt < s.ice) { s.ice -= melt; s.water += melt; left = 0; } else { s.water += s.ice; left -= s.ice * L_MELT; s.ice = 0; }
      } else if (s.T < BOIL_T) {
        const need = C_WATER * s.water * (BOIL_T - s.T);
        if (left < need) { s.T += left / (C_WATER * s.water); left = 0; } else { s.T = BOIL_T; left -= need; }
      } else {
        s.T = BOIL_T;
        const gone = Math.min(left / L_BOIL, s.water);
        s.water -= gone; s.boiled += gone; left = 0;
      }
    } else {
      const out = -left;
      if (s.ice <= EPS && s.T > MELT_T) {
        const have = C_WATER * s.water * (s.T - MELT_T);
        if (out < have) { s.T -= out / (C_WATER * s.water); left = 0; } else { s.T = MELT_T; left += have; }
      } else if (s.water > EPS) {
        s.T = MELT_T;
        const freeze = out / L_MELT;
        if (freeze < s.water) { s.water -= freeze; s.ice += freeze; left = 0; } else { s.ice += s.water; left += s.water * L_MELT; s.water = 0; }
      } else {
        s.T -= out / (C_ICE * s.ice); left = 0;
      }
    }
  }
  if (s.ice < EPS) s.ice = 0;
  if (s.water < EPS) s.water = 0;
  return s;
}

// 往前走 dt 分钟（内部切成 0.02 分钟的小步，接近室温、冰柜温度时不会冲过头）
export function stepLab(state, mode, dt) {
  let s = state;
  const n = Math.max(1, Math.ceil(dt / 0.02));
  const h = dt / n;
  for (let i = 0; i < n; i++) s = applyHeat(s, heatRate(s, mode) * h);
  s.t = state.t + dt;
  return s;
}

// 根据曲线找出水平段（熔化、沸腾、凝固），给图像标注用。points 里每个点是 { t, T, phase, q }
export function plateaus(points) {
  const out = [];
  let cur = null;
  for (const p of points) {
    const kind = p.phase === "mixed" ? (p.q < 0 ? "凝固" : "熔化") : p.phase === "boiling" ? "沸腾" : null;
    if (kind && cur && cur.kind === kind) { cur.t1 = p.t; continue; }
    if (cur) out.push(cur);
    cur = kind ? { kind, t0: p.t, t1: p.t, T: kind === "沸腾" ? BOIL_T : MELT_T } : null;
  }
  if (cur) out.push(cur);
  return out;
}
