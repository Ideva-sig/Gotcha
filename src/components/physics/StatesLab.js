"use client";

// 物态变化实验室：给一烧杯冰加热、停火、放进冰柜，看温度—时间图像怎么画出来。
// 物理模型在 src/lib/statesLab.js。服务器渲染出来的初始画面（−20 °C 的碎冰、空图像）就是第 0 秒的完整静态图。
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Check, Notice, Progress, Tabs, Title } from "@/components/island/Island";
import {
  BOIL_T, FREEZER_T, MAX_BOIL_LOSS, MELT_T, ROOM_T,
  heatRate, initialLab, phaseOf, plateaus, stepLab,
} from "@/lib/statesLab";
import styles from "./StatesLab.module.css";

const BLUE = "#287fc4";
const CORAL = "#c9554d";
const LINE = "#52626a";
const LIGHT = "#bec9ce";

const SPEEDS = [
  { key: "1", label: "1 倍速" },
  { key: "2", label: "2 倍速" },
  { key: "4", label: "4 倍速" },
];
const MODES = [
  { key: "heat", label: "加热" },
  { key: "stop", label: "停止加热" },
  { key: "freezer", label: "放进冰柜" },
];
const TASKS = [
  { key: "meltStart", text: "把冰加热到熔点，看它开始熔化" },
  { key: "meltDone", text: "让冰全部熔化成水" },
  { key: "boil", text: "把水烧开" },
  { key: "stopBoil", text: "水沸腾时停止加热，看看会怎样" },
  { key: "freeze", text: "放进冰柜，让水重新结冰" },
];
const SIM_MIN_PER_SEC = 1; // 1 倍速：1 秒走 1 分钟

const fmtT = (T) => {
  const r = Math.round(T);
  return `${r < 0 ? "−" : ""}${Math.abs(r)}`;
};

// ---------- 烧杯 ----------
const BEAKER = { left: 110, right: 270, top: 190, bottom: 360 };
const FULL_H = 120; // 1 份水的高度
const thermoY = (T) => 322 - ((T + 20) * 270) / 130;
// 碎冰块的位置（固定写死，服务器和浏览器画出来一样）
const ICE_SLOTS = [
  [142, 342, -8], [190, 344, 6], [238, 341, -4],
  [160, 309, 12], [210, 311, -10], [248, 306, 4],
  [134, 277, 3], [184, 276, -6], [232, 274, 9],
];

function IcePiece({ x, y, size, rot }) {
  if (size < 3) return null;
  const h = size / 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-h} y={-h} width={size} height={size} rx={size * 0.18} fill="#dcecf8" stroke="#7fa9c9" strokeWidth="1.5" />
      <path d={`M${-h * 0.5} ${-h * 0.45} L${h * 0.15} ${-h * 0.45}`} stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Beaker({ sim, mode, bubbles, reduced }) {
  const phase = phaseOf(sim, mode);
  const waterH = FULL_H * sim.water;
  const waterTop = BEAKER.bottom - waterH;
  const iceSize = 34 * Math.cbrt(sim.ice);
  const boiling = phase === "boiling";
  const staticBubbles = [[172, 300, 3], [214, 330, 2.5], [250, 290, 4], [180, 270, 5], [228, 262, 6]];
  const shown = reduced ? (boiling ? staticBubbles.map(([x, y, r]) => ({ x, y: Math.max(y, waterTop + 10), r })) : []) : bubbles;
  return (
    <svg className={styles.beaker} viewBox="0 0 360 440" role="img" aria-label={`烧杯实验装置，温度计读数 ${fmtT(sim.T)} 摄氏度`}>
      {mode === "freezer" && (
        <g>
          <rect x="68" y="150" width="244" height="232" rx="18" fill="#287fc4" opacity="0.08" />
          <text x="300" y="172" textAnchor="end" className={styles.svgNote} fill="#1f6aa6">冰柜里 −20 °C</text>
        </g>
      )}
      {/* 铁架台 */}
      <rect x="18" y="424" width="110" height="8" rx="3" fill="#dfe5e8" stroke={LINE} strokeWidth="1.5" />
      <path d="M40 424V40" stroke={LINE} strokeWidth="5" strokeLinecap="round" />
      <path d="M40 58H146 M40 366H104" stroke={LINE} strokeWidth="3" strokeLinecap="round" />
      {/* 陶土网 */}
      <rect x="100" y="362" width="180" height="6" rx="2" fill="#d9d2c6" stroke={LINE} strokeWidth="1.2" />
      {/* 水和冰 */}
      {waterH > 3 && (
        <rect x={BEAKER.left + 2} y={waterTop} width={BEAKER.right - BEAKER.left - 4} height={waterH - 2} fill="#287fc4" opacity="0.22" />
      )}
      {waterH > 0.5 && <path d={`M${BEAKER.left + 2} ${waterTop}H${BEAKER.right - 2}`} stroke={BLUE} strokeWidth="2" />}
      {ICE_SLOTS.map(([x, y, rot], i) => {
        const floatY = waterH > 0.5 ? waterTop + iceSize * (0.25 + 0.12 * (i % 3)) : y;
        return <IcePiece key={i} x={x} y={Math.min(y, floatY)} size={iceSize} rot={rot} />;
      })}
      {shown.map((b, i) => (
        <circle key={b.id ?? i} cx={b.x} cy={b.y} r={b.r} fill="#f4f9fd" stroke={BLUE} strokeWidth="1.3" />
      ))}
      {/* 烧杯 */}
      <path d={`M104 184 L${BEAKER.left} ${BEAKER.top} V${BEAKER.bottom - 4} Q${BEAKER.left} ${BEAKER.bottom} ${BEAKER.left + 4} ${BEAKER.bottom} H${BEAKER.right - 4} Q${BEAKER.right} ${BEAKER.bottom} ${BEAKER.right} ${BEAKER.bottom - 4} V${BEAKER.top} L276 184`}
        fill="none" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      {/* 温度计：玻璃泡浸没，不碰杯底和杯壁 */}
      <g>
        <rect x="145" y="30" width="10" height="310" rx="5" fill="#fff" stroke={LINE} strokeWidth="1.5" />
        {Array.from({ length: 14 }, (_, i) => -20 + i * 10).map((T) => (
          <path key={T} d={`M${T % 50 === 0 ? 137 : 140} ${thermoY(T)}H145`} stroke={LINE} strokeWidth="1.2" />
        ))}
        <rect x="148" y={thermoY(sim.T)} width="4" height={340 - thermoY(sim.T)} fill={CORAL} />
        <circle cx="150" cy="344" r="7" fill={CORAL} stroke={LINE} strokeWidth="1.2" />
        <text x="133" y={thermoY(100) + 4} textAnchor="end" className={styles.svgTick}>100</text>
        <text x="133" y={thermoY(50) + 4} textAnchor="end" className={styles.svgTick}>50</text>
        <text x="133" y="36" textAnchor="end" className={styles.svgTick}>°C</text>
        <rect x="141" y="52" width="18" height="10" rx="2" fill="#dfe5e8" stroke={LINE} strokeWidth="1.2" />
      </g>
      {/* 酒精灯 */}
      <path d="M160 426 Q156 398 176 396 H204 Q224 398 220 426 Z" fill="#eef3f5" stroke={LINE} strokeWidth="1.5" />
      <rect x="183" y="386" width="14" height="10" rx="2" fill="#dfe5e8" stroke={LINE} strokeWidth="1.2" />
      {mode === "heat" && (
        <path className={reduced ? undefined : styles.flame} d="M190 370 C200 378 202 386 190 387 C178 386 180 378 190 370 Z" fill="#f2a33a" stroke={CORAL} strokeWidth="1.2" />
      )}
      {mode === "freezer" && (
        <g stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M274 270H302 M294 263 302 270 294 277" />
          <path d="M106 300H78 M86 293 78 300 86 307" />
          <text x="304" y="296" className={styles.svgNote} fill="#1f6aa6" stroke="none">放热</text>
        </g>
      )}
      {/* 沸腾时：杯口上方的“白气”和看不见的水蒸气 */}
      {boiling && (
        <g>
          <g className={reduced ? undefined : styles.mist} fill="#c9d3d8">
            <ellipse cx="200" cy="160" rx="34" ry="12" opacity="0.7" />
            <ellipse cx="236" cy="140" rx="26" ry="10" opacity="0.6" />
            <ellipse cx="190" cy="128" rx="22" ry="9" opacity="0.5" />
          </g>
          <path d="M280 146H262" stroke={LINE} strokeWidth="1.2" />
          <text x="284" y="142" className={styles.svgNote}>“白气”</text>
          <text x="284" y="160" className={styles.svgNote}>是小水滴</text>
          <path d={`M280 ${(BEAKER.top + waterTop) / 2}H250`} stroke={LINE} strokeWidth="1.2" strokeDasharray="3 3" />
          <text x="284" y={(BEAKER.top + waterTop) / 2 - 4} className={styles.svgNote}>水蒸气</text>
          <text x="284" y={(BEAKER.top + waterTop) / 2 + 14} className={styles.svgNote}>看不见</text>
        </g>
      )}
    </svg>
  );
}

// ---------- 温度—时间图像 ----------
const G = { x0: 56, x1: 500, y0: 24, y1: 292 };
const gy = (T) => G.y1 - ((T + 20) * (G.y1 - G.y0)) / 130;

function Graph({ points, sim }) {
  const span = Math.max(30, Math.ceil((sim.t + 4) / 10) * 10);
  const gx = (t) => G.x0 + (t / span) * (G.x1 - G.x0);
  const step = span <= 40 ? 5 : span <= 80 ? 10 : 20;
  const path = useMemo(() => {
    const every = Math.max(1, Math.ceil(points.length / 1200));
    let d = "";
    points.forEach((p, i) => {
      if (i % every && i !== points.length - 1) return;
      d += `${d ? "L" : "M"}${gx(p.t).toFixed(1)} ${gy(p.T).toFixed(1)}`;
    });
    return d;
  }, [points, span]); // eslint-disable-line react-hooks/exhaustive-deps
  // 水平段文字贴着水平段的起点，放在曲线不会经过的一侧：
  // 熔化之前曲线在 0 °C 以下、之后往上走，所以字放在线下方；凝固、沸腾之后曲线往下走，字放在线上方。
  const flats = [];
  for (const p of plateaus(points)) {
    if (gx(p.t1) - gx(p.t0) < 4) continue;
    const below = p.kind === "熔化";
    const x = gx(p.t0) + 3;
    const y = below ? gy(p.T) + 20 : gy(p.T) - 9;
    if (flats.some((f) => f.y === y && Math.abs(f.x - x) < 40)) continue;
    flats.push({ ...p, x, y });
  }
  return (
    <svg className={styles.graph} viewBox="0 0 520 340" role="img" aria-label="温度随时间变化的图像">
      {Array.from({ length: 14 }, (_, i) => -20 + i * 10).map((T) => (
        <path key={T} d={`M${G.x0} ${gy(T)}H${G.x1}`} stroke={T === MELT_T || T === BOIL_T ? LIGHT : "#e6ebed"} strokeWidth="1" strokeDasharray={T === MELT_T || T === BOIL_T ? "5 4" : undefined} />
      ))}
      {[-20, 0, 20, 40, 60, 80, 100].map((T) => (
        <text key={T} x={G.x0 - 8} y={gy(T) + 4} textAnchor="end" className={styles.svgTick}>{T < 0 ? `−${-T}` : T}</text>
      ))}
      {Array.from({ length: span / step + 1 }, (_, i) => i * step).map((t) => (
        <g key={t}>
          <path d={`M${gx(t)} ${G.y1}v5`} stroke={LINE} strokeWidth="1.2" />
          <text x={gx(t)} y={G.y1 + 20} textAnchor="middle" className={styles.svgTick}>{t}</text>
        </g>
      ))}
      <path d={`M${G.x0} ${G.y0 - 8}V${G.y1}H${G.x1 + 8}`} fill="none" stroke={LINE} strokeWidth="1.5" />
      <text x="8" y="14" className={styles.svgNote}>温度/°C</text>
      <text x={G.x1 + 8} y={G.y1 + 40} textAnchor="end" className={styles.svgNote}>时间/min</text>
      {path && <path d={path} fill="none" stroke={BLUE} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
      {flats.map((p) => (
        <text key={`${p.kind}-${p.t0}`} x={p.x} y={p.y} className={styles.flatLabel}>{p.kind}</text>
      ))}
      <circle cx={gx(sim.t)} cy={gy(sim.T)} r="5.5" fill={CORAL} stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

// ---------- 说明文字 ----------
function describe(sim, mode, q) {
  const phase = phaseOf(sim, mode);
  if (phase === "solid") {
    if (q > 0.5) return { state: "固态：冰", doing: "冰在升温", text: "冰在吸热，温度上升。还没到 0 °C，冰不会熔化。" };
    if (q < -0.5) return { state: "固态：冰", doing: "冰在降温", text: "冰在放热，温度下降，冰柜是 −20 °C，冰最多降到这里。" };
    return { state: "固态：冰", doing: "温度不变", text: "冰的温度和冰柜一样了，不再放热。" };
  }
  if (phase === "mixed") {
    if (q > 0.5) return {
      state: "固液共存：冰水混合物", doing: "熔化（固 → 液）",
      text: mode === "heat"
        ? "正在熔化：一直在吸热，温度却保持 0 °C 不变。冰是晶体，0 °C 是它的熔点。"
        : "没有加热，冰还在慢慢熔化——它在从周围的空气吸热，温度仍是 0 °C。",
    };
    if (q < -0.5) return { state: "固液共存：冰水混合物", doing: "凝固（液 → 固）", text: "正在凝固：一直在放热，温度保持 0 °C 不变。凝固点和熔点相同。" };
    return { state: "固液共存：冰水混合物", doing: "温度不变", text: "冰水混合物的温度是 0 °C。" };
  }
  if (phase === "boiling") return {
    state: "液态：水正在沸腾", doing: "沸腾（汽化，液 → 气）",
    text: "水沸腾了：酒精灯一直在加热，水一直在吸热，温度却保持 100 °C 不变。水少了，是变成水蒸气跑掉了。",
  };
  if (mode !== "heat" && sim.boiled > 0 && sim.T > 95) return { state: "液态：水", doing: "沸腾停止", text: "一停止加热，水就不再沸腾了：沸腾必须持续吸热。现在水向周围的空气放热，温度慢慢下降。" };
  if (q > 0.5) return { state: "液态：水", doing: "水在升温", text: mode === "heat" ? "水在吸热，温度上升。注意比一比：同样加热，水升温比冰慢。" : "水比室温低，在从周围的空气吸热，慢慢升温。" };
  if (q < -0.5) return { state: "液态：水", doing: "水在降温", text: mode === "freezer" ? "水在放热，温度下降，降到 0 °C 才会开始结冰。" : "停止加热后，水向周围的空气放热，温度慢慢下降。" };
  return { state: "液态：水", doing: "温度不变", text: `水温和室温（${ROOM_T} °C）一样了，不再吸热也不放热。` };
}

export default function StatesLab() {
  const [sim, setSim] = useState(initialLab);
  const [mode, setMode] = useState("stop");
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [points, setPoints] = useState(() => [{ t: 0, T: initialLab().T, phase: "solid", q: 0 }]);
  const [done, setDone] = useState({});
  const [autoOff, setAutoOff] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [reduced, setReduced] = useState(false);
  const live = useRef({ sim, mode, speed, points, bubbles: [], nextId: 1 });

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const mark = useCallback((key) => setDone((d) => (d[key] ? d : { ...d, [key]: true })), []);

  useEffect(() => {
    if (!running) return undefined;
    let frame;
    let last = performance.now();
    const loop = (now) => {
      const real = Math.min(0.1, (now - last) / 1000);
      last = now;
      const L = live.current;
      const before = L.sim;
      let next = stepLab(before, L.mode, real * SIM_MIN_PER_SEC * L.speed);
      let nextMode = L.mode;
      if (nextMode === "heat" && next.boiled >= MAX_BOIL_LOSS) {
        nextMode = "stop";
        setMode("stop");
        setAutoOff(true);
      }
      const phase = phaseOf(next, nextMode);
      const q = heatRate(next, nextMode);
      const lastPt = L.points[L.points.length - 1];
      if (next.t - lastPt.t >= 0.05 || phase !== lastPt.phase) {
        L.points = [...L.points, { t: next.t, T: next.T, phase, q }];
        setPoints(L.points);
      }
      if (phase === "mixed" && q > 0) mark("meltStart");
      if (before.ice > 0 && next.ice === 0) mark("meltDone");
      if (phase === "boiling") mark("boil");
      if (phase === "mixed" && q < 0) mark("freeze");
      if (L.lastPhase === "boiling" && phase !== "boiling" && nextMode !== "heat") mark("stopBoil");
      L.lastPhase = phase;
      // 气泡：沸腾时在杯底生成，上升、变大，到水面破裂
      let bs = L.bubbles;
      const waterTop = BEAKER.bottom - FULL_H * next.water;
      if (phase === "boiling" && !reduced) {
        bs = bs.map((b) => ({ ...b, y: b.y - b.v * real * 60, r: b.r + real * 3.2 })).filter((b) => b.y - b.r > waterTop);
        if (Math.random() < real * 14) bs.push({ id: L.nextId++, x: 118 + Math.random() * 144, y: BEAKER.bottom - 6, r: 1.5 + Math.random(), v: 1 + Math.random() * 0.8 });
        bs = bs.filter((b) => Math.abs(b.x - 150) > b.r + 6); // 不压住温度计
      } else bs = [];
      L.bubbles = bs;
      setBubbles(bs);
      L.sim = next;
      L.mode = nextMode;
      setSim(next);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running, reduced, mark]);

  const choose = (key) => {
    live.current.mode = key;
    setMode(key);
    setAutoOff(false);
    if (key !== "heat") { live.current.bubbles = []; setBubbles([]); }
    if (key === "heat" && sim.boiled >= MAX_BOIL_LOSS) return;
    setRunning(true);
  };
  const reset = () => {
    const first = initialLab();
    live.current = { sim: first, mode: "stop", speed: live.current.speed, points: [{ t: 0, T: first.T, phase: "solid", q: 0 }], bubbles: [], nextId: 1 };
    setSim(first); setMode("stop"); setRunning(false); setPoints(live.current.points);
    setDone({}); setAutoOff(false); setBubbles([]);
  };

  const q = running ? heatRate(sim, mode) : 0;
  const info = running ? describe(sim, mode, q) : { state: "固态：冰", doing: "还没开始", text: "烧杯里是刚从冰柜拿出来的碎冰，−20 °C。按“加热”开始实验。" };
  const flow = !running || Math.abs(q) < 0.5 ? "none" : q > 0 ? "in" : "out";
  const doneCount = TASKS.filter((t) => done[t.key]).length;
  const boilFull = sim.boiled >= MAX_BOIL_LOSS;

  return (
    <div className={styles.lab}>
      <Card className={styles.bench}>
        <div className={styles.stage}>
          <div className={styles.beakerWrap}>
            <Beaker sim={sim} mode={running ? mode : "stop"} bubbles={bubbles} reduced={reduced} />
          </div>
          <div className={styles.graphWrap}>
            <Graph points={points} sim={sim} />
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.modeButtons} role="group" aria-label="怎样处理烧杯">
            {MODES.map((m) => {
              const on = running && mode === m.key;
              return (
                <button key={m.key} type="button" aria-pressed={on}
                  className={`island-btn ${styles.modeBtn} ${on ? `island-btn--primary ${styles[`on_${m.key}`]}` : ""}`}
                  disabled={m.key === "heat" && boilFull}
                  onClick={() => choose(m.key)}>
                  {m.label}
                </button>
              );
            })}
          </div>
          <div className={styles.sideControls}>
            <Tabs bare items={SPEEDS} defaultKey="1" onChange={(k) => { live.current.speed = Number(k); setSpeed(Number(k)); }} />
            <button type="button" className={`island-btn ${styles.resetBtn}`} onClick={reset}>重来</button>
          </div>
        </div>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.status}>
          <Title as="h2" variant="tab" tone="teal">现在的情况</Title>
          <div className={styles.readRow}>
            <div className={styles.reading}>
              <span className={styles.readLabel}>温度计读数</span>
              <strong className={styles.readValue}>{fmtT(sim.T)}<small> °C</small></strong>
              <span className={styles.readTime}>第 {sim.t.toFixed(1)} 分钟</span>
            </div>
            <dl className={styles.facts}>
              <div><dt>状态</dt><dd>{info.state}</dd></div>
              <div><dt>正在发生</dt><dd>{info.doing}</dd></div>
              <div>
                <dt>热量</dt>
                <dd className={styles[`flow_${flow}`]}>{flow === "in" ? "正在吸热" : flow === "out" ? "正在放热" : "不吸热也不放热"}</dd>
              </div>
            </dl>
          </div>
          <p className={styles.explain}>{info.text}</p>
          {sim.ice > 0 && sim.water > 0 && (
            <Progress value={Math.round(sim.ice * 100)} tone="blue" label={`冰还剩 ${Math.round(sim.ice * 100)}%`} ariaLabel="冰还剩多少" />
          )}
          {autoOff && <Notice type="warning" title="酒精灯自动熄灭了">水已经烧掉了三成，先停一停。可以按“放进冰柜”接着做，或者按“重来”。</Notice>}
          <p className={styles.condition}>按标准大气压、室温 {ROOM_T} °C 模拟；冰柜温度 {FREEZER_T} °C。</p>
        </Card>

        <Card className={styles.tasks}>
          <Title as="h2" variant="tab" tone="green">实验任务</Title>
          <Progress value={doneCount} max={TASKS.length} label={`${doneCount} / ${TASKS.length}`} ariaLabel="实验任务完成了几项" />
          <ul className={styles.taskList}>
            {TASKS.map((t) => (
              <li key={t.key}><Check checked={Boolean(done[t.key])} onChange={() => {}}>{t.text}</Check></li>
            ))}
          </ul>
          {doneCount === TASKS.length && (
            <Notice type="success" title="实验全部完成！">熔化、沸腾、凝固时，温度都保持不变——图像上那几段水平线就是证据。</Notice>
          )}
        </Card>
      </div>
    </div>
  );
}

// ---------- 六种物态变化 ----------
const NODES = { solid: [260, 64, "固态"], liquid: [440, 300, "液态"], gas: [80, 300, "气态"] };
const CHANGES = [
  { key: "melt", name: "熔化", from: "solid", to: "liquid", absorb: true, examples: ["冰化成水", "海波、各种金属熔化：是晶体，有熔点，熔化时温度不变", "石蜡、松香熔化：是非晶体，没有熔点"] },
  { key: "freeze", name: "凝固", from: "liquid", to: "solid", absorb: false, examples: ["水结成冰", "同一种物质的凝固点和它的熔点相同"] },
  { key: "vapor", name: "汽化", from: "liquid", to: "gas", absorb: true, examples: ["蒸发：任何温度下都能发生，只在液体表面", "沸腾：在沸点，液体内部和表面同时汽化", "汗液蒸发吸热，调节体温", "电冰箱利用汽化制冷"] },
  { key: "condense", name: "液化", from: "gas", to: "liquid", absorb: false, examples: ["露珠", "呼出的“白气”、烧开水时的“白气”", "从寒冷的室外进屋，眼镜片蒙上小水珠", "水蒸气烫伤往往比开水更严重：液化还要放热"] },
  { key: "sublime", name: "升华", from: "solid", to: "gas", absorb: true, examples: ["樟脑片慢慢变小，最后不见了", "冬天结冰的衣服也会慢慢变干", "干冰升华吸热，用来制冷"] },
  { key: "deposit", name: "凝华", from: "gas", to: "solid", absorb: false, examples: ["霜", "窗玻璃上的冰花", "树枝上的雾凇"] },
];

// 两点之间的一条箭头，offset 是向一侧平移的距离；返回线段端点和标签位置
function arrowGeom(a, b, offset, labelOut) {
  const [x1, y1] = NODES[a];
  const [x2, y2] = NODES[b];
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  const pad = 44;
  const sx = x1 + ux * pad + nx * offset, sy = y1 + uy * pad + ny * offset;
  const ex = x2 - ux * pad + nx * offset, ey = y2 - uy * pad + ny * offset;
  const mx = (sx + ex) / 2 + nx * labelOut, my = (sy + ey) / 2 + ny * labelOut;
  return { sx, sy, ex, ey, mx, my, ux, uy, nx, ny };
}

export function SixChanges() {
  const [sel, setSel] = useState(null);
  const current = CHANGES.find((c) => c.key === sel);
  return (
    <div className={styles.six}>
      <svg className={styles.sixSvg} viewBox="0 0 520 360" role="group" aria-label="六种物态变化，点箭头查看">
        <defs>
          {[["hot", CORAL], ["cold", BLUE]].map(([id, color]) => (
            <marker key={id} id={`six-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" fill={color} />
            </marker>
          ))}
        </defs>
        {CHANGES.map((c) => {
          // 同一对状态之间的两条箭头方向相反，各自往自己的左手边平移，自然分在两侧
          const geo = arrowGeom(c.from, c.to, 13, 28);
          const color = c.absorb ? CORAL : BLUE;
          const on = sel === c.key;
          const faded = sel && !on;
          return (
            <g key={c.key} className={styles.sixArrow} role="button" tabIndex={0} aria-pressed={on}
              aria-label={`${c.name}，${NODES[c.from][2]}变${NODES[c.to][2]}，${c.absorb ? "吸热" : "放热"}`}
              onClick={() => setSel(on ? null : c.key)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(on ? null : c.key); } }}
              opacity={faded ? 0.35 : 1}>
              <path d={`M${geo.sx} ${geo.sy}L${geo.ex} ${geo.ey}`} stroke="transparent" strokeWidth="30" />
              <path d={`M${geo.sx} ${geo.sy}L${geo.ex} ${geo.ey}`} stroke={color} strokeWidth={on ? 5 : 3.5} strokeLinecap="round" markerEnd={`url(#six-${c.absorb ? "hot" : "cold"})`} />
              <rect x={geo.mx - 26} y={geo.my - 15} width="52" height="30" rx="15" fill={on ? color : "#fff"} stroke={color} strokeWidth="1.5" />
              <text x={geo.mx} y={geo.my + 5} textAnchor="middle" className={styles.sixLabel} fill={on ? "#fff" : c.absorb ? "#a8433c" : "#1f6aa6"}>{c.name}</text>
            </g>
          );
        })}
        {Object.entries(NODES).map(([k, [x, y, label]]) => (
          <g key={k}>
            <circle cx={x} cy={y} r="34" fill="#fff" stroke={LINE} strokeWidth="2" />
            <text x={x} y={y + 6} textAnchor="middle" className={styles.sixNode}>{label}</text>
          </g>
        ))}
      </svg>
      <div className={styles.sixSide}>
        <p className={styles.legend}>
          <span className={styles.hot}>红色箭头：吸热</span>
          <span className={styles.cold}>蓝色箭头：放热</span>
        </p>
        <p className={styles.rule}>好记的规律：往“固 → 液 → 气”方向变都要吸热，反过来都会放热。</p>
        {current ? (
          <div className={styles.detail}>
            <h3>{current.name}<span>{NODES[current.from][2]} → {NODES[current.to][2]}</span></h3>
            <p className={current.absorb ? styles.hot : styles.cold}>{current.absorb ? "吸热" : "放热"}</p>
            <ul>{current.examples.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        ) : (
          <Card variant="dashed" className={styles.hint}>点一条箭头，看看它叫什么、吸热还是放热、生活里在哪儿见过。</Card>
        )}
      </div>
    </div>
  );
}
