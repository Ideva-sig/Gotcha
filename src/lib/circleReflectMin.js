// 圆内“将军饮马”：P 在直径 AB 上移动，求 PC + PD (+ CD) 的最小值。
// 坐标：圆心 O 在原点，AB 在 x 轴上（A 在左），C、D 用从 B 起算、逆时针的角度给出，须在 AB 同侧（上方）。
export function circleReflectSetup({ radius, C, D }) {
  if (!Number.isFinite(radius) || radius <= 0) throw new Error('半径无效');
  if (![C, D].every((a) => Number.isFinite(a) && a > 0 && a < 180) || C === D) throw new Error('C、D 须在 AB 上方的半圆上且不重合');
  const at = (deg) => ({ x: radius * Math.cos(deg * Math.PI / 180), y: radius * Math.sin(deg * Math.PI / 180) });
  const c = at(C), d = at(D);
  const c2 = { x: c.x, y: -c.y }; // C 关于 AB 的对称点 C′
  const t = c.y / (c.y + d.y);    // 线段 C′D 与 AB 的交点
  const best = c2.x + t * (d.x - c2.x);
  return { radius, A: { x: -radius, y: 0 }, B: { x: radius, y: 0 }, C: c, D: d, C2: c2, bestX: best };
}

const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

export function circleReflectAt(setup, x) {
  const p = { x: Math.max(-setup.radius, Math.min(setup.radius, x)), y: 0 };
  const pc = dist(p, setup.C), pd = dist(p, setup.D), cd = dist(setup.C, setup.D);
  return { P: p, pc, pd, cd, perimeter: pc + pd + cd };
}

export function circleReflectMinimum(setup) {
  const at = circleReflectAt(setup, setup.bestX);
  return { ...at, c2d: dist(setup.C2, setup.D) };
}
