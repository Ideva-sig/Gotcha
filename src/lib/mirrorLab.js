// 平面镜成像 + 光的反射实验室的物理模型（只在程序里用，页面上不出现算法）。
// 模式一“光的反射”：平面镜水平放，法线 ON 竖直向上，激光沿 EO 射到 O 点，角度单位是度。
// 模式二“平面镜成像”：桌面俯视图，玻璃板竖在纸上，距离单位是 cm；平面镜成的像和物体关于镜面对称。

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const snap = (x, step) => Math.round(x / step) * step;
const tidy = (x) => Math.round(x * 1e6) / 1e6; // 去掉浮点误差，保留 6 位

// ---------------- 光的反射 ----------------
export const INC_MIN = 10; // 入射角可调的范围和每次调多少度
export const INC_MAX = 80;
export const INC_STEP = 5;
export const START_INC = 40;
export const FOLD_BACK = 40; // 纸板 NOF 向后折的角度（向前折用负号）
export const FOLD_FRONT = -40;

const rad = (deg) => (deg * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// 平面镜是 y = 0 这条线，镜面反射只把光线的竖直分量反过来
export function reflectDir(d) {
  return [d[0], -d[1]];
}

// 光线与法线（竖直方向）的夹角，单位度
function angleToNormal(d) {
  return deg(Math.atan2(Math.abs(d[0]), Math.abs(d[1])));
}

// 光从法线 side 一侧（−1 左、+1 右）、入射角 i 射向 O 点。
// 反射角是用反射后的方向向量反算出来的，不是直接抄入射角，所以测试能证明“反射角等于入射角”。
export function rayState(i, side = -1) {
  const source = [side * Math.sin(rad(i)), Math.cos(rad(i))]; // O 点出发指向光源的单位向量
  const incident = [-source[0], -source[1]]; // 入射光的传播方向
  const out = reflectDir(incident); // 反射光的传播方向
  return { i, side, r: tidy(angleToNormal(out)), outSide: Math.sign(out[0]) || -side };
}

// 光路可逆：让光从反射光的位置沿反方向射回 O，它会从原来入射光的位置射出
export function reverseOf(i, side = -1) {
  const first = rayState(i, side);
  const back = rayState(first.r, first.outSide);
  return { ...back, retraces: back.outSide === side && Math.abs(back.r - i) < 1e-6 };
}

// 纸板 NOF 折转之后，反射光不再落在纸板上，纸板上就看不到它
export const foldedAway = (fold) => Math.abs(fold) > 1e-9;
export const reflectedSeen = (fold) => !foldedAway(fold);

// 折起来的那半块纸板怎么画：横向被压扁（cos），再歪一点表示前后（shear）。方向：向后折为正。
export const FOLD_SHEAR = 0.12;
export function foldTransform(fold) {
  const c = Math.cos(rad(fold));
  return { sx: c, shear: FOLD_SHEAR * Math.sin(rad(fold)) };
}

// 画面布局（以 O 点为原点，x 向右，y 向下，单位是画面像素）。测试用它证明最大入射角时不出画面、不压字
export const VIEW_R = { w: 560, h: 300 };
export const ORIGIN_R = { x: 280, y: 262 };
export const BOARD = { w: 250, h: 235 }; // 纸板：从 O 向左右各伸出 w，向上高 h
export const RAY_LEN = 150; // 激光发射器所在的位置（离 O 的距离）
export const EMITTER_R = 14; // 发射器（画成一个圆）的半径
export const GUIDE_R = 186; // 光线向外的淡虚线画到这里，同时是量角器刻度环的外沿
export const TICK_R = 172; // 刻度环内沿
export const LABEL_R = 210; // 刻度数字的中心离 O 的距离
export const LABEL_BOX = { w: 26, h: 18 }; // 一个刻度数字占的格子
export const LABEL_ANGLES = [0, 10, 20, 30, 40, 50, 60, 70, 80];
export const MIRROR_H = 10;

// 光线上离 O 距离 len 的点（画面坐标，O 为原点），side 为光线所在一侧
export function rayPoint(angle, side, len) {
  return { x: side * len * Math.sin(rad(angle)), y: -len * Math.cos(rad(angle)) };
}

// 所有刻度数字的格子，side：−1 左、+1 右（0° 只有一个，放在 side = 0）
export function labelBoxes() {
  const boxes = [];
  for (const a of LABEL_ANGLES) {
    for (const side of a === 0 ? [0] : [-1, 1]) {
      const p = rayPoint(a, side, LABEL_R);
      boxes.push({ text: String(a), side, angle: a, cx: p.x, cy: p.y, w: LABEL_BOX.w, h: LABEL_BOX.h });
    }
  }
  return boxes;
}

// 入射角记录表里的一行
export function reflectRow(i, side = -1) {
  const s = rayState(i, side);
  return { i: s.i, r: s.r };
}

// 同一个入射角只留一行，按入射角从小到大
export function addAngleRow(rows, row, max = 8) {
  if (!row) return rows;
  if (rows.some((r) => r.i === row.i)) return rows;
  const next = [...rows, row].sort((a, b) => a.i - b.i);
  return next.length > max ? next.slice(next.length - max) : next;
}

export function reflectTasks({ rows, foldSeen, reverseSeen }) {
  return { angles: rows.length >= 3, fold: Boolean(foldSeen), reverse: Boolean(reverseSeen) };
}

// ---------------- 平面镜成像 ----------------
// 坐标：d 是到玻璃板的距离（垂直方向），y 是沿玻璃板方向的偏移（正为上，俯视图里往纸面上方）。
export const A_D_MIN = 4;
export const A_D_MAX = 20;
export const A_D_STEP = 1;
export const A_Y_MIN = -6;
export const A_Y_MAX = 6;
export const A_Y_STEP = 2;
export const B_D_MIN = 1; // 蜡烛 B 在玻璃板后面，能放的范围
export const B_D_MAX = 24;
export const B_Y_MIN = -8;
export const B_Y_MAX = 8;
export const B_STEP = 0.5; // B 每次挪 0.5 cm（A 每次挪 1 cm），所以总能落进“重合”的范围
export const OVERLAP_TOL = 0.3; // B 和像相距不到 0.3 cm，看上去就“完全重合”了
export const START_A = { d: 8, y: 0 };
export const START_B = { d: 13, y: 4 };

// 像的位置：和物体关于镜面对称，像距等于物距，连线垂直镜面
export function imageOf(a) {
  return { d: a.d, y: a.y };
}

export const gap = (a, b) => Math.hypot(b.d - a.d, b.y - a.y);

// 蜡烛 B 和 A 的像是否看上去完全重合
export function overlaps(a, b) {
  return gap(imageOf(a), b) <= OVERLAP_TOL;
}

// 把 B 挪到离 A 的像最近的、B 能到的位置（测试用：证明任何 A 的位置 B 都能重合）
export function nearestB(a) {
  const img = imageOf(a);
  return {
    d: clamp(snap(img.d, B_STEP), B_D_MIN, B_D_MAX),
    y: clamp(snap(img.y, B_STEP), B_Y_MIN, B_Y_MAX),
  };
}

// 光屏放在像的位置（也就是 B 的位置）：不管对没对准，屏上都没有像，因为平面镜成的是虚像
export function screenView(a, b) {
  return { atImage: overlaps(a, b), hasImage: false };
}

// 记录表一行：蜡烛到平面镜的距离、像到平面镜的距离（取蜡烛 B 的位置量出来的）
export function imageRow(a, b) {
  if (!overlaps(a, b)) return null;
  return { u: a.d, v: b.d };
}

// 同一个物距只留最新一行，按物距从小到大
export function addImageRow(rows, row, max = 8) {
  if (!row) return rows;
  const next = [...rows.filter((r) => r.u !== row.u), row].sort((a, b) => a.u - b.u);
  return next.length > max ? next.slice(next.length - max) : next;
}

export function imageTasks({ rows, screenSeen }) {
  return { pos: rows.length >= 3, screen: Boolean(screenSeen) };
}

// 画面布局（俯视图，单位像素）。纸面：玻璃板竖在中间，左边是 A，右边是 B 和像
export const VIEW_I = { w: 760, h: 366 };
export const PX_CM = 14;
export const PLATE_X = 380;
export const CENTER_Y = 175;
export const CANDLE_R = 10; // 蜡烛（俯视是个圆）半径
export const LABEL_GAP = 22; // 蜡烛上方留给“A / B”字母的高度
export const DIM_Y = 330; // 测量距离的线所在的高度（在所有蜡烛下面）
export const xOfA = (d) => PLATE_X - d * PX_CM;
export const xOfB = (d) => PLATE_X + d * PX_CM;
export const yOf = (y) => CENTER_Y - y * PX_CM;
