// 浮力与液体密度：照 2024 广州第 6 题（Q-PHY-GZ2024-06）。潜水艇完全浸没，体积不变，
// 从高密度海水驶入低密度海水：F浮 = ρ液·g·V排，ρ液 变小，浮力变小；排开液体的重力等于浮力，也变小。
// 重力取“在起始密度处刚好悬浮”时的浮力，只是示意数值。
export const G_N = 10;
export function buoyancySetup({ rho, min = 1.0, max = 1.06, step = 0.01, V = 2 }) {
  if (![rho, min, max, step, V].every((v) => Number.isFinite(v) && v > 0) || !(max > min) || rho < min || rho > max) {
    throw new Error('rho 要在 min–max 之间，其余为正数');
  }
  return { rho, min, max, step, V, weight: rho * 1000 * G_N * V };
}

// ρ 的单位 g/cm³，V 的单位 m³，结果用牛。
export function buoyancyAt(setup, rho) {
  const F = rho * 1000 * G_N * setup.V;
  const deficit = Math.max(0, (setup.weight - F) / setup.weight);
  return { rho, F, weight: setup.weight, displaced: F, sinking: F < setup.weight - 1e-6, deficit };
}

export const BUOY_VIEW = { w: 560, h: 340 };
// 潜水艇中心高度：悬浮在 y=130，浮力少得越多沉得越低（示意，最多下沉 130）。
export const subY = (deficit, full = 0.03) => 130 + 130 * Math.min(1, deficit / full);
