// 平面镜成像：照 2022 广东第 13 题（Q-PHY-GD2022-13）。物体离镜面 d，像在镜面另一侧同样远处（等距），像是虚像。
export function mirrorSetup({ d, min = 1, max = 8, step = 1 }) {
  if (![d, min, max, step].every((v) => Number.isFinite(v) && v > 0) || !(max > min) || d < min || d > max) {
    throw new Error('d 要在 min–max 之间，其余为正数');
  }
  return { d, min, max, step };
}

export const MIRROR_VIEW = { w: 560, h: 400 };
export const MIRROR = { surfaceY: 190, objX: 160, eye: { x: 500, y: 110 }, scale: 20 };

// 物在镜面上方 d 米，像在下方 d 米。反射点 O 在镜面上，使“物 → O → 眼”满足反射定律：
// 连接像和眼，与镜面的交点就是 O，眼看到像的方向正好沿 O → 眼 反向。
export function mirrorAt(setup, d) {
  const { surfaceY, objX, eye, scale } = MIRROR;
  const obj = { x: objX, y: surfaceY - d * scale }, img = { x: objX, y: surfaceY + d * scale };
  const t = (surfaceY - img.y) / (eye.y - img.y);
  const O = { x: img.x + (eye.x - img.x) * t, y: surfaceY };
  return { d, obj, img, O, objDist: d, imgDist: d };
}
