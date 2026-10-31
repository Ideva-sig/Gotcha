// 地磅电路：照 2024 广州第 9 题。定值电阻 R0 与滑动变阻器 R 的全部阻值串联，
// 电压表接在变阻器上端和滑片 P 之间；车越重，P 越往下。
// 总电阻 R0 + R 不变，所以电流表示数不变；电压表测的那段电阻越长，示数越大。
export function weighbridgeSetup({ U, R0, R, p = 40 }) {
  if (![U, R0, R].every((v) => Number.isFinite(v) && v > 0)) throw new Error('U、R0、R 须为正数');
  if (!(p >= 0 && p <= 100)) throw new Error('p（滑片位置，百分数）须在 0–100');
  return { U, R0, R, p };
}

// p：滑片离变阻器上端的位置，0（最上端，未称量）到 100（最下端）。
export function weighbridgeAt(setup, p) {
  const { U, R0, R } = setup;
  const total = R0 + R, I = U / total, frac = p / 100;
  return { p, total, I, Rtop: R * frac, Uv: I * R * frac, UR0: I * R0 };
}

// 互动图和静态图共用的版面（viewBox 0 0 520 310）。电流从电源上端流出，经过 A、S、变阻器、R0 回到电源下端。
export const WB_VIEW = { w: 520, h: 310 };
export const WB = { cx: 212, top: 96, bottom: 246, halfW: 13, rodX: 52, V: { x: 128, y: 56 }, A: { x: 380, y: 56 }, R0: { x: 360, y: 280 } };
export const wbSlideY = (p) => WB.top + (WB.bottom - WB.top) * (p / 100);

export function weighbridgeLayout() {
  const { cx, top, bottom } = WB;
  const pts = (...q) => q.map((v, i) => `${i ? 'L' : 'M'}${v[0]} ${v[1]}`).join('');
  return {
    // 流动光点只走电流通过的导线（电压表支路电流可忽略）
    wires: [
      pts([470, 128], [470, 56], [cx, 56], [cx, top]),
      pts([cx, bottom], [cx, 280], [470, 280], [470, 172]),
    ],
    body: pts([cx, top], [cx, bottom]),
    sourceTerminals: [[470, 128], [470, 172]],
  };
}
