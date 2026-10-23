// 浮力实验室的物理模型：弹簧测力计挂着一块长方体，一点点浸入烧杯（或溢水杯）里的液体。
// g 取 10 N/kg（和课本例题、练习一致）。长度 cm，体积 cm³，力 N，密度 kg/m³。
// 为了让“深度”有清楚的意思，假定烧杯很大，物体浸入时液面高度不变；
// 浸入深度 h 指物体下表面到液面的距离（负数表示物体还在液面上方）。

export const G_N_PER_KG = 10;
export const LIQUID_DEPTH = 14; // 烧杯里液体的深度
export const H_MIN = -1; // 物体最高：下表面在液面上方 1 cm
export const H_MAX = 12.5; // 挂着往下放，最低放到这里（不碰杯底）
export const H_BOTTOM = LIQUID_DEPTH; // 松手后沉到底：下表面贴着杯底
export const H_START = H_MIN;
export const H_STEP = 0.5; // 拖动时每次最小的挪动量
export const SCALE_MAX = 5; // 测力计量程 0–5 N，分度值 0.1 N
export const READ_STEP = 0.05; // 估读到分度值的一半
export const BUCKET_WEIGHT = 0.2; // 溢水杯实验里空小桶的重 G桶

export const LIQUIDS = [
  { id: "water", name: "水", rho: 1000, rhoText: "1.0" },
  { id: "salt", name: "盐水", rho: 1200, rhoText: "1.2" },
  { id: "alcohol", name: "酒精", rho: 800, rhoText: "0.8" },
];

// 四个物体都是高 5 cm 的长方体：铝块 A、铜块 B 体积相同；铝块 C 的体积是它们的两倍；塑料块 D 的密度比水略大
export const OBJECTS = [
  { id: "A", name: "铝块 A", short: "铝块 A", rho: 2700, area: 10, height: 5 },
  { id: "B", name: "铜块 B", short: "铜块 B", rho: 8900, area: 10, height: 5 },
  { id: "C", name: "大铝块 C", short: "大铝块 C", rho: 2700, area: 20, height: 5 },
  { id: "D", name: "塑料块 D", short: "塑料块 D", rho: 1100, area: 10, height: 5 },
];

export const liquidOf = (id) => LIQUIDS.find((l) => l.id === id);
export const objectOf = (id) => OBJECTS.find((o) => o.id === id);

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const snap = (x, step) => Math.round(x / step) * step;

// 测力计读数：估读到 0.05 N，并去掉浮点误差
export function readN(x) {
  return Number((Math.round(x / READ_STEP + 1e-9) * READ_STEP).toFixed(2));
}

export const volumeOf = (obj) => obj.area * obj.height; // cm³
// 物体在空气中的重 G = mg = ρVg
export const weightOf = (obj) => (obj.rho * volumeOf(obj) * 1e-6 * G_N_PER_KG);

// 浸入深度 h 时，浸在液体中的深度、体积
export const immersedDepth = (obj, h) => clamp(h, 0, obj.height);
export const immersedVolume = (obj, h) => obj.area * immersedDepth(obj, h);
export const isFullyIn = (obj, h) => h >= obj.height - 1e-9;

// 浮力的大小 = 排开液体的重：F浮 = ρ液 V排 g（V 单位 cm³）
export const buoyancyOf = (liq, volumeCm3) => liq.rho * volumeCm3 * 1e-6 * G_N_PER_KG;

// 称重法：F浮 = G − F拉
export const byWeighing = (G, F) => Number((G - F).toFixed(2));

// 物体比液体密度小，会漂浮：平衡时浸入的深度 h = 高度 × ρ物 / ρ液（浮力等于重力）
export function floatDepth(obj, liq) {
  return obj.rho < liq.rho ? (obj.height * obj.rho) / liq.rho : null;
}

// 挂着的时候最低能放到哪：会漂浮的物体用细线是压不下去的
export function maxHangDepth(obj, liq) {
  const fd = floatDepth(obj, liq);
  return fd == null ? H_MAX : Math.min(H_MAX, fd);
}

// 挂在测力计上时的情况（h 在 H_MIN 到 maxHangDepth 之间）
export function hangState(obj, liq, h) {
  const G = weightOf(obj);
  const V = immersedVolume(obj, h);
  const Fb = buoyancyOf(liq, V);
  const F = Math.max(0, G - Fb);
  return {
    G, V, Fb, F,
    full: isFullyIn(obj, h),
    // 页面上读出来的数（估读到 0.05 N）；浮力用读数相减，和同学动手算的一样
    readG: readN(G),
    readF: readN(F),
    readFb: byWeighing(readN(G), readN(F)),
  };
}

// 松手以后：比液体密度大就沉底，小就漂浮，一样就悬浮（在原处不动）
export function settle(obj, liq, h) {
  if (obj.rho > liq.rho) return { state: "sink", h: H_BOTTOM };
  if (obj.rho < liq.rho) return { state: "float", h: floatDepth(obj, liq) };
  return { state: "suspend", h: clamp(h, immersedDepth(obj, 0), H_BOTTOM) };
}

// 溢水杯：杯里的水一直装到溢水口，物体浸入多少体积，就有多少体积的液体流进小桶。
// 流出去的不会回来，所以小桶里收到的是“到目前为止浸入过的最大体积”那么多液体。
export const collectedAfter = (collected, volume) => Math.max(collected, volume);
export const bucketTotal = (liq, collectedCm3) => readN(BUCKET_WEIGHT + buoyancyOf(liq, collectedCm3));

// 记录表里的一行（浮力与浸入的关系）：物体下表面深度 h 取整数厘米时记一行
export function infoRow(obj, liq, h) {
  const s = hangState(obj, liq, h);
  if (s.Fb > s.G + 1e-9) return null; // 浮力比重力大，细线挂不住，不是挂着的情况
  return { obj: obj.id, liq: liq.id, h, V: s.V, F: s.readF, Fb: s.readFb, full: s.full };
}

// 溢水杯实验的一行（课本 p.70 的表）：浸没、小桶里收到的液体正好等于物体排开的
export function overflowRow(obj, liq, h, collectedCm3) {
  const s = hangState(obj, liq, h);
  if (s.Fb > s.G + 1e-9 || !s.full || Math.abs(collectedCm3 - volumeOf(obj)) > 1e-9) return null;
  const Gtotal = bucketTotal(liq, collectedCm3);
  return {
    obj: obj.id, liq: liq.id,
    Gbucket: BUCKET_WEIGHT, Gobj: s.readG, F: s.readF, Gtotal,
    Fb: s.readFb, Gdisp: Number((Gtotal - BUCKET_WEIGHT).toFixed(2)),
  };
}

const keyOf = (r) => `${r.obj}|${r.liq}|${r.h}`;
const MAX_ROWS = 18;
export function addInfoRow(rows, row) {
  if (!row) return rows;
  const same = rows.find((r) => keyOf(r) === keyOf(row));
  if (same && same.F === row.F) return rows;
  const next = [...rows.filter((r) => keyOf(r) !== keyOf(row)), row];
  return next.length > MAX_ROWS ? next.slice(next.length - MAX_ROWS) : next;
}

export function addOverflowRow(rows, row) {
  if (!row) return rows;
  if (rows.some((r) => r.obj === row.obj && r.liq === row.liq)) return rows;
  return [...rows, row].slice(-8);
}

// ---------- 任务和结论是否做出来了 ----------
const sameSeries = (rows) => {
  const groups = {};
  for (const r of rows) (groups[`${r.obj}|${r.liq}`] ||= []).push(r);
  return Object.values(groups).map((g) => g.sort((a, b) => a.h - b.h));
};

// 浸没前：同一物体、同一液体，浸入 1–5 cm 里至少 3 个不同深度，浮力一路变大
export function growsBeforeFull(rows) {
  return sameSeries(rows).some((g) => {
    const part = g.filter((r) => !r.full || r.h <= objectOf(r.obj).height + 1e-9);
    const rising = part.filter((r) => r.h >= 1 && r.h <= objectOf(r.obj).height);
    if (rising.length < 3) return false;
    return rising.every((r, i) => i === 0 || r.Fb > rising[i - 1].Fb);
  });
}

// 浸没后：同一物体、同一液体，浸没后至少两个相差 2 cm 以上的深度，浮力一样大
export function constantAfterFull(rows) {
  return sameSeries(rows).some((g) => {
    const deep = g.filter((r) => r.full);
    if (deep.length < 2) return false;
    const hs = deep.map((r) => r.h);
    return Math.max(...hs) - Math.min(...hs) >= 2 && deep.every((r) => r.Fb === deep[0].Fb);
  });
}

// 同一物体浸没在不同液体里，至少 2 种液体，浮力不同，且液体密度大的浮力大
export function changesWithLiquid(rows) {
  const byObj = {};
  for (const r of rows.filter((r) => r.full)) (byObj[r.obj] ||= {})[r.liq] = r.Fb;
  return Object.values(byObj).some((m) => {
    const ids = Object.keys(m);
    if (ids.length < 2) return false;
    const sorted = ids.map((id) => ({ rho: liquidOf(id).rho, Fb: m[id] })).sort((a, b) => a.rho - b.rho);
    return sorted.every((x, i) => i === 0 || x.Fb > sorted[i - 1].Fb);
  });
}

// 溢水杯：至少做出 2 组，且每组 F浮 = G排
export const archimedesDone = (rows) => rows.length >= 2 && rows.every((r) => r.Fb === r.Gdisp);

// 浮沉（选做）：用塑料块 D，水里下沉、盐水里漂浮，都松手看过
export const SETTLE_NEEDED = ["D|water|sink", "D|salt|float"];
export const settleKey = (obj, liq, state) => `${obj.id}|${liq.id}|${state}`;
export const settleDone = (seen) => SETTLE_NEEDED.every((k) => seen.includes(k));

// 铝块 A 和铜块 B 体积相同、密度不同：同一液体里浸没，浮力一样大
export function sameVolumeSameBuoyancy(rows) {
  const pick = (id) => rows.filter((r) => r.obj === id && r.full);
  return pick("A").some((a) => pick("B").some((b) => b.liq === a.liq && b.Fb === a.Fb));
}
