// 杠杆实验室的物理模型：杠杆中点是支点 O，两侧各有 8 个等距的孔（每格 5 cm）。
// 课本约定：右侧是动力 F₁，左侧是阻力 F₂。每个钩码重 0.5 N（质量 50 g，g 取 10 N/kg）。
// 力矩单位 N·m，顺时针（右端下沉）为正。杠杆倾斜只表示“要往哪边转”，计算时一律用水平位置的力臂。

export const HOLES = 8;
export const CELL = 0.05; // 每格长度，单位 m
export const HOOK_N = 0.5; // 每个钩码的重力，单位 N
export const MAX_HOOKS = 5; // 每侧最多挂几个钩码
export const NUT_MIN = -3;
export const NUT_MAX = 3;
export const NUT_BAL = 1; // 平衡螺母在这个位置时，杠杆自重刚好不偏
export const NUT_START = -2; // 开始时故意不平：左端重，向右调螺母才能调平
export const NUT_K = 0.03; // 螺母每偏一档，杠杆自重产生的力矩（N·m），不是钩码力矩 0.025 的整数倍，钩码补不平它
export const SCALE_MAX = 5; // 测力计量程 N
export const SCALE_DIV = 0.1; // 测力计分度值 N
export const THETAS = [0, 30, 60]; // 测力计拉力和竖直方向的夹角（度）
export const TILT_GAIN = 200; // 力矩每差 1 N·m 倾斜多少度
export const MAX_TILT = 10; // 限位，最多倾斜这么多度

const EPS = 1e-9;
export const r9 = (x) => Math.round(x * 1e9) / 1e9;
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const arm = (hole) => r9(hole * CELL);
export const cosOf = (theta) => Math.cos((theta * Math.PI) / 180);

// 平衡螺母在 nut 档时，杠杆自重产生的力矩：nut < NUT_BAL 左端重（负），> 则右端重（正）
export const barTorque = (nut) => r9(NUT_K * (nut - NUT_BAL));

// 力矩差（顺时针为正）对应的倾斜角度（度，正 = 右端下沉）；差得太小就是水平
export function tiltOf(tau) {
  if (Math.abs(tau) < EPS) return 0;
  return clamp(tau * TILT_GAIN, -MAX_TILT, MAX_TILT);
}

// 测力计读数按分度值取整
export const roundScale = (f) => Number((Math.round(r9(f / SCALE_DIV)) * SCALE_DIV).toFixed(1));

export function initialState() {
  return {
    nut: NUT_START,
    left: { hole: 4, n: 0 },
    right: { hole: 3, n: 0, mode: "hooks", theta: 0 },
  };
}

// 当前状态下的全部结果。
// F1、l1 是右侧的动力和动力臂（斜拉时 l1 是缩短后的力臂）；F2、l2 是左侧的阻力和阻力臂。
// tau：杠杆受到的合力矩（顺时针为正）；angle：倾斜角（右端下沉为正）；balanced：水平静止
export function evaluate(s) {
  const { nut, left, right } = s;
  const F2 = r9(left.n * HOOK_N);
  const l2 = arm(left.hole);
  const tauL = r9(F2 * l2);
  const bar = barTorque(nut);
  const leveled = nut === NUT_BAL;
  const base = { F2, l2, tauL, bar, leveled, mode: right.mode, theta: right.mode === "scale" ? right.theta : 0 };

  if (right.mode === "hooks") {
    const F1 = r9(right.n * HOOK_N);
    const l1 = arm(right.hole);
    const tauR = r9(F1 * l1);
    const tau = r9(bar + tauR - tauL);
    return { ...base, F1, l1, tauR, tau, angle: tiltOf(tau), balanced: Math.abs(tau) < EPS, reading: null, over: false, noPull: false, fullArm: l1 };
  }

  // 测力计：人拉着它把杠杆拉到水平。需要的力矩 = 左侧力矩 − 杠杆自重力矩
  const full = arm(right.hole); // 挂点到支点的距离
  const l1 = r9(full * cosOf(right.theta)); // 斜拉时的力臂
  const need = r9(tauL - bar);
  let pull;
  let tau;
  let over = false;
  let noPull = false;
  if (need <= EPS) {
    pull = 0; // 不用拉，右边自己就够重
    noPull = true;
    tau = r9(bar - tauL);
  } else {
    const exact = need / l1;
    if (exact <= SCALE_MAX + EPS) {
      pull = exact;
      tau = 0;
    } else {
      pull = SCALE_MAX; // 拉到量程顶也不够，左端压下去
      over = true;
      tau = r9(bar + SCALE_MAX * l1 - tauL);
    }
  }
  const reading = roundScale(pull);
  return { ...base, F1: reading, l1, tauR: r9(pull * l1), tau, angle: tiltOf(tau), balanced: Math.abs(tau) < EPS, reading, over, noPull, fullArm: full };
}

// 倾斜方向：left 左端下沉 / right 右端下沉 / level 水平
export function tiltDir(ev) {
  if (ev.angle > 0) return "right";
  if (ev.angle < 0) return "left";
  return "level";
}

// 平衡且螺母已调平时，记一行（课本表格：F₁ F₁的力臂 F₂ F₂的力臂）。其余情况返回 null
export function recordRow(s) {
  const ev = evaluate(s);
  if (!ev.leveled || !ev.balanced || ev.F2 <= 0) return null;
  if (s.right.mode === "hooks") {
    if (ev.F1 <= 0) return null;
  } else if (ev.over || ev.noPull || ev.reading <= 0) return null;
  const row = {
    kind: s.right.mode,
    theta: ev.theta,
    hole: s.right.hole,
    F1: ev.F1,
    l1: Number(ev.l1.toFixed(3)),
    F2: ev.F2,
    l2: ev.l2,
  };
  row.key = `${row.kind}|${row.theta}|${row.hole}|${row.F1}|${row.l1}|${row.F2}|${row.l2}`;
  return row;
}

// 新的一行放进记录表：相同的数据不重复记，最多留 12 行，满了去掉最早的
export function addRecord(rows, row, max = 12) {
  if (!row || rows.some((r) => r.key === row.key)) return rows;
  const next = [...rows, row];
  return next.length > max ? next.slice(next.length - max) : next;
}

// 任务：根据记录和“螺母调平过”判断
export function taskStatus(records, leveledOnce) {
  const hooks = records.filter((r) => r.kind === "hooks");
  const vert = records.filter((r) => r.kind === "scale" && r.theta === 0);
  const oblique = records.filter((r) => r.kind === "scale" && r.theta > 0);
  // 斜拉：同一个挂点、同样的左侧钩码下，竖直拉过，斜拉的示数更大
  const compared = oblique.some((o) => vert.some((v) => v.hole === o.hole && v.F2 === o.F2 && v.l2 === o.l2 && o.F1 > v.F1));
  return {
    nut: leveledOnce,
    hooks: hooks.length >= 1,
    three: hooks.length >= 3,
    scale: vert.length >= 1,
    oblique: compared,
  };
}
