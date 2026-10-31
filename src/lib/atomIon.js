// 原子得失电子变成离子：照 2022 广州第 4 题（铷原子结构示意图）。
// 最外层电子少于 4 个容易失去，多于 4 个容易得到，变成最外层 8 个（或没有这一层）的稳定结构；
// 质子数不变，电子数变了，粒子就带电。
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷' };

export function atomIonSetup({ symbol, Z, shells }) {
  const rings = String(shells || '').trim().split(/\s+/).map(Number);
  if (!symbol || !(Z > 0) || rings.length < 2 || !rings.every((n) => Number.isInteger(n) && n > 0)) throw new Error('symbol、Z、shells（至少两层，如 "2 8 1"）要写对');
  if (rings.reduce((a, b) => a + b, 0) !== Z) throw new Error('各层电子数之和必须等于质子数 Z');
  const last = rings[rings.length - 1];
  if (last === 4 || last >= 8) throw new Error('最外层 4 个或已满 8 个的原子不演示得失电子');
  const mode = last < 4 ? 'lose' : 'gain';
  return { symbol, Z, rings, last, mode, max: mode === 'lose' ? last : 8 - last };
}

// n：得到或失去的电子个数（0 到 max）
export function atomIonAt(setup, n) {
  const { symbol, Z, rings, mode } = setup;
  const sign = mode === 'lose' ? -1 : 1;
  const out = rings.slice();
  out[out.length - 1] += sign * n;
  const shells = out.filter((v) => v > 0);
  const charge = -sign * n; // 失去电子带正电
  return {
    n, shells, protons: Z, electrons: Z + sign * n, charge,
    name: n === 0 ? symbol : `${symbol}${charge > 1 ? SUP[charge] : ''}${charge > 0 ? '⁺' : '⁻'}`,
    outer: shells[shells.length - 1],
  };
}

// 互动图和静态图共用的版面（viewBox 640 300）：原子居中，每层电子画在圆环上；
// 失去的电子排到右边“失去的电子”，得到的电子从右边“来自别的原子”补进最外层的空位。
export const ION_VIEW = { w: 640, h: 300 };
export function atomIonLayout(setup, n, cx = 170, cy = 150) {
  const { rings, mode, last } = setup;
  const k = rings.length, sp = Math.min(26, 84 / (k - 1));
  const r = (i) => 44 + i * sp;
  const dot = (i, j, count) => {
    const a = (-90 + (360 / count) * j) * Math.PI / 180;
    return { x: cx + r(i) * Math.cos(a), y: cy + r(i) * Math.sin(a) };
  };
  const dots = [], gone = [];
  rings.forEach((cnt, i) => {
    if (i < k - 1) { for (let j = 0; j < cnt; j++) dots.push({ ...dot(i, j, cnt), kind: 'keep' }); return; }
    // 最外层按 8 个位置排，原有的占前面，得到的补在后面，失去的从后面拿走
    for (let j = 0; j < 8; j++) {
      const p = dot(i, j, 8);
      if (j < last - (mode === 'lose' ? n : 0)) dots.push({ ...p, kind: 'keep' });
      else if (mode === 'gain' && j < last + n) dots.push({ ...p, kind: 'gain' });
      else if (mode === 'lose' && j < last) gone.push(p);
    }
  });
  const remaining = rings[k - 1] - (mode === 'lose' ? n : 0);
  const ringsShown = rings.map((_, i) => i < k - 1 || mode === 'gain' || remaining > 0);
  // 最外层空了（如 Rb⁺）这一层就不画；还剩电子时（失去一部分）仍画
  const side = Array.from({ length: n }, (_, j) => ({ x: 400 + j * 34, y: cy }));
  return { center: { x: cx, y: cy }, nucleusR: 24, radii: rings.map((_, i) => r(i)), ringsShown, dots, gone, side };
}
