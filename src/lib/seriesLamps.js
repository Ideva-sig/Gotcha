// 两个灯泡串联：拖电源电压，看电流、两灯各自的亮度。照 2023 广东第 14 题（L1“2.5 V 0.3 A”、L2“6 V 0.15 A”）。
// 灯丝电阻按额定值算 R = U额 / I额 并视为不变；串联电流处处相等 I = U / (R1 + R2)。
export const SERIES_VIEW = { w: 560, h: 270 };
// 版面：电流方向从电源正极（左边长板）向上，经上边两灯，从右边下来，过下边电流表回到负极。
export const SERIES = { left: 50, right: 510, top: 50, bottom: 210, supplyY: 130, lamps: [200, 360], lampR: 24, ammeter: 280, ammeterR: 18 };

export function seriesSetup({ l1v, l1a, l2v, l2a, max, step = 0.25 }) {
  const lamps = [[l1v, l1a], [l2v, l2a]].map(([v, a], i) => {
    if (!(v > 0 && a > 0)) throw new Error('灯泡额定电压、额定电流须为正数');
    return { name: `L${i + 1}`, V: v, A: a, R: v / a };
  });
  const total = lamps[0].R + lamps[1].R;
  const first = lamps[0].A <= lamps[1].A ? 0 : 1; // 额定电流小的灯先正常发光
  const Ufirst = lamps[first].A * total;
  const top = max === undefined ? Math.ceil(Ufirst * 1.1) : max;
  if (!(step > 0) || !(top > Ufirst)) throw new Error('电压上限要大于先正常发光时的电源电压');
  return { lamps, total, first, Ufirst, max: top, step };
}

export function seriesAt(setup, U) {
  const I = U / setup.total;
  const lamps = setup.lamps.map((l) => {
    const ratio = I / l.A;
    const state = ratio < 0.02 ? 'off' : Math.abs(ratio - 1) < 1e-9 ? 'normal' : ratio > 1 ? 'over' : 'dim';
    return { ...l, I, ratio, u: I * l.R, state };
  });
  return { U, I, lamps };
}

export const LAMP_STATE = { off: '不亮', dim: '比正常发光暗', normal: '正常发光', over: '超过额定，太亮（会烧坏）' };
// 灯泡发光：额定电流时最亮，超过也不再亮下去（图上只表示“亮”）。
export const glow = (ratio) => Math.min(1, ratio ** 1.6) * 0.9;
