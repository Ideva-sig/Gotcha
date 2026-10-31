// 杠杆平衡：照 2022 广东第 21 题（Q-PHY-GD2022-21）第（2）问。
// 左边 A 处挂钩码（阻力 f1，到支点 l1 格）；右边在离支点 l2 格处竖直向下拉，要使杠杆水平平衡：f1·l1 = F·l2。
export function leverSetup({ f1, l1, l2, max = 4, hook = 0.5 }) {
  if (![f1, l1, l2, max, hook].every((v) => Number.isFinite(v) && v > 0)) throw new Error('f1、l1、l2、max、hook 须为正数');
  if (!Number.isInteger(l1) || !Number.isInteger(l2) || !Number.isInteger(max) || l1 > max + 2 || l2 > max || max > 6) throw new Error('格数要是整数，l2 不超过 max，max 不超过 6');
  return { f1, l1, l2, max, hook };
}

export function leverAt(setup, l2) {
  const F = (setup.f1 * setup.l1) / l2;
  return { l2, F, left: setup.f1 * setup.l1, right: F * l2 };
}

// 互动图和静态图共用的版面（viewBox 560 300）：每格 56 像素，支点在正中。
export const LEVER_VIEW = { w: 560, h: 300 };
export const LEVER = { fx: 280, beamY: 170, cell: 56, reach: 4, thick: 14, arrowPerN: 34 };
export const leverX = (cells, side) => LEVER.fx + (side === 'right' ? 1 : -1) * cells * LEVER.cell;
