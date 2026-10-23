// 液体压强实验室的物理模型：U 形管压强计的探头放进大烧杯的液体里，
// 橡皮膜受到压强，U 形管两边液面出现高度差 Δh。
// 压强计是理想的：橡皮膜很软、管里的空气不漏，U 形管两边的液面各移动 Δh 的一半。
// 长度 cm，密度 kg/m³。深度 h 指橡皮膜中心到液面的距离（朝上、朝下、朝侧面都一样量到膜中心）。
// 液体内部压强 p = ρ液 g h，U 形管里的压强差 p = ρ管 g Δh，所以 Δh = ρ液 h / ρ管（g 约掉了，只在程序里用）。

export const RHO_U = 1000; // U 形管里装着红色的水
export const LIQUIDS = [
  { id: "water", name: "水", rho: 1000, rhoText: "1.0" },
  { id: "salt", name: "盐水", rho: 1200, rhoText: "1.2" },
  { id: "alcohol", name: "酒精", rho: 800, rhoText: "0.8" },
];
export const liquidOf = (id) => LIQUIDS.find((l) => l.id === id);

export const DIRECTIONS = [
  { id: "up", name: "朝上" },
  { id: "down", name: "朝下" },
  { id: "side", name: "朝侧面" },
];
export const directionOf = (id) => DIRECTIONS.find((d) => d.id === id);

export const DEPTH_MIN = 0; // 橡皮膜刚好在液面
export const DEPTH_MAX = 10;
export const DEPTH_STEP = 1; // 每次 1 cm
export const DEPTH_START = 0;
export const RECORD_MIN_DEPTH = 2; // 深度从 2 cm 起才记录（探头整个浸在液体里）
export const DH_STEP = 0.1; // Δh 读到 0.1 cm

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const snap = (x, step) => Math.round(x / step) * step;
export const clampDepth = (h) => clamp(snap(h, DEPTH_STEP), DEPTH_MIN, DEPTH_MAX);

// 两边液面高度差（cm）和读数（读到 0.1 cm，并去掉浮点误差）
export const deltaH = (liq, h) => (liq.rho * Math.max(0, h)) / RHO_U;
export const readDh = (x) => Number((Math.round(x / DH_STEP + 1e-9) * DH_STEP).toFixed(1));

// ---------- U 形管：液面高度（从刻度 0 算起，cm） ----------
export const U_TOP_H = 15; // 刻度尺最高 15 cm
export const U_MID_H = 8; // 探头没受压时，两边液面都在 8 cm
export const U_MARGIN = 0.5;
export const levelsOf = (dh) => ({ left: U_MID_H - dh / 2, right: U_MID_H + dh / 2 });
// 读数：和 Δh 一样读到 0.1 cm
export const readLevels = (dh) => {
  const l = levelsOf(dh);
  return { left: readDh(l.left), right: readDh(l.right), dh: readDh(dh) };
};

// ---------- 画面几何（像素，实验台 SVG 的 viewBox 是 VIEW_W × VIEW_H） ----------
export const VIEW_W = 520;
export const VIEW_H = 504;
export const SP = 12; // 烧杯里每厘米多少像素
export const YS = 250; // 液面
export const LIQUID_DEPTH = 14; // 烧杯里液体的深度 cm
export const BEAKER_BOTTOM_Y = YS + LIQUID_DEPTH * SP; // 杯底内侧
export const BEAKER_RIM_Y = 232;
export const BEAKER_X0 = 40;
export const BEAKER_X1 = 250;
export const PROBE_X = 150;
export const PROBE_R_CM = 1.2; // 探头（金属盒）半径
export const PROBE_R = PROBE_R_CM * SP;
export const STEM_DX = 12; // 朝上时，管子从探头左边绕出去的距离
export const ROD_TOP = 60;
export const U_BASE_Y = 420; // U 形管刻度 0 的位置
export const SPU = 14; // U 形管旁每厘米多少像素
export const U_LEFT_X = 350;
export const U_RIGHT_X = 406;

export const membraneY = (h) => YS + h * SP;
export const uY = (height) => U_BASE_Y - height * SPU;
export const U_TOP_Y = uY(U_TOP_H);

// 探头金属盒的位置：膜中心总在深度 h 处
export function probeBox(dir, h) {
  const ym = membraneY(h);
  const R = PROBE_R;
  if (dir === "up") return { cx: PROBE_X, cy: ym + R, top: ym, bottom: ym + 2 * R, left: PROBE_X - R - STEM_DX, right: PROBE_X + R };
  if (dir === "down") return { cx: PROBE_X, cy: ym - R, top: ym - 2 * R, bottom: ym, left: PROBE_X - R, right: PROBE_X + R };
  return { cx: PROBE_X, cy: ym, top: ym - R, bottom: ym + R, left: PROBE_X - R, right: PROBE_X + R };
}
export const stemX = (dir) => (dir === "up" ? PROBE_X - PROBE_R - STEM_DX : PROBE_X);

// 几何上限：最深处探头在杯里、U 形管两边液面在刻度范围里
export function maxLevelH() {
  return Math.max(...LIQUIDS.map((l) => levelsOf(deltaH(l, DEPTH_MAX)).right));
}
export function minLevelH() {
  return Math.min(...LIQUIDS.map((l) => levelsOf(deltaH(l, DEPTH_MAX)).left));
}

// 拖动：指针的 y 坐标换成膜中心的深度（吸附到整数厘米）
export const depthFromY = (y) => clampDepth((y - YS) / SP);

// ---------- 记录表和任务 ----------
export function record(liq, dir, h) {
  if (h < RECORD_MIN_DEPTH - 1e-9) return null;
  return { liq: liq.id, dir, h, dh: readDh(deltaH(liq, h)) };
}
const keyOf = (r) => `${r.liq}|${r.dir}|${r.h}`;
const MAX_ROWS = 24;
export function addRow(rows, row) {
  if (!row) return rows;
  if (rows.some((r) => keyOf(r) === keyOf(row))) return rows;
  const next = [...rows, row];
  return next.length > MAX_ROWS ? next.slice(next.length - MAX_ROWS) : next;
}

const groupBy = (rows, f) => {
  const g = {};
  for (const r of rows) (g[f(r)] ||= []).push(r);
  return Object.values(g);
};

// ① 同一种液体、同一深度，三个朝向都量过，Δh 一样大
export const directionsDone = (rows) =>
  groupBy(rows, (r) => `${r.liq}|${r.h}`).some(
    (g) => new Set(g.map((r) => r.dir)).size === DIRECTIONS.length && g.every((r) => r.dh === g[0].dh));

// ② 同一种液体、同一朝向，至少 3 个不同深度，越深 Δh 越大
export const depthDone = (rows) =>
  groupBy(rows, (r) => `${r.liq}|${r.dir}`).some((g) => {
    const s = [...g].sort((a, b) => a.h - b.h);
    return s.length >= 3 && s.every((r, i) => i === 0 || r.dh > s[i - 1].dh);
  });

// ③ 同一深度、同一朝向，至少 2 种液体，密度越大 Δh 越大
export const densityDone = (rows) =>
  groupBy(rows, (r) => `${r.dir}|${r.h}`).some((g) => {
    const s = g.map((r) => ({ rho: liquidOf(r.liq).rho, dh: r.dh })).sort((a, b) => a.rho - b.rho);
    return s.length >= 2 && s.every((x, i) => i === 0 || x.dh > s[i - 1].dh);
  });
