// 图形旋转：照课本习题 28.1 第 7 题。Rt△ABC，∠C = 90°，BC、AC 已知，绕点 B 逆时针旋转 θ。
// 坐标（数学方向，y 向上）：C 在原点，A 在 (AC, 0)，B 在 (0, BC)，和课本图一致。
// 旋转的三条性质：对应点到旋转中心距离相等；每对对应点与中心的夹角都等于旋转角；图形的形状大小不变。
export function rotationSetup({ bc, ac, start = 90, min = 0, max = 180, step = 5 }) {
  if (![bc, ac].every((v) => Number.isFinite(v) && v > 0)) throw new Error('bc、ac 须为正数');
  if (![start, min, max, step].every(Number.isFinite) || !(step > 0) || !(min >= 0) || !(max <= 180) || !(max > min) || start < min || start > max) {
    throw new Error('旋转角要在 0–180 度之间，min < max，start 在范围内');
  }
  return { bc, ac, start, min, max, step };
}

const turn = (p, o, deg) => {
  const a = deg * Math.PI / 180, dx = p.x - o.x, dy = p.y - o.y;
  return { x: o.x + dx * Math.cos(a) - dy * Math.sin(a), y: o.y + dx * Math.sin(a) + dy * Math.cos(a) };
};
const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

export function rotationAt(setup, deg) {
  const C = { x: 0, y: 0 }, A = { x: setup.ac, y: 0 }, B = { x: 0, y: setup.bc };
  const A2 = turn(A, B, deg), C2 = turn(C, B, deg);
  return { deg, A, B, C, A2, C2, BA: dist(B, A), BA2: dist(B, A2), BC: dist(B, C), BC2: dist(B, C2), AA2: dist(A, A2), CC2: dist(C, C2) };
}

// 互动图和静态图共用的版面（viewBox 560 330）：每单位 28 像素，B 的上下左右都留够 5.5 个单位。
export const ROT_VIEW = { w: 560, h: 330 };
const S = 28;
export const rotProject = (p) => ({ x: 280 + p.x * S, y: 300 - (p.y + 1.6) * S });
// 旋转角的小圆弧：从 BA 方向转到 BA′ 方向（逆时针），半径 r 像素
export function rotationArc(state, r = 30) {
  const o = rotProject(state.B), a = rotProject(state.A), b = rotProject(state.A2);
  const u = (q) => { const l = Math.hypot(q.x - o.x, q.y - o.y); return { x: o.x + (q.x - o.x) / l * r, y: o.y + (q.y - o.y) / l * r }; };
  const p1 = u(a), p2 = u(b);
  return `M${p1.x.toFixed(1)} ${p1.y.toFixed(1)}A${r} ${r} 0 0 0 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}
