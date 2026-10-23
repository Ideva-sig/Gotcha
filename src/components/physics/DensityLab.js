"use client";

// 测量物质的密度实验室：先调天平，再用天平称质量、用量筒量体积，算出密度。
// 物理模型在 src/lib/densityLab.js。画面不做自动动画，服务器渲染出来的初始画面就是完整的静态图。
import { useEffect, useRef, useState } from "react";
import { Card, Check, Notice, Progress, Tabs, Title } from "@/components/island/Island";
import {
  BRINE, CYL_MAX, NUT_BAL, NUT_MAX, NUT_MIN, POUR_MIN, RIDER_DIV, RIDER_MAX, STONE, STONE_MIN_WATER, WEIGHTS,
  adjustNut, balanceHint, balanced, brineResult, clamp, cylinderReading, dropStone, emptyRecords, initialState, isLeveled,
  measurement, pointerPos, pourBrine, pourWater, reading, riderU, stoneResult, takeStone, taskStatus, updateRecords, weightsU, gOf,
} from "@/lib/densityLab";
import styles from "./DensityLab.module.css";

const BLUE = "#287fc4";
const CORAL = "#c9554d";
const YELLOW = "#bf8d08";
const GREEN = "#197a60";
const LINE = "#52626a";
const LIGHT = "#bec9ce";
const INK = "#20272b";

const f1 = (x) => x.toFixed(1);
const f2 = (x) => String(Number(x.toFixed(2)));

// ---------- 实验台尺寸 ----------
const PX = 240; // 支点
const PY = 215;
const HALF = 180; // 横梁半长
const DT = 16; // 分度盘每格多少像素
const RAD = Math.PI / 180;
const RULER_X = 60;
const RULER_Y = 420;
const RULER_STEP = 14.4; // 游码每格 0.2 g
const CYL_X = 640;
const CYL_W = 80;
const CYL_TOP = 70;
const CYL_BOT = 400;
const PER_ML = (CYL_BOT - CYL_TOP) / CYL_MAX;
const yOf = (v) => CYL_BOT - v * PER_ML;

function Pan({ x, y, children }) {
  return (
    <g>
      <path d={`M${x} ${y - 110}L${x - 44} ${y}M${x} ${y - 110}L${x + 44} ${y}`} stroke={LINE} strokeWidth="1.6" fill="none" />
      <rect x={x - 52} y={y} width="104" height="7" rx="3" fill="#dfe7ea" stroke={LINE} strokeWidth="1.6" />
      {children}
    </g>
  );
}

function StoneShape({ x, y, size = 1 }) {
  return (
    <path d={`M${x - 24 * size} ${y}L${x - 18 * size} ${y - 18 * size}L${x - 2 * size} ${y - 28 * size}L${x + 16 * size} ${y - 22 * size}L${x + 26 * size} ${y - 6 * size}L${x + 20 * size} ${y}Z`}
      fill="#a9b4ba" stroke={LINE} strokeWidth="1.8" strokeLinejoin="round" />
  );
}

function Beaker({ x, y, vol }) {
  const h = 44;
  const fill = (clamp(vol, 0, BRINE.volume0) / BRINE.volume0) * 36;
  return (
    <g>
      {fill > 0 && <rect x={x - 25} y={y - fill - 1} width="50" height={fill} fill="#d4e6f4" />}
      <path d={`M${x - 27} ${y - h}V${y}H${x + 27}V${y - h}`} fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
    </g>
  );
}

function Bench({ s, onRider }) {
  const svgRef = useRef(null);
  const dragging = useRef(false);
  const pos = pointerPos(s);
  const tilt = pos * 1.2; // 横梁倾斜角度（顺时针为正，右端下沉）
  const c = Math.cos(tilt * RAD);
  const sn = Math.sin(tilt * RAD);
  const lx = PX - HALF * c;
  const ly = PY - HALF * sn;
  const rx = PX + HALF * c;
  const ry = PY + HALF * sn;
  const stone = s.mode === "stone";
  const wTotal = weightsU(s) / 10;
  const placed = WEIGHTS.map((w, i) => ({ w, i })).filter((p) => s.weights[p.i]);
  const dirWord = pos === 0 ? "指针指在中线" : pos < 0 ? "指针偏左" : "指针偏右";
  const cyl = cylinderReading(s);
  const cylName = stone ? "水" : "盐水";
  const brineVol = BRINE.volume0 - s.poured;
  const nutX = 4 * s.nut;

  const toX = (e) => {
    const svg = svgRef.current;
    const m = svg.getScreenCTM();
    if (!m) return null;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()).x;
  };
  const move = (e) => {
    if (!dragging.current) return;
    const x = toX(e);
    if (x == null) return;
    onRider(clamp(Math.round((x - RULER_X) / RULER_STEP), 0, RIDER_MAX));
  };
  const start = (e) => {
    e.preventDefault();
    dragging.current = true;
    svgRef.current.setPointerCapture?.(e.pointerId);
    move(e);
  };
  const stop = () => { dragging.current = false; };
  const keys = (e) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    onRider(clamp(s.rider + d, 0, RIDER_MAX));
  };

  const riderX = RULER_X + s.rider * RULER_STEP;

  return (
    <svg ref={svgRef} className={styles.bench} viewBox="0 0 800 500" role="group"
      aria-label={`托盘天平和量筒：${dirWord}，砝码 ${f1(wTotal)} 克，游码 ${f1(riderU(s) / 10)} 克，量筒读数 ${cyl} 毫升`}
      onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
      {/* 分度盘和指针 */}
      <text x={PX} y="66" textAnchor="middle" className={styles.partLabel}>分度盘</text>
      <path d={`M${PX - 5.5 * DT} 100H${PX + 5.5 * DT}`} stroke={LIGHT} strokeWidth="2" />
      {Array.from({ length: 11 }, (_, i) => i - 5).map((k) => (
        <path key={k} d={`M${PX + k * DT} ${k === 0 ? 86 : 94}V106`} stroke={k === 0 ? INK : LINE} strokeWidth={k === 0 ? 3 : 1.8} />
      ))}
      <path d={`M${PX} ${PY}L${PX + pos * DT} 108`} stroke={CORAL} strokeWidth="4" strokeLinecap="round" />

      {/* 支架 */}
      <path d={`M${PX - 12} ${PY}V300M${PX + 12} ${PY}V300`} stroke={LINE} strokeWidth="1.8" fill="#eef2f3" />
      <rect x={PX - 30} y="300" width="60" height="14" rx="4" fill="#dfe7ea" stroke={LINE} strokeWidth="1.8" />
      <rect x={PX - 110} y="314" width="220" height="12" rx="4" fill="#dfe7ea" stroke={LINE} strokeWidth="1.8" />

      {/* 横梁 */}
      <g transform={`rotate(${tilt} ${PX} ${PY})`}>
        <rect x={PX - HALF} y={PY - 8} width={2 * HALF} height="16" rx="4" fill="#eef2f3" stroke={LINE} strokeWidth="1.8" />
        {[-1, 1].map((sd) => (
          <rect key={sd} x={PX + sd * (HALF - 18) + nutX - 7} y={PY - 13} width="14" height="26" rx="3" fill="#f1e2b0" stroke={YELLOW} strokeWidth="1.8" />
        ))}
        <circle cx={PX} cy={PY} r="5" fill={INK} />
      </g>

      {/* 左盘：被测物；右盘：砝码 */}
      <Pan x={lx} y={ly + 110}>
        {s.onPan && stone && <StoneShape x={lx} y={ly + 110} />}
        {s.onPan && !stone && <Beaker x={lx} y={ly + 110} vol={brineVol} />}
      </Pan>
      <Pan x={rx} y={ry + 110}>
        {placed.map((p, k) => (
          <g key={p.i}>
            <rect x={rx - 48 + (k % 3) * 33} y={ry + 110 - 24 - Math.floor(k / 3) * 26} width="30" height="23" rx="3" fill="#f1e2b0" stroke={YELLOW} strokeWidth="1.6" />
            <text x={rx - 33 + (k % 3) * 33} y={ry + 110 - 7 - Math.floor(k / 3) * 26} textAnchor="middle" className={styles.weightText}>{p.w}</text>
          </g>
        ))}
      </Pan>
      <text x={lx} y={ly + 134} textAnchor="middle" className={styles.partLabel}>左盘：{stone ? "小石块" : "烧杯和盐水"}</text>
      <text x={rx} y={ry + 134} textAnchor="middle" className={styles.partLabel}>右盘：砝码</text>

      {/* 没放在盘里的被测物 */}
      {!s.onPan && stone && !s.immersed && <StoneShape x={540} y={340} />}
      {!s.onPan && !stone && <Beaker x={540} y={340} vol={brineVol} />}

      {/* 标尺和游码 */}
      <text x={RULER_X - 4} y={RULER_Y + 5} textAnchor="end" className={styles.partLabel}>标尺</text>
      <path d={`M${RULER_X} ${RULER_Y}H${RULER_X + RIDER_MAX * RULER_STEP}`} stroke={LINE} strokeWidth="2" />
      {Array.from({ length: RIDER_MAX + 1 }, (_, i) => i).map((i) => (
        <path key={i} d={`M${RULER_X + i * RULER_STEP} ${RULER_Y}V${RULER_Y + (i % 5 === 0 ? 14 : 8)}`} stroke={LINE} strokeWidth="1.6" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((g) => (
        <text key={g} x={RULER_X + g * 5 * RULER_STEP} y={RULER_Y + 32} textAnchor="middle" className={styles.tick}>{g}</text>
      ))}
      <text x={RULER_X + RIDER_MAX * RULER_STEP + 12} y={RULER_Y + 32} className={styles.tick}>g</text>
      <path d={`M${riderX} ${RULER_Y - 2}L${riderX - 9} ${RULER_Y - 22}H${riderX + 9}Z`} fill={BLUE} stroke={BLUE} strokeWidth="1.5" strokeLinejoin="round" />
      <rect x={riderX - 9} y={RULER_Y - 36} width="18" height="14" rx="3" fill="#d4e6f4" stroke={BLUE} strokeWidth="1.6" />

      {/* 量筒 */}
      <text x={CYL_X - 8} y={CYL_TOP - 14} textAnchor="end" className={styles.tick}>mL</text>
      <rect x={CYL_X} y={yOf(cyl)} width={CYL_W} height={CYL_BOT - yOf(cyl)} fill={stone ? "#d4e6f4" : "#bcd9ee"} />
      <path d={`M${CYL_X} ${yOf(cyl) - 3}Q${CYL_X + CYL_W / 2} ${yOf(cyl) + 6} ${CYL_X + CYL_W} ${yOf(cyl) - 3}`} fill="none" stroke={BLUE} strokeWidth="2" />
      {stone && s.immersed && <StoneShape x={CYL_X + CYL_W / 2} y={CYL_BOT - 3} size={0.8} />}
      <path d={`M${CYL_X} ${CYL_TOP}V${CYL_BOT}H${CYL_X + CYL_W}V${CYL_TOP}`} fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
      {Array.from({ length: CYL_MAX + 1 }, (_, v) => v).filter((v) => v > 0 && v % 10 !== 0 && v % 5 === 0).map((v) => (
        <path key={v} d={`M${CYL_X} ${yOf(v)}h9`} stroke={LINE} strokeWidth="1.4" />
      ))}
      {Array.from({ length: CYL_MAX / 10 }, (_, k) => (k + 1) * 10).map((v) => (
        <g key={v}>
          <path d={`M${CYL_X} ${yOf(v)}h16`} stroke={LINE} strokeWidth="1.8" />
          <text x={CYL_X - 8} y={yOf(v) + 5} textAnchor="end" className={styles.tick}>{v}</text>
        </g>
      ))}
      {cyl > 0 && <path d={`M${CYL_X + 18} ${yOf(cyl) + 6}H${CYL_X + CYL_W - 4}`} stroke={CORAL} strokeWidth="2" strokeDasharray="5 4" />}
      <text x={CYL_X + CYL_W / 2} y={CYL_BOT + 26} textAnchor="middle" className={styles.partLabel}>量筒</text>

      {/* 读数条：固定在最下面 */}
      <text x="24" y="490" className={styles.sideText} fill={BLUE}>{`砝码 ${f1(wTotal)} g + 游码 ${f1(riderU(s) / 10)} g = ${f1(reading(s))} g`}</text>
      <text x="776" y="490" textAnchor="end" className={styles.sideText} fill={CORAL}>{`量筒中${cylName}：${cyl} mL`}</text>

      {/* 游码拖动区 */}
      <rect className={styles.handle} x={RULER_X - 20} y={RULER_Y - 44} width={RIDER_MAX * RULER_STEP + 40} height="70" fill="transparent"
        tabIndex={0} role="slider" aria-label="游码的位置" aria-valuemin={0} aria-valuemax={RIDER_MAX} aria-valuenow={s.rider}
        aria-valuetext={`游码左边缘在 ${f1(riderU(s) / 10)} 克`}
        onPointerDown={start} onKeyDown={keys} />
    </svg>
  );
}

const TASKS = [
  { key: "level", text: "把游码拨到零刻度线，调节平衡螺母，使指针指在分度盘中线" },
  { key: "mass", text: "用天平正确称出一个物体的质量（左物右码，最后拨游码）" },
  { key: "volume", text: "用量筒测出小石块的体积（放入前后两次读数）" },
  { key: "stone", text: "算出小石块的密度" },
  { key: "brine", text: `按课本步骤测盐水的密度：m₁ → 倒入量筒（至少 ${POUR_MIN} mL）读 V → m₂` },
];

const MODES = [
  { key: "stone", label: "测小石块的密度" },
  { key: "brine", label: "测盐水的密度" },
];

export default function DensityLab() {
  const [s, setS] = useState(() => initialState("stone"));
  const [rec, setRec] = useState(emptyRecords);
  const [leveledOnce, setLeveledOnce] = useState(false);
  const [warn, setWarn] = useState(false);
  const [problem, setProblem] = useState(null);

  useEffect(() => {
    if (isLeveled(s)) setLeveledOnce(true);
    setRec((r) => updateRecords(r, s));
  }, [s]);

  const stone = s.mode === "stone";
  const done = taskStatus(rec, leveledOnce);
  const doneCount = TASKS.filter((t) => done[t.key]).length;
  const m = measurement(s);
  const hasM1 = rec.brine.m1 != null;
  const sr = stoneResult(rec);
  const br = brineResult(rec);

  const nut = (d) => {
    const r = adjustNut(s, d);
    setS(r.state);
    setWarn(r.warn);
  };
  const rider = (n) => { setS((o) => ({ ...o, rider: n })); if (n === 0) setWarn(false); };
  const toggleWeight = (i) => setS((o) => ({ ...o, weights: o.weights.map((v, k) => (k === i ? !v : v)) }));
  const changeMode = (key) => { setS((o) => ({ ...initialState(key), nut: o.nut, rider: o.rider, weights: o.weights })); setWarn(false); setProblem(null); };
  const water = (d) => setS((o) => pourWater(o, d));
  const drop = () => {
    const r = dropStone(s);
    setS(r.state);
    setProblem(r.problem);
  };
  const reset = () => { setS(initialState(s.mode)); setRec(emptyRecords()); setLeveledOnce(false); setWarn(false); setProblem(null); };

  const explain = (() => {
    if (warn) return "游码不在零刻度线！先把游码移回零刻度线，再调平衡螺母，否则天平调不准。";
    if (m != null) return stone ? `横梁水平平衡：小石块的质量 = 砝码总质量 + 游码左边缘对应的质量 = ${f1(m)} g。` : `横梁水平平衡：这时盘里的质量是 ${f1(m)} g（砝码总质量 + 游码左边缘对应的质量）。`;
    return balanceHint(s);
  })();

  const cylText = (() => {
    if (!stone) {
      if (!hasM1) return "先把烧杯和盐水放在左盘，称出杯和盐水的总质量 m₁，再往量筒里倒。";
      return s.poured === 0 ? "m₁ 已经记下来了。把一部分盐水倒进量筒，读出体积 V，再称杯和剩余盐水的质量 m₂。" : `量筒里有 ${s.poured} mL 盐水，视线要和凹液面的最低处相平。再称杯和剩余盐水的质量 m₂。`;
    }
    if (problem === "low") return `水太少，石块浸不没（至少要 ${STONE_MIN_WATER} mL 左右）。再倒一点水。`;
    if (problem === "high") return `水太多，放进石块后会超出量程 ${CYL_MAX} mL。倒掉一点水。`;
    if (s.immersed) return `石块浸没后读数 ${cylinderReading(s)} mL，放入前是 ${s.water} mL。石块的体积 V = V₂ − V₁ = ${STONE.volume} cm³。`;
    return `量筒里有 ${s.water} mL 水。读数时视线与凹液面最低处相平，再放入石块，用两次读数的差求体积。`;
  })();

  return (
    <div className={styles.lab}>
      <Card className={styles.benchCard}>
        <Tabs bare items={MODES} defaultKey="stone" onChange={changeMode} />
        <Bench s={s} onRider={rider} />

        <div className={styles.controls}>
          <div className={styles.group} role="group" aria-label="平衡螺母">
            <span className={styles.groupLabel}>平衡螺母</span>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.nut <= NUT_MIN} onClick={() => nut(-1)}>向左调</button>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.nut >= NUT_MAX} onClick={() => nut(1)}>向右调</button>
          </div>

          <div className={styles.group} role="group" aria-label="游码">
            <span className={styles.groupLabel}>游码</span>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.rider <= 0} onClick={() => rider(s.rider - 1)}>左移一格</button>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.rider >= RIDER_MAX} onClick={() => rider(s.rider + 1)}>右移一格</button>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.rider === 0} onClick={() => rider(0)}>拨回零刻度线</button>
          </div>

          <div className={styles.group} role="group" aria-label="砝码盒">
            <span className={styles.groupLabel}>砝码盒（点一下放上或取下）</span>
            {WEIGHTS.map((w, i) => (
              <button key={i} type="button" aria-pressed={s.weights[i]} className={`island-btn ${s.weights[i] ? "island-btn--primary" : ""} ${styles.stepBtn}`} onClick={() => toggleWeight(i)}>{w} g</button>
            ))}
          </div>

          <div className={styles.group} role="group" aria-label="被测物">
            <span className={styles.groupLabel}>{stone ? "小石块" : "烧杯和盐水"}</span>
            <button type="button" aria-pressed={s.onPan} className={`island-btn ${s.onPan ? "island-btn--primary" : ""} ${styles.stepBtn}`} onClick={() => setS((o) => ({ ...o, onPan: !o.onPan }))}>
              {s.onPan ? "从左盘拿下" : "放在左盘"}
            </button>
          </div>

          {stone ? (
            <div className={styles.group} role="group" aria-label="量筒里的水和石块">
              <span className={styles.groupLabel}>量筒</span>
              <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.immersed || s.water >= CYL_MAX} onClick={() => water(10)}>倒入 10 mL</button>
              <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.immersed || s.water >= CYL_MAX} onClick={() => water(1)}>倒入 1 mL</button>
              <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.immersed || s.water <= 0} onClick={() => water(-10)}>倒出 10 mL</button>
              <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.immersed || s.water <= 0} onClick={() => water(-1)}>倒出 1 mL</button>
              {s.immersed ? (
                <button type="button" className={`island-btn ${styles.stepBtn}`} onClick={() => { setS(takeStone); setProblem(null); }}>取出石块</button>
              ) : (
                <button type="button" className={`island-btn island-btn--primary ${styles.stepBtn}`} onClick={drop}>用细线把石块放入量筒</button>
              )}
            </div>
          ) : (
            <div className={styles.group} role="group" aria-label="把盐水倒进量筒">
              <span className={styles.groupLabel}>倒进量筒</span>
              <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={!hasM1 || s.poured >= BRINE.volume0} onClick={() => setS((o) => pourBrine(o, 10, hasM1))}>倒入 10 mL</button>
              <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={!hasM1 || s.poured >= BRINE.volume0} onClick={() => setS((o) => pourBrine(o, 1, hasM1))}>倒入 1 mL</button>
              {!hasM1 && <span className={styles.note}>先称出 m₁，才能往量筒里倒。</span>}
            </div>
          )}

          <div className={styles.group}>
            <button type="button" className={`island-btn ${styles.stepBtn}`} onClick={reset}>重来</button>
          </div>
        </div>
        <p className={styles.dragHint}>可以沿标尺拖动游码，也可以点按钮一格一格挪。砝码盒：100 g、50 g、20 g、20 g、10 g、5 g 各一个；标尺 0～5 g，分度值 {RIDER_DIV} g，游码读左边缘；量筒量程 {CYL_MAX} mL，分度值 1 mL。</p>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.status}>
          <Title as="h2" variant="tab" tone="teal">现在的情况</Title>
          <div className={styles.readGrid}>
            <div className={`${styles.reading} ${styles.readingA}`}>
              <span className={styles.readLabel}>砝码总质量</span>
              <strong className={styles.readValue}>{f1(gOf(weightsU(s)))}<small> g</small></strong>
            </div>
            <div className={`${styles.reading} ${styles.readingA}`}>
              <span className={styles.readLabel}>游码左边缘</span>
              <strong className={styles.readValue}>{f1(gOf(riderU(s)))}<small> g</small></strong>
            </div>
            <div className={`${styles.reading} ${styles.readingB}`}>
              <span className={styles.readLabel}>天平读数</span>
              <strong className={styles.readValue}>{f1(reading(s))}<small> g</small></strong>
            </div>
            <div className={`${styles.reading} ${styles.readingB}`}>
              <span className={styles.readLabel}>量筒读数</span>
              <strong className={styles.readValue}>{cylinderReading(s)}<small> mL</small></strong>
            </div>
          </div>
          <dl className={styles.facts}>
            <div><dt>指针</dt><dd>{pointerPos(s) === 0 ? "在中线" : pointerPos(s) < 0 ? "偏左" : "偏右"}</dd></div>
            <div><dt>横梁</dt><dd>{balanced(s) ? "水平平衡" : "没有平衡"}</dd></div>
            <div><dt>螺母</dt><dd>{s.nut === NUT_BAL ? "已调好" : "还没调好"}</dd></div>
          </dl>
          <p className={styles.explain}>{explain}</p>
          <p className={styles.explain}>{cylText}</p>
        </Card>

        <Card className={styles.tasks}>
          <Title as="h2" variant="tab" tone="green">实验任务</Title>
          <Progress value={doneCount} max={TASKS.length} label={`${doneCount} / ${TASKS.length}`} ariaLabel="实验任务完成了几项" />
          <ul className={styles.taskList}>
            {TASKS.map((t) => (
              <li key={t.key}><Check checked={done[t.key]} onChange={() => {}}>{t.text}</Check></li>
            ))}
          </ul>
          {doneCount === TASKS.length && (
            <Notice type="success" title="实验全部完成！">小石块和盐水的密度都测出来了：先测质量、再测体积，用 ρ = m/V 算出密度。</Notice>
          )}
        </Card>
      </div>

      <div className={styles.panels}>
        <Card className={styles.records}>
          <Title as="h2" variant="tab" tone="blue">实验记录</Title>
          <p className={styles.note}>天平调好、横梁水平平衡时自动记下质量；量筒读数自动记下体积。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className={styles.caption}>测小石块的密度</caption>
              <thead>
                <tr><th>石块质量 m/g</th><th>水的体积 V₁/cm³</th><th>水和石块的总体积 V₂/cm³</th><th>石块体积 V/cm³</th><th>密度 ρ/(g·cm⁻³)</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>{rec.stone.m == null ? "—" : f1(rec.stone.m)}</td>
                  <td>{rec.stone.V1 ?? "—"}</td>
                  <td>{rec.stone.V2 ?? "—"}</td>
                  <td>{sr ? sr.V : "—"}</td>
                  <td>{sr ? f2(sr.rho) : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className={styles.caption}>测盐水的密度</caption>
              <thead>
                <tr><th>杯和盐水的质量 m₁/g</th><th>杯和剩余盐水的质量 m₂/g</th><th>量筒中盐水的质量 m(=m₁−m₂)/g</th><th>量筒中盐水的体积 V/cm³</th><th>盐水的密度 ρ/(g·cm⁻³)</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>{rec.brine.m1 == null ? "—" : f1(rec.brine.m1)}</td>
                  <td>{rec.brine.m2 == null ? "—" : f1(rec.brine.m2)}</td>
                  <td>{br ? f1(br.m) : "—"}</td>
                  <td>{br ? br.V : "—"}</td>
                  <td>{br ? f2(br.rho) : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card className={styles.rules}>
          <Title as="h2" variant="tab" tone="yellow">测密度的方法</Title>
          <p className={styles.note}>测出质量和体积后，这里写出结果。</p>
          {sr || br ? (
            <>
              <p className={styles.conclusion}>ρ = m/V</p>
              {sr && <p className={styles.result}>小石块：ρ = {f1(sr.m)} g ÷ {sr.V} cm³ = {f2(sr.rho)} g/cm³</p>}
              {br && <p className={styles.result}>盐水：ρ = {f1(br.m)} g ÷ {br.V} cm³ = {f2(br.rho)} g/cm³</p>}
              <p className={styles.note}>测盐水：先测杯和盐水的总质量 m₁，把一部分盐水倒进量筒读出体积 V，再测杯和剩余盐水的质量 m₂，量筒中盐水的质量 m = m₁ − m₂。测小石块：用两次读数的差得到体积，V = V₂ − V₁。</p>
            </>
          ) : (
            <p className={styles.empty}>还没做出来。测出质量和体积后，用 ρ = m/V 算密度。</p>
          )}
        </Card>
      </div>
    </div>
  );
}
