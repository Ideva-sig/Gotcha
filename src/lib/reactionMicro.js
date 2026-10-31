// 化学反应微观示意图：分子拆成原子，原子重新组合成新分子。
// 参数只有一个化学方程式（如 "N2 + 3H2 -> 2NH3"），原子个数前后必须相等，否则报错。
// 时间 t 从 0 到 1：0 反应前（分子完整）→ 0.25 分子拆开 → 0.75 原子到了新位置 → 1 反应后（新分子）。

const SUB = '₀₁₂₃₄₅₆₇₈₉';
export const subscript = (formula) => formula.replace(/\d/g, (d) => SUB[d]);

// 原子大小和颜色：H 小、白；其余按元素给色。蓝、珊瑚红原色上白字不到 4.5:1，压暗两成（约 6:1）。
export const ATOM_STYLE = {
  H: { r: 13, fill: 'var(--surface)', text: 'var(--text)' },
  N: { r: 18, fill: 'color-mix(in srgb, var(--course-blue) 80%, #000)', text: '#fff' },
  O: { r: 18, fill: 'color-mix(in srgb, var(--course-coral) 80%, #000)', text: '#fff' },
  C: { r: 18, fill: 'var(--course-ink)', text: '#fff' },
};
export const atomStyle = (el) => ATOM_STYLE[el] || { r: 18, fill: 'var(--tint-neutral)', text: 'var(--text)' };

export function parseFormula(formula) {
  if (!/^([A-Z][a-z]?\d*)+$/.test(formula)) throw new Error(`化学式只支持元素符号加数字：${formula}`);
  const atoms = [];
  for (const [, el, n] of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    for (let i = 0; i < (n ? Number(n) : 1); i++) atoms.push(el);
  }
  return atoms;
}

function parseSide(side) {
  return side.split('+').map((part) => {
    const m = part.trim().match(/^(\d*)\s*([A-Za-z0-9]+)$/);
    if (!m) throw new Error(`看不懂：${part}`);
    const count = m[1] ? Number(m[1]) : 1;
    if (!(count >= 1 && count <= 6)) throw new Error('每种分子 1–6 个');
    return { formula: m[2], count, atoms: parseFormula(m[2]) };
  });
}

const tally = (species) => {
  const out = {};
  for (const s of species) for (const el of s.atoms) out[el] = (out[el] || 0) + s.count;
  return out;
};

export function reactionSetup({ equation }) {
  const sides = String(equation || '').split('->');
  if (sides.length !== 2) throw new Error('方程式要写成 反应物 -> 生成物');
  const reactants = parseSide(sides[0]), products = parseSide(sides[1]);
  const before = tally(reactants), after = tally(products);
  const els = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  for (const el of els) if (before[el] !== after[el]) throw new Error(`${el} 原子前后个数不等`);
  const molecules = (list) => list.reduce((n, s) => n + s.count, 0);
  return { reactants, products, atoms: before, elements: els, moleculesBefore: molecules(reactants), moleculesAfter: molecules(products) };
}

// 一个分子里各原子的相对位置：同种原子排成一行；否则第一个非 H 的单个原子居中，其余围一圈。
export function moleculeShape(atoms) {
  const r = atoms.map((el) => atomStyle(el).r);
  if (atoms.length === 1) return [{ x: 0, y: 0 }];
  if (new Set(atoms).size === 1) {
    const gap = r[0] * 1.7;
    return atoms.map((_, i) => ({ x: (i - (atoms.length - 1) / 2) * gap, y: 0 }));
  }
  const counts = atoms.reduce((m, el) => ({ ...m, [el]: (m[el] || 0) + 1 }), {});
  let c = atoms.findIndex((el) => el !== 'H' && counts[el] === 1);
  if (c < 0) c = 0;
  const others = atoms.map((_, i) => i).filter((i) => i !== c);
  const start = { 1: 0, 2: 180, 3: 90, 4: 45 }[others.length] ?? 90;
  return atoms.map((_, i) => {
    if (i === c) return { x: 0, y: 0 };
    const k = others.indexOf(i), deg = start + (360 / others.length) * k;
    const d = (r[c] + r[i]) * 0.86;
    return { x: d * Math.cos(deg * Math.PI / 180), y: -d * Math.sin(deg * Math.PI / 180) };
  });
}

export const MICRO_VIEW = { w: 640, h: 300 };
const ZONE = { before: 140, after: 500 }, SPLIT = 1.75;

// 把一边的分子摆成网格（每列最多 2 个），返回每个原子的位置。
function placeSide(species, cx) {
  const list = species.flatMap((s) => Array.from({ length: s.count }, () => s));
  const cols = Math.ceil(list.length / 2), rows = Math.min(2, list.length);
  const colGap = 140, rowGap = 130;
  const atoms = [];
  list.forEach((s, m) => {
    const col = Math.floor(m / rows), row = m % rows;
    const center = { x: cx + (col - (cols - 1) / 2) * colGap, y: 160 + (row - (rows - 1) / 2) * rowGap };
    moleculeShape(s.atoms).forEach((p, i) => atoms.push({ el: s.atoms[i], molecule: m, center, rel: p }));
  });
  return atoms;
}

export function reactionLayout(setup) {
  const before = placeSide(setup.reactants, ZONE.before), after = placeSide(setup.products, ZONE.after);
  const at = (o, f) => ({ x: o.center.x + o.rel.x * f, y: o.center.y + o.rel.y * f });
  // 同种元素按顺序一一对应：反应物里第 k 个 N 原子去生成物里第 k 个 N 原子的位置。
  const used = {};
  const atoms = before.map((a) => {
    const k = used[a.el] = (used[a.el] ?? -1) + 1;
    const b = after.filter((x) => x.el === a.el)[k];
    return { el: a.el, r: atomStyle(a.el).r, a, b, from: a.molecule, to: b.molecule };
  });
  // 中间一站：拆开的原子在画面中间排成两行，按要去的位置从上到下、从左到右排，路线少交叉。
  const cols = Math.ceil(atoms.length / 2), gap = 48;
  [...atoms].sort((p, q) => (p.b.center.y - q.b.center.y) || (p.b.center.x + p.b.rel.x - q.b.center.x - q.b.rel.x))
    .forEach((atom, i) => {
      const row = i < cols ? 0 : 1, col = row ? i - cols : i;
      atom.mid = { x: (ZONE.before + ZONE.after) / 2 + (col - (cols - 1) / 2) * gap, y: 160 + (row - 0.5) * 70 };
    });
  return {
    atoms: atoms.map(({ el, r, a, b, mid, from, to }) => ({ el, r, keys: [at(a, 1), at(a, SPLIT), mid, at(b, SPLIT), at(b, 1)], from, to })),
    zones: ZONE,
  };
}

const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
const mix = (p, q, u) => ({ x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u });

// 关键时刻：0 反应前 → 0.2 原地拆开 → 0.5 原子在中间 → 0.8 到了新分子位置（还分开）→ 1 结合成新分子
export const MICRO_KEYS = [0, 0.2, 0.5, 0.8, 1];
export function atomAt(atom, t) {
  const T = MICRO_KEYS;
  const s = Math.max(0, Math.min(3, T.findIndex((v, i) => t <= T[i + 1]) ));
  const u = (Math.max(0, Math.min(1, t)) - T[s]) / (T[s + 1] - T[s]);
  return mix(atom.keys[s], atom.keys[s + 1], ease(Math.max(0, Math.min(1, u))));
}

export const reactionStage = (t) => (t < 0.12 ? 'before' : t > 0.88 ? 'after' : 'moving');
