// 直线与圆的位置关系：照课本习题 30.1 第 1 题。Rt△ABC，∠C = 90°，AC、BC 已知，以 C 为圆心、r 为半径画圆，看它和 AB 的关系。
// 坐标（数学方向，y 向上）：C 在原点，A 在 (AC, 0)，B 在 (0, BC)。圆心到 AB 的距离 d = CH = AC·BC / AB（面积法）。
export function lineCircleSetup({ ac, bc, r = 2, max, min = 0.5, step = 0.1 }) {
  if (![ac, bc].every((v) => Number.isFinite(v) && v > 0)) throw new Error('ac、bc 须为正数');
  const hyp = Math.hypot(ac, bc), d = (ac * bc) / hyp;
  const top = max === undefined ? Math.ceil(d * 1.5) : max;
  if (![r, min, step, top].every(Number.isFinite) || !(step > 0) || !(min > 0) || !(top > d) || !(min < d) || r < min || r > top) {
    throw new Error('半径要在 min–max 之内，且 min < d < max');
  }
  return { ac, bc, hyp, d, r, min, max: top, step };
}

export const RELATION = { apart: '相离', tangent: '相切', cross: '相交' };

export function lineCircleAt(setup, r) {
  const { ac, bc, hyp, d } = setup;
  const rel = Math.abs(r - d) < 1e-9 ? 'tangent' : r > d ? 'cross' : 'apart';
  // 垂足 H：AB 上离 C 最近的点；AB 的单位方向向量 u
  const u = { x: -ac / hyp, y: bc / hyp };
  const H = { x: (bc * bc * ac) / (hyp * hyp), y: (ac * ac * bc) / (hyp * hyp) };
  const half = rel === 'cross' ? Math.sqrt(r * r - d * d) : 0;
  const hits = rel === 'apart' ? [] : rel === 'tangent' ? [H] : [{ x: H.x - u.x * half, y: H.y - u.y * half }, { x: H.x + u.x * half, y: H.y + u.y * half }];
  return { r, d, rel, H, hits, A: { x: ac, y: 0 }, B: { x: 0, y: bc }, C: { x: 0, y: 0 } };
}

// 互动图和静态图共用的版面：按圆能画到的最大半径留够位置。
export const LC_VIEW = { w: 560, h: 400 };
export function lineCircleProject(setup) {
  const xmin = -setup.max - 0.3, xmax = Math.max(setup.ac, setup.max) + 0.9;
  const ymin = -setup.max - 0.3, ymax = Math.max(setup.bc, setup.max) + 0.6;
  const S = Math.min(LC_VIEW.w / (xmax - xmin), LC_VIEW.h / (ymax - ymin));
  const ox = (LC_VIEW.w - S * (xmax - xmin)) / 2 - S * xmin, oy = (LC_VIEW.h - S * (ymax - ymin)) / 2 + S * ymax;
  return { S, p: (q) => ({ x: ox + q.x * S, y: oy - q.y * S }) };
}
