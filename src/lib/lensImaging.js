// 凸透镜成像：物距 u、焦距 f（单位 cm）。拖动其中一个，看像的位置、大小、正倒、虚实怎么变。
// 照 2025 广州第 5 题：蜡烛距透镜 20 cm，光屏上得到倒立缩小的像，问焦距可能是多少。
export const LENS_VIEW = { w: 640, h: 300 };
export const LENS_AX = { x: 300, y: 150, S: 5, H: 40 }; // 透镜中心、主光轴、每厘米几像素、物高
const EPS = 1e-9;

export function lensSetup(config) {
  const { u, f, vary, min, max, step } = config;
  if (![u, f, min, max, step].every((v) => Number.isFinite(v) && v > 0)) throw new Error('u、f、min、max、step 须为正数');
  if (!['u', 'f'].includes(vary)) throw new Error('vary 只能是 u 或 f');
  if (max <= min || (max - min) / step > 200) throw new Error('滑块范围无效');
  const cur = vary === 'u' ? u : f;
  if (cur < min || cur > max) throw new Error('初值不在滑块范围内');
  return { u, f, vary, min, max, step };
}

export function lensAt(u, f) {
  if (Math.abs(u - f) < EPS) return { kind: 'none', v: Infinity, m: Infinity, real: false, upright: false, size: '', use: '', rule: 'u = f' };
  const v = (u * f) / (u - f);
  const m = Math.abs(v / u);
  if (u < f) return { kind: 'virtual', v, m, real: false, upright: true, size: '放大', use: '放大镜', rule: 'u < f' };
  if (Math.abs(u - 2 * f) < EPS) return { kind: 'equal', v, m, real: true, upright: false, size: '等大', use: '', rule: 'u = 2f' };
  if (u > 2 * f) return { kind: 'reduced', v, m, real: true, upright: false, size: '缩小', use: '照相机', rule: 'u > 2f' };
  return { kind: 'enlarged', v, m, real: true, upright: false, size: '放大', use: '投影仪', rule: 'f < u < 2f' };
}

// 互动图和静态图共用的几何：全部是屏幕坐标（y 向下）。
export function lensGeometry(u, f) {
  const { x: X, y: Y, S, H } = LENS_AX;
  const info = lensAt(u, f);
  const right = LENS_VIEW.w - 20, left = 20;
  const T = { x: X - u * S, y: Y - H };
  const P1 = { x: X, y: Y - H };
  const hasImage = Number.isFinite(info.v);
  const I = hasImage ? { x: X + info.v * S, y: Y + (H * info.v) / u } : null;
  const visible = hasImage && I.x >= left && I.x <= right && Math.abs(I.y - Y) <= 128;
  const slope1 = H / (f * S), slope2 = H / (u * S);
  const at1 = (x) => P1.y + slope1 * (x - X), at2 = (x) => Y + slope2 * (x - X);
  const end = info.real ? (visible ? I.x : right) : right;
  const rays = [
    { pts: [T, P1, { x: end, y: at1(end) }] },
    { pts: [T, { x: end, y: at2(end) }] },
  ];
  const back = !info.real && hasImage && visible
    ? [[P1, I], [{ x: X, y: Y }, I]].map((pts) => ({ pts, dashed: true })) : [];
  const marks = [];
  for (const [k, label] of [[1, 'F'], [2, '2F']]) for (const sgn of [-1, 1]) {
    const x = X + sgn * k * f * S;
    if (x >= left + 14 && x <= right - 14) marks.push({ x, y: Y, label });
  }
  return { info, T, I: visible ? I : null, offscreen: hasImage && !visible, rays, back, marks, screenX: info.real && visible ? I.x : null };
}
