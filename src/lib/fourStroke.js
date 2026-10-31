// 四冲程汽油机：曲轴转角 0–720°（转两圈）走完一个工作循环。0° 是活塞在最上面、刚开始吸气。
//   0–180° 吸气：活塞向下，进气门开，混合气进来
//   180–360° 压缩：活塞向上，两个气门都关，混合气被压缩
//   360–540° 做功：火花塞点火，高温高压燃气推活塞向下（机械能由内能转化来）
//   540–720° 排气：活塞向上，排气门开，废气排出
export const STROKES = [
  { key: 'intake', name: '吸气冲程', from: 0, mid: 90, valve: '进气门开、排气门关', move: '活塞向下', note: '汽油和空气的混合物从进气门进入气缸' },
  { key: 'compress', name: '压缩冲程', from: 180, mid: 270, valve: '两个气门都关', move: '活塞向上', note: '混合气被压缩，温度升高，机械能转化为内能' },
  { key: 'power', name: '做功冲程', from: 360, mid: 450, valve: '两个气门都关', move: '活塞向下', note: '火花塞点火，燃气推动活塞做功，内能转化为机械能' },
  { key: 'exhaust', name: '排气冲程', from: 540, mid: 630, valve: '排气门开、进气门关', move: '活塞向上', note: '废气从排气门排出' },
];

export function fourStrokeSetup({ start = 90 } = {}) {
  if (!Number.isFinite(start) || start < 0 || start >= 720) throw new Error('start 要在 0–720 度之间');
  return { start };
}

// 曲柄连杆：曲轴中心 (280, 236)，曲柄半径 44，连杆长 100（和静态图共用）
export const ENGINE = { cx: 280, cy: 236, R: 44, L: 100, headY: 70, wallL: 230, wallR: 330, wallBottom: 214, pistonH: 16, topGap: 14 };
export const ENGINE_VIEW = { w: 560, h: 310 };

export function fourStrokeAt(deg) {
  const d = ((deg % 720) + 720) % 720;
  const idx = Math.min(3, Math.floor(d / 180));
  const stroke = STROKES[idx];
  const a = (d * Math.PI) / 180, { cx, cy, R, L, headY, pistonH, topGap } = ENGINE;
  const pinY = cy - (R * Math.cos(a) + Math.sqrt(L * L - R * R * Math.sin(a) ** 2)); // 活塞销（活塞中间）的高度
  const pistonTop = pinY - pistonH / 2;
  return {
    deg: d, stroke, pinY, pistonTop,
    crank: { x: cx + R * Math.sin(a), y: cy - R * Math.cos(a) },
    intakeOpen: stroke.key === 'intake', exhaustOpen: stroke.key === 'exhaust',
    spark: d >= 360 && d < 400,
    gasTop: headY, gasBottom: pistonTop,
    topY: headY + topGap, // 活塞最高时活塞顶的位置
  };
}

export const strokeAt = (deg) => fourStrokeAt(deg).stroke;
