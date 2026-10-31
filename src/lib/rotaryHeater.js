// 旋转开关多挡电热器：照 2024 广州第 15 题（电热敷腰带）的电路。
// 触点 a、b、c、d、e 排成一圈，开关每次同时接通相邻两个触点：
//   ab 断开；bc 时 R1、R2 串联；cd 时 R1 被短路，只有 R2；de 时 R2、R3 并联。
// R3 题中未直接给出，由高温挡（de）的总电流推出：I3 = I高 − U/R2，R3 = U/I3。
export const ROTARY_POSITIONS = ['ab', 'bc', 'cd', 'de'];

export function rotaryHeaterSetup({ U, R1, R2, I_high }) {
  if (![U, R1, R2, I_high].every((v) => Number.isFinite(v) && v > 0)) throw new Error('U、R1、R2、I_high 须为正数');
  const i3 = I_high - U / R2;
  if (!(i3 > 0)) throw new Error('高温挡总电流须大于只接 R2 时的电流');
  return { U, R1, R2, R3: U / i3, Ihigh: I_high };
}

export function rotaryHeaterAt(setup, position) {
  const { U, R1, R2, R3 } = setup;
  const branch = { R1: 0, R2: 0, R3: 0 };
  let R = Infinity;
  if (position === 'bc') { R = R1 + R2; branch.R1 = branch.R2 = U / R; }
  else if (position === 'cd') { R = R2; branch.R2 = U / R2; }
  else if (position === 'de') { R = (R2 * R3) / (R2 + R3); branch.R2 = U / R2; branch.R3 = U / R3; }
  else if (position !== 'ab') throw new Error(`未知挡位 ${position}`);
  const I = Number.isFinite(R) ? U / R : 0;
  return { position, R, I, P: U * I, branch };
}

// 互动图和静态图共用的版面（viewBox 90 16 430 296）。导线按“哪条支路有电流时它才有电流”分组。
const O = { x: 230, y: 185 }, RAD = 64;
const at = (deg) => ({ x: O.x + RAD * Math.cos(deg * Math.PI / 180), y: O.y - RAD * Math.sin(deg * Math.PI / 180) });
const CONTACTS = { a: at(240), b: at(180), c: at(120), d: at(60), e: at(0) };
export const ROTARY_MID_ANGLE = { ab: 210, bc: 150, cd: 90, de: 30 };

export function rotaryHeaterLayout() {
  const { c, d, e } = CONTACTS;
  const N = { x: d.x, y: 56 };
  const pts = (...p) => p.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('');
  return {
    pivot: O, radius: RAD, contacts: CONTACTS, node: N,
    // amp：这段导线上的电流（A），流动光点的速度跟它成正比；路径按电流方向画（从左端接线柱流进开关）。
    wires: [
      { d: pts(c, { x: 110, y: c.y }, { x: 110, y: 56 }, N), amp: (s) => s.branch.R1 },
      { d: pts(d, N), amp: (s) => (s.position === 'cd' || s.position === 'de' ? s.branch.R2 : 0) },
      { d: pts(N, { x: 500, y: 56 }, { x: 500, y: O.y }), amp: (s) => s.branch.R2 },
      { d: pts(e, { x: 500, y: e.y }), amp: (s) => s.branch.R3 },
      { d: pts({ x: 500, y: O.y }, { x: 500, y: 290 }, { x: 434, y: 290 }), amp: (s) => s.I },
      { d: pts({ x: 326, y: 290 }, { x: O.x, y: 290 }, O), amp: (s) => s.I },
    ].map((w) => ({ ...w, on: (s) => w.amp(s) > 0 })),
    resistors: [
      { key: 'R1', x: 186, y: 56, horizontal: true },
      { key: 'R2', x: 381, y: 56, horizontal: true },
      { key: 'R3', x: 397, y: O.y, horizontal: true },
    ],
    terminals: [{ x: 330, y: 290 }, { x: 430, y: 290 }],
    joints: [N, { x: 500, y: O.y }],
    arc: `M${CONTACTS.a.x.toFixed(1)} ${CONTACTS.a.y.toFixed(1)}A${RAD} ${RAD} 0 1 1 ${CONTACTS.e.x.toFixed(1)} ${CONTACTS.e.y.toFixed(1)}`,
    labelAt: (deg, r = RAD + 20) => ({ x: O.x + r * Math.cos(deg * Math.PI / 180), y: O.y - r * Math.sin(deg * Math.PI / 180) }),
    labelAngle: { a: 240, b: 180, c: 120, d: 60, e: -24 }, // 标字母的方向；e 的字放到导线下方
  };
}

// 从开关中心看过去的角度 → 最近的挡位
export function rotaryNearest(deg) {
  const norm = ((deg % 360) + 360) % 360;
  let best = 'ab', gap = Infinity;
  for (const [pos, mid] of Object.entries(ROTARY_MID_ANGLE)) {
    const g = Math.min(Math.abs(norm - mid), 360 - Math.abs(norm - mid));
    if (g < gap) { gap = g; best = pos; }
  }
  return best;
}
