// 测量物质的密度实验室的模型：托盘天平 + 量筒。
// 质量一律用“0.1 g”做单位的整数（下标 U），避免小数误差；对外显示时再除以 10。
// 天平：砝码盒 100、50、20、20、10、5 g；标尺 0～5 g，分度值 0.2 g（游码读左边缘）。
// 量筒：量程 100 mL，分度值 1 mL（课本“100 mL 1 mL”的规格）。
// 天平的“倾向” lean（单位 0.1 g）：正 = 左盘（偏重）一边，指针偏左；负 = 指针偏右；0 = 横梁水平。

export const WEIGHTS = [100, 50, 20, 20, 10, 5]; // 砝码盒，单位 g
export const WEIGHTS_U = WEIGHTS.map((w) => w * 10);
export const RIDER_MAX = 25; // 游码最大格数：25 格 × 0.2 g = 5 g
export const RIDER_DIV = 0.2; // 游码分度值 g
export const RIDER_DIV_U = 2;
export const NUT_MIN = -3;
export const NUT_MAX = 3;
export const NUT_BAL = 1; // 平衡螺母在这个位置，空盘时横梁水平
export const NUT_START = -2; // 开始时故意不平：左偏，向右调
export const NUT_K = 5; // 螺母每偏一档，横梁倾向 0.5 g 当量；与游码分度值 0.2 g 不成整数倍，砝码和游码补不平它
export const DIAL_K = 4; // 倾向每 0.4 g，指针在分度盘上偏一格
export const DIAL_HALF = 5.5; // 指针最多偏出的格数（分度盘两边各 5 格，再多就撞到头）

export const CYL_MAX = 100; // 量筒量程 mL
export const CYL_DIV = 1; // 量筒分度值 mL
export const WATER_START = 40; // 量筒里开始有多少水（用户可以重新倒）
export const STONE = { massU: 624, volume: 24 }; // 小石块：62.4 g，24 cm³，密度 2.6 g/cm³
export const STONE_MIN_WATER = 30; // 水少于这个量，石块浸不没
export const STONE_MAX_WATER = CYL_MAX - STONE.volume; // 水多于这个量，放进石块会超出量程
export const BRINE = { rho: 1.2, beakerBrineU: 1074, volume0: 60 }; // 盐水 1.2 g/cm³；杯和盐水总质量 107.4 g，盐水 60 mL；倒出 V mL 少 1.2V g
export const POUR_MIN = 20; // 倒出的盐水至少这么多 mL，读数才不会太小

const BRINE_MASS_PER_ML_U = BRINE.rho * 10; // 12 个 0.1 g

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const gOf = (u) => Number((u / 10).toFixed(1));

export function initialState(mode = "stone") {
  return {
    mode, // stone 测小石块 / brine 测盐水
    nut: NUT_START,
    rider: 0, // 游码格数
    weights: WEIGHTS.map(() => false), // 右盘放了哪些砝码
    onPan: false, // 左盘里有没有放被测物
    water: WATER_START, // 测石块：量筒里的水 mL
    immersed: false, // 测石块：石块是否已放进量筒
    poured: 0, // 测盐水：已倒进量筒的盐水 mL
  };
}

// 被测物在左盘上的质量（0.1 g）
export function panMassU(s) {
  if (!s.onPan) return 0;
  if (s.mode === "stone") return STONE.massU;
  return BRINE.beakerBrineU - BRINE_MASS_PER_ML_U * s.poured;
}

export const weightsU = (s) => s.weights.reduce((sum, on, i) => sum + (on ? WEIGHTS_U[i] : 0), 0);
export const riderU = (s) => s.rider * RIDER_DIV_U;

// 螺母没调好时横梁自身的倾向（0.1 g 当量）
export const nutLean = (nut) => NUT_K * (NUT_BAL - nut);

export function lean(s) {
  return nutLean(s.nut) + panMassU(s) - weightsU(s) - riderU(s);
}

export const balanced = (s) => lean(s) === 0;

// 指针在分度盘上的位置：负 = 偏左，0 = 中线，正 = 偏右（格）
export function pointerPos(s) {
  return clamp(-lean(s) / DIAL_K, -DIAL_HALF, DIAL_HALF) + 0; // 加 0 避免出现 -0
}

// 天平读数 = 砝码总质量 + 游码左边缘对应的质量（g）
export const reading = (s) => gOf(weightsU(s) + riderU(s));

// 螺母调好了：空盘、没放砝码、游码在零刻度线，指针在中线
export const isLeveled = (s) => !s.onPan && weightsU(s) === 0 && s.rider === 0 && s.nut === NUT_BAL;

// 调螺母。游码不在零刻度线时给提示（课本：先把游码移到零刻度线，再调螺母）
export function adjustNut(s, d) {
  const nut = clamp(s.nut + d, NUT_MIN, NUT_MAX);
  return { state: { ...s, nut }, warn: s.rider !== 0 };
}

// 一次有效的称量：被测物在盘里，螺母已调好，横梁水平。返回被测物质量 g，否则 null
export function measurement(s) {
  if (!s.onPan || s.nut !== NUT_BAL || !balanced(s)) return null;
  return reading(s);
}

// 给孩子的提示：指针偏哪边、该怎么办
export function balanceHint(s) {
  const l = lean(s);
  if (l === 0) {
    if (s.nut !== NUT_BAL) return "横梁虽然水平，但平衡螺母没调好，这样称出来的质量不准。把砝码和游码归零，重新调平衡螺母。";
    if (!s.onPan) return "天平空载，横梁水平平衡。把被测物放在左盘，再在右盘加砝码。";
    return "横梁水平平衡了。物体质量 = 砝码总质量 + 游码左边缘对应的质量。";
  }
  const side = l > 0 ? "左" : "右";
  if (!s.onPan && weightsU(s) === 0 && s.rider === 0) {
    return `指针偏向${side}侧：平衡螺母要向${l > 0 ? "右" : "左"}调（${side}偏${l > 0 ? "右" : "左"}调），直到指针指在分度盘中线。`;
  }
  if (s.rider !== 0 && !s.onPan && weightsU(s) === 0) return "游码还不在零刻度线。先把游码移回零刻度线，再调平衡螺母。";
  if (s.nut !== NUT_BAL && s.onPan) return "平衡螺母没调好。请先把被测物拿下、砝码和游码归零，把天平调平。";
  // 称量阶段
  if (l > 0) return "指针偏向左侧：右盘的质量还不够。从大到小试加砝码，最后拨游码。";
  return "指针偏向右侧：右盘质量太大了。取下刚加的砝码，换小一号的试试，最后拨游码。";
}

// ---------- 量筒 ----------
// 量筒读数（mL）：测石块时 = 水 + 放进石块后的体积；测盐水时 = 倒进来的盐水
export function cylinderReading(s) {
  if (s.mode === "stone") return s.water + (s.immersed ? STONE.volume : 0);
  return s.poured;
}

export function pourWater(s, d) {
  if (s.immersed) return s;
  return { ...s, water: clamp(s.water + d, 0, CYL_MAX) };
}

// 放石块：水太少浸不没，水太多会超出量程。返回 { state, problem }
export function dropStone(s) {
  if (s.water < STONE_MIN_WATER) return { state: s, problem: "low" };
  if (s.water > STONE_MAX_WATER) return { state: s, problem: "high" };
  return { state: { ...s, immersed: true }, problem: null };
}

export const takeStone = (s) => ({ ...s, immersed: false });

// 倒盐水：必须先称过“杯和盐水总质量”（课本顺序），杯里最多 60 mL
export function pourBrine(s, d, hasM1) {
  if (!hasM1) return s;
  return { ...s, poured: clamp(s.poured + d, 0, BRINE.volume0) };
}

// ---------- 记录 ----------
export const emptyRecords = () => ({
  stone: { m: null, V1: null, V2: null },
  brine: { m1: null, V: null, m2: null },
});

// 根据当前状态更新记录（只增不减）
export function updateRecords(rec, s) {
  const out = { stone: { ...rec.stone }, brine: { ...rec.brine } };
  const m = measurement(s);
  if (s.mode === "stone") {
    if (m != null) out.stone.m = m;
    if (s.immersed) {
      out.stone.V1 = s.water;
      out.stone.V2 = s.water + STONE.volume;
    }
  } else if (m != null) {
    if (s.poured === 0) {
      out.brine.m1 = m;
      out.brine.V = null;
      out.brine.m2 = null;
    } else if (out.brine.m1 != null) {
      out.brine.m2 = m;
      out.brine.V = s.poured;
    }
  }
  return out;
}

const r2 = (x) => Number(x.toFixed(2));
export function stoneResult(rec) {
  const { m, V1, V2 } = rec.stone;
  if (m == null || V1 == null) return null;
  const V = V2 - V1;
  return { m, V, rho: r2(m / V) };
}
export function brineResult(rec) {
  const { m1, m2, V } = rec.brine;
  if (m1 == null || m2 == null || V == null || V <= 0) return null;
  const m = Number((m1 - m2).toFixed(1));
  return { m1, m2, m, V, rho: r2(m / V) };
}

export function taskStatus(rec, leveledOnce) {
  return {
    level: leveledOnce,
    mass: rec.stone.m != null || rec.brine.m1 != null,
    volume: rec.stone.V1 != null,
    stone: stoneResult(rec) != null,
    brine: brineResult(rec) != null && rec.brine.V >= POUR_MIN,
  };
}

// 给定质量（g，是 0.2 的整数倍，≤ 205），找出砝码盒里“大到小”的一种放法和游码格数；找不到返回 null
export function solveWeights(massG) {
  const u = Math.round(massG * 10);
  if (u < 0 || u % RIDER_DIV_U !== 0) return null;
  let best = null;
  for (let mask = 0; mask < 1 << WEIGHTS.length; mask++) {
    let sum = 0;
    for (let i = 0; i < WEIGHTS.length; i++) if (mask & (1 << i)) sum += WEIGHTS_U[i];
    const rest = u - sum;
    if (rest < 0 || rest > RIDER_MAX * RIDER_DIV_U) continue;
    if (best == null || sum > best.sum) best = { mask, sum, rider: rest / RIDER_DIV_U };
  }
  if (!best) return null;
  return { weights: WEIGHTS.map((_, i) => !!(best.mask & (1 << i))), rider: best.rider };
}
