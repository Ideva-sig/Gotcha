// 凸透镜成像实验室的物理模型：光具座 0–100 cm，凸透镜固定在 50 cm 处，焦距 10 cm。
// 发光物体高 3 cm，中心和透镜中心同高。像的位置用薄透镜的关系算（只在程序里用，页面上不出现这个公式）；
// 光屏没放在像的位置时，像会模糊，模糊的程度按透镜口径估算。单位一律是 cm。

export const F = 10;
export const LENS_X = 50;
export const OBJ_H = 3;
export const APERTURE = 5; // 透镜口径，决定光屏偏离时像有多模糊
export const OBJ_MIN = 2; // 物体在光具座上能放的范围（刻度位置）
export const OBJ_MAX = 48;
export const SCREEN_MIN = 51;
export const SCREEN_MAX = 100;
export const SCREEN_STEP = 0.5;
export const SHARP_TOL = 0.26; // 光屏离像不到这么远，就算“清晰”（光屏每次挪 0.5 cm，总能落进来）

const EPS = 1e-9;

// 物距 u 对应的像。kind：real 实像 / virtual 虚像 / none 不成像（物体在焦点上）
export function imageOf(u) {
  if (Math.abs(u - F) < EPS) return { kind: "none" };
  const v = (u * F) / (u - F);
  if (v > 0) {
    const m = v / u;
    return { kind: "real", v, m, upright: false, size: sizeOf(m) };
  }
  const m = -v / u;
  return { kind: "virtual", v, m, upright: true, size: sizeOf(m) };
}

function sizeOf(m) {
  if (Math.abs(m - 1) < 1e-6) return "等大";
  return m > 1 ? "放大" : "缩小";
}

// 物距在哪个范围
export function regionOf(u) {
  if (Math.abs(u - 2 * F) < EPS) return "eq2f";
  if (u > 2 * F) return "gt2f";
  if (Math.abs(u - F) < EPS) return "eqf";
  if (u > F) return "f2f";
  return "ltf";
}

export const REGION_LABEL = {
  gt2f: "u > 2f",
  eq2f: "u = 2f",
  f2f: "f < u < 2f",
  eqf: "u = f",
  ltf: "u < f",
};

// 光屏在像距 s 处（光屏到透镜的距离）时，光屏上是什么样子。
// sharp：清晰；blur：模糊光斑的直径；scale：像相对物体的大小（用过光心的光线算）；patch：只有一片光，没有像
export function screenView(u, s) {
  const img = imageOf(u);
  if (img.kind === "real") {
    const blur = (APERTURE * Math.abs(s - img.v)) / img.v;
    const sharp = Math.abs(s - img.v) <= SHARP_TOL;
    return { sharp, blur: sharp ? 0 : blur, scale: s / u, patch: false, behind: img.v > s };
  }
  // 虚像或不成像：光经过透镜后是散开的或平行的，光屏上只有一片光
  const spread = img.kind === "none" ? APERTURE : APERTURE * (1 + s / -img.v);
  return { sharp: false, blur: spread, scale: 0, patch: true, behind: false };
}

// 把物体放在刻度 pos 处时的物距
export const objU = (pos) => LENS_X - pos;
// 光屏放在刻度 pos 处时，光屏到透镜的距离
export const screenS = (pos) => pos - LENS_X;

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const snap = (x, step) => Math.round(x / step) * step;

// 记录表里的一行（和课本 p.123 的表格同样的几列）
export function recordRow(u, s, looked) {
  const img = imageOf(u);
  if (img.kind === "real") {
    if (!screenView(u, s).sharp) return null;
    return { u, v: s, nature: "实像", size: img.size, orient: "倒立", region: regionOf(u) };
  }
  if (img.kind === "virtual" && looked) {
    return { u, v: null, nature: "虚像", size: img.size, orient: "正立", region: regionOf(u) };
  }
  return null;
}

// 新的一行放进记录表：同一个物距只留最新一行，按物距从大到小排（物体从远处移近）
export function addRecord(rows, row, max = 10) {
  if (!row) return rows;
  const same = rows.find((r) => r.u === row.u);
  if (same && same.v === row.v && same.nature === row.nature) return rows;
  const next = [...rows.filter((r) => r.u !== row.u), row].sort((a, b) => b.u - a.u);
  return next.length > max ? next.slice(next.length - max) : next;
}
