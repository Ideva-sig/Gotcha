"use client";

// 杠杆实验室：调平衡螺母、在两侧挂钩码或用测力计拉，把平衡时的数据记进课本那样的表格。
// 物理模型在 src/lib/leverLab.js。画面不做自动动画，服务器渲染出来的初始画面就是完整的静态图。
import { useEffect, useRef, useState } from "react";
import { Card, Check, Notice, Progress, Title } from "@/components/island/Island";
import {
  CELL, HOLES, HOOK_N, MAX_HOOKS, NUT_BAL, NUT_MAX, NUT_MIN, SCALE_MAX, THETAS,
  addRecord, clamp, evaluate, initialState, recordRow, taskStatus, tiltDir,
} from "@/lib/leverLab";
import styles from "./LeverLab.module.css";

const BLUE = "#287fc4";
const CORAL = "#c9554d";
const YELLOW = "#bf8d08";
const GREEN = "#197a60";
const LINE = "#52626a";
const LIGHT = "#bec9ce";
const INK = "#20272b";

// ---------- 数字的写法 ----------
const fN = (x) => x.toFixed(1);
const fL = (x) => (Math.abs(x * 100 - Math.round(x * 100)) < 1e-6 ? x.toFixed(2) : x.toFixed(3));
const fP = (x) => x.toFixed(2);

// ---------- 实验台 ----------
const CX = 400; // 支点
const CY = 170;
const UNIT = 40; // 每格多少像素
const RAD = Math.PI / 180;

// 杠杆倾斜 phi 度（右端下沉为正）时，某一侧第 hole 个孔的位置
function holeXY(side, hole, phi) {
  const d = (side === "right" ? 1 : -1) * hole * UNIT;
  return { x: CX + d * Math.cos(phi * RAD), y: CY + d * Math.sin(phi * RAD) };
}

function HookStack({ x, y, n, fill, stroke }) {
  if (n <= 0) return null;
  return (
    <g>
      <path d={`M${x} ${y}V${y + 12}`} stroke={LINE} strokeWidth="1.6" />
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x - 11} y={y + 12 + i * 24} width="22" height="20" rx="3" fill={fill} stroke={stroke} strokeWidth="1.6" />
      ))}
    </g>
  );
}

// 拉力方向线（虚线）和力臂（支点到拉力方向线的垂线）。画在杠杆和孔编号下面，数字始终压在线上方
function PullLines({ x, y, theta }) {
  const dx = -Math.sin(theta * RAD); // 斜拉时朝支点一侧向下拉，测力计和力臂都落在杠杆下方
  const dy = Math.cos(theta * RAD);
  const t = (CX - x) * dx + (CY - y) * dy;
  const fx = x + t * dx;
  const fy = y + t * dy;
  return (
    <g>
      {t > 0 && <path d={`M${x} ${y}L${fx} ${fy}`} stroke={LIGHT} strokeWidth="2" strokeDasharray="6 5" />}
      <path d={`M${CX} ${CY}L${fx} ${fy}`} stroke={GREEN} strokeWidth="3" strokeDasharray="7 5" strokeLinecap="round" />
    </g>
  );
}

function SpringScale({ x, y, theta, reading }) {
  const mark = 22 + (clamp(reading, 0, SCALE_MAX) / SCALE_MAX) * 52;
  return (
    <g>
      <g transform={`translate(${x} ${y}) rotate(${theta})`}>
        <path d="M0 0V12" stroke={LINE} strokeWidth="2" />
        <rect x="-10" y="12" width="20" height="84" rx="4" fill="#f4f6f7" stroke={LINE} strokeWidth="1.8" />
        <rect x="-5" y="20" width="10" height="58" rx="2" fill="#fff" stroke={LIGHT} strokeWidth="1.2" />
        <path d={`M-5 ${mark}H5`} stroke={CORAL} strokeWidth="4" />
        <circle cx="0" cy="104" r="6" fill="none" stroke={LINE} strokeWidth="2" />
        <path d="M0 110V146" stroke={CORAL} strokeWidth="4" strokeLinecap="round" />
        <path d="M-8 138L0 152L8 138Z" fill={CORAL} stroke={CORAL} strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    </g>
  );
}

function Bench({ s, ev, onHole }) {
  const svgRef = useRef(null);
  const drag = useRef(null);
  const phi = ev.angle;
  const cos = Math.cos(phi * RAD);
  const L = holeXY("left", s.left.hole, phi);
  const R = holeXY("right", s.right.hole, phi);

  const toX = (e) => {
    const svg = svgRef.current;
    const m = svg.getScreenCTM();
    if (!m) return null;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()).x;
  };
  const start = (side) => (e) => {
    e.preventDefault();
    drag.current = side;
    svgRef.current.setPointerCapture?.(e.pointerId);
    move(e, side);
  };
  const move = (e, forced) => {
    const side = forced || drag.current;
    if (!side) return;
    const x = toX(e);
    if (x == null) return;
    onHole(side, clamp(Math.round(Math.abs(x - CX) / UNIT / Math.max(cos, 0.5)), 1, HOLES));
  };
  const stop = () => { drag.current = null; };
  const keys = (side) => (e) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const cur = side === "left" ? s.left.hole : s.right.hole;
    onHole(side, clamp(cur + (side === "right" ? dir : -dir), 1, HOLES));
  };

  const dir = tiltDir(ev);
  const dirWord = dir === "level" ? "水平" : dir === "left" ? "左端下沉" : "右端下沉";
  const scaleMode = s.right.mode === "scale";

  return (
    <svg ref={svgRef} className={styles.bench} viewBox="0 64 800 416" role="group"
      aria-label={`杠杆：阻力 ${fN(ev.F2)} 牛挂在左侧第 ${s.left.hole} 格，${scaleMode ? `测力计示数 ${fN(ev.reading)} 牛` : `动力 ${fN(ev.F1)} 牛挂在右侧第 ${s.right.hole} 格`}，杠杆${dirWord}`}
      onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
      {scaleMode && <PullLines x={R.x} y={R.y + 9} theta={ev.theta} />}
      {/* 支点 */}
      <path d={`M${CX} ${CY}L${CX - 24} ${CY + 82}H${CX + 24}Z`} fill="#dfe7ea" stroke={LINE} strokeWidth="1.8" strokeLinejoin="round" />
      <text x={CX} y="132" textAnchor="middle" className={styles.partLabel}>支点 O</text>

      {/* 杠杆（绕支点转） */}
      <g transform={`rotate(${phi} ${CX} ${CY})`}>
        <rect x={CX - 384} y={CY - 8} width="768" height="16" rx="4" fill="#eef2f3" stroke={LINE} strokeWidth="1.8" />
        {Array.from({ length: HOLES }, (_, i) => i + 1).flatMap((k) => [-1, 1].map((sd) => (
          <g key={`${sd}${k}`}>
            <circle cx={CX + sd * k * UNIT} cy={CY} r="3.5" fill={INK} />
            <text x={CX + sd * k * UNIT} y={CY - 20} textAnchor="middle" className={styles.tick}>{k}</text>
          </g>
        )))}
        <circle cx={CX} cy={CY} r="4" fill={INK} />
        {/* 两端的平衡螺母，一起向左或向右挪 */}
        {[-1, 1].map((sd) => (
          <rect key={sd} x={CX + sd * 352 + 5 * s.nut - 7} y={CY - 12} width="14" height="24" rx="3" fill="#f1e2b0" stroke={YELLOW} strokeWidth="1.8" />
        ))}
      </g>

      {/* 钩码 */}
      <HookStack x={L.x} y={L.y + 9} n={s.left.n} fill="#f3d9d6" stroke={CORAL} />
      {!scaleMode && <HookStack x={R.x} y={R.y + 9} n={s.right.n} fill="#d4e6f4" stroke={BLUE} />}
      {scaleMode && <SpringScale x={R.x} y={R.y + 9} theta={ev.theta} reading={ev.reading} />}

      {/* 选中的孔 */}
      <circle cx={L.x} cy={L.y} r="9" fill="none" stroke={CORAL} strokeWidth="2.6" />
      <circle cx={R.x} cy={R.y} r="9" fill="none" stroke={BLUE} strokeWidth="2.6" />

      {/* 读数，固定在下面一条，不会被图形压住 */}
      <text x="24" y="440" className={styles.sideText} fill={CORAL}>{`阻力 F₂ = ${fN(ev.F2)} N`}</text>
      <text x="24" y="464" className={styles.sideText} fill={CORAL}>{`阻力臂 l₂ = ${fL(ev.l2)} m`}</text>
      <text x="776" y="440" textAnchor="end" className={styles.sideText} fill={BLUE}>{scaleMode ? `动力 F₁ = 测力计示数 ${fN(ev.reading)} N` : `动力 F₁ = ${fN(ev.F1)} N`}</text>
      <text x="776" y="464" textAnchor="end" className={styles.sideText} fill={BLUE}>{`动力臂 l₁ = ${fL(ev.l1)} m`}</text>
      <text x={CX} y="440" textAnchor="middle" className={styles.partLabel}>{dirWord}</text>

      {/* 拖动区：沿杠杆拖，改变这一侧挂的位置 */}
      <rect className={styles.handle} x="16" y="80" width="364" height="190" fill="transparent"
        tabIndex={0} role="slider" aria-label="左侧钩码的位置" aria-valuemin={1} aria-valuemax={HOLES} aria-valuenow={s.left.hole}
        aria-valuetext={`第 ${s.left.hole} 格，阻力臂 ${fL(ev.l2)} 米`}
        onPointerDown={start("left")} onKeyDown={keys("left")} />
      <rect className={styles.handle} x="420" y="80" width="364" height="190" fill="transparent"
        tabIndex={0} role="slider" aria-label={scaleMode ? "测力计挂的位置" : "右侧钩码的位置"} aria-valuemin={1} aria-valuemax={HOLES} aria-valuenow={s.right.hole}
        aria-valuetext={`第 ${s.right.hole} 格，距支点 ${fL(s.right.hole * CELL)} 米`}
        onPointerDown={start("right")} onKeyDown={keys("right")} />
    </svg>
  );
}

// ---------- 说明文字 ----------
function describe(s, ev) {
  const dir = tiltDir(ev);
  const side = dir === "left" ? "左" : "右";
  const up = dir === "left" ? "右" : "左";
  if (!ev.leveled) {
    if (ev.balanced) return "现在是靠钩码勉强配平的，但平衡螺母没有调好：杠杆自己就偏重一边，这样测出的数据不准。把钩码都拿掉，先把螺母调到杠杆自己能水平静止。";
    return `杠杆还没调平：${side}端下沉，${up}端翘起。平衡螺母要往翘起的一端（${up}）调，直到杠杆在水平位置静止。调平以后再挂钩码。`;
  }
  if (s.right.mode === "scale") {
    if (ev.F2 <= 0) return "杠杆已经调平了。先在左侧挂上钩码，再看测力计要用多大的力才能把杠杆拉平。";
    if (ev.over) return `左边太重：测力计拉到最大量程 ${SCALE_MAX} N 也拉不平，左端被压了下去。减少钩码、让左边的钩码靠近支点，或者把测力计挂远一点。`;
    if (ev.noPull) return "不用拉，杠杆自己就是平的。";
    const full = fL(ev.fullArm);
    if (ev.theta === 0) {
      return `测力计竖直向下拉，示数 ${fN(ev.reading)} N，杠杆在水平位置平衡。拉力方向和杠杆垂直，动力臂就是挂点到支点的距离 l₁ = ${full} m。`;
    }
    return `测力计斜着拉：拉力的方向不再垂直于杠杆，动力臂从 ${full} m 缩短成 ${fL(ev.l1)} m（绿色虚线是支点到拉力方向线的垂线）。阻力和阻力臂没变，所以示数变大了，现在是 ${fN(ev.reading)} N。`;
  }
  if (s.left.n === 0 && s.right.n === 0) return "杠杆已经调平了。在两侧挂上钩码，移动钩码的位置，让杠杆重新在水平位置平衡。";
  if (ev.balanced) {
    return `杠杆在水平位置平衡了！动力×动力臂：${fN(ev.F1)} N × ${fL(ev.l1)} m = ${fP(ev.F1 * ev.l1)} N·m；阻力×阻力臂：${fN(ev.F2)} N × ${fL(ev.l2)} m = ${fP(ev.F2 * ev.l2)} N·m。`;
  }
  const bigger = dir === "left" ? "阻力×阻力臂" : "动力×动力臂";
  return `${side}端下沉。${bigger}更大：左边 F₂l₂ = ${fP(ev.F2 * ev.l2)} N·m，右边 F₁l₁ = ${fP(ev.F1 * ev.l1)} N·m。改变钩码的个数或位置，让杠杆重新水平。`;
}

const TASKS = [
  { key: "nut", text: "调节平衡螺母，使杠杆在水平位置静止" },
  { key: "hooks", text: "两侧挂钩码，使杠杆在水平位置平衡" },
  { key: "three", text: "用 3 组不同的数据，各让杠杆平衡一次" },
  { key: "scale", text: "换成测力计竖直向下拉，使杠杆平衡" },
  { key: "oblique", text: "同一挂点、同样的钩码，把测力计斜着拉，比一比示数" },
];

const modeName = (r) => (r.kind === "hooks" ? "钩码" : r.theta === 0 ? "测力计竖直拉" : `测力计斜拉 ${r.theta}°`);

export default function LeverLab() {
  const [s, setS] = useState(initialState);
  const [records, setRecords] = useState([]);
  const [leveledOnce, setLeveledOnce] = useState(false);

  const ev = evaluate(s);

  useEffect(() => {
    if (s.nut === NUT_BAL) setLeveledOnce(true);
    const row = recordRow(s);
    if (row) setRecords((r) => addRecord(r, row));
  }, [s]);

  const done = taskStatus(records, leveledOnce);
  const doneCount = TASKS.filter((t) => done[t.key]).length;
  const scaleMode = s.right.mode === "scale";
  const dir = tiltDir(ev);
  const dirWord = dir === "level" ? "水平，平衡" : dir === "left" ? "左端下沉" : "右端下沉";

  const setLeft = (p) => setS((o) => ({ ...o, left: { ...o.left, ...p } }));
  const setRight = (p) => setS((o) => ({ ...o, right: { ...o.right, ...p } }));
  const setHole = (side, hole) => (side === "left" ? setLeft({ hole }) : setRight({ hole }));
  const nudge = (side, d) => {
    const cur = side === "left" ? s.left.hole : s.right.hole;
    setHole(side, clamp(cur + d, 1, HOLES));
  };
  const hooks = (side, d) => {
    const cur = side === "left" ? s.left.n : s.right.n;
    const n = clamp(cur + d, 0, MAX_HOOKS);
    if (side === "left") setLeft({ n });
    else setRight({ n });
  };
  const nut = (d) => setS((o) => ({ ...o, nut: clamp(o.nut + d, NUT_MIN, NUT_MAX) }));
  const reset = () => { setS(initialState()); setRecords([]); setLeveledOnce(false); };

  const hookRows = records.filter((r) => r.kind === "hooks");
  const ruleReady = hookRows.length >= 3;

  return (
    <div className={styles.lab}>
      <Card className={styles.benchCard}>
        <Bench s={s} ev={ev} onHole={setHole} />

        <div className={styles.controls}>
          <div className={styles.group} role="group" aria-label="平衡螺母">
            <span className={styles.groupLabel}>平衡螺母</span>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.nut <= NUT_MIN} onClick={() => nut(-1)}>向左调</button>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.nut >= NUT_MAX} onClick={() => nut(1)}>向右调</button>
          </div>

          <div className={styles.group} role="group" aria-label="左侧钩码（阻力）">
            <span className={`${styles.groupLabel} ${styles.leftLabel}`}>左侧钩码</span>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.left.n <= 0} onClick={() => hooks("left", -1)}>拿走一个</button>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.left.n >= MAX_HOOKS} onClick={() => hooks("left", 1)}>加一个</button>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.left.hole >= HOLES} onClick={() => nudge("left", 1)}>往左一格</button>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.left.hole <= 1} onClick={() => nudge("left", -1)}>往右一格</button>
          </div>

          <div className={styles.group} role="group" aria-label="右侧（动力）用什么">
            <span className={`${styles.groupLabel} ${styles.rightLabel}`}>右侧用</span>
            <button type="button" aria-pressed={!scaleMode} className={`island-btn ${!scaleMode ? "island-btn--primary" : ""} ${styles.stepBtn}`} onClick={() => setRight({ mode: "hooks", theta: 0 })}>钩码</button>
            <button type="button" aria-pressed={scaleMode} className={`island-btn ${scaleMode ? "island-btn--primary" : ""} ${styles.stepBtn}`} onClick={() => setRight({ mode: "scale" })}>测力计</button>
          </div>

          <div className={styles.group} role="group" aria-label={scaleMode ? "右侧测力计" : "右侧钩码（动力）"}>
            <span className={`${styles.groupLabel} ${styles.rightLabel}`}>{scaleMode ? "右侧测力计" : "右侧钩码"}</span>
            {!scaleMode && (
              <>
                <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.right.n <= 0} onClick={() => hooks("right", -1)}>拿走一个</button>
                <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.right.n >= MAX_HOOKS} onClick={() => hooks("right", 1)}>加一个</button>
              </>
            )}
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.right.hole <= 1} onClick={() => nudge("right", -1)}>往左一格</button>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={s.right.hole >= HOLES} onClick={() => nudge("right", 1)}>往右一格</button>
          </div>

          {scaleMode && (
            <div className={styles.group} role="group" aria-label="测力计的拉法">
              <span className={styles.groupLabel}>拉的方向</span>
              {THETAS.map((t) => (
                <button key={t} type="button" aria-pressed={s.right.theta === t} className={`island-btn ${s.right.theta === t ? "island-btn--primary" : ""} ${styles.stepBtn}`} onClick={() => setRight({ theta: t })}>
                  {t === 0 ? "竖直向下拉" : `斜拉，偏离竖直 ${t}°`}
                </button>
              ))}
            </div>
          )}

          <div className={styles.group}>
            <button type="button" className={`island-btn ${styles.stepBtn}`} onClick={reset}>重来</button>
          </div>
        </div>
        <p className={styles.dragHint}>可以沿杠杆拖动，也可以点按钮一格一格挪。杠杆上的数字是孔的编号，每格 {CELL * 100} cm；每个钩码重 {HOOK_N} N；测力计量程 {SCALE_MAX} N，最小刻度 0.1 N。</p>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.status}>
          <Title as="h2" variant="tab" tone="teal">现在的情况</Title>
          <div className={styles.readGrid}>
            <div className={`${styles.reading} ${styles.readingR}`}>
              <span className={styles.readLabel}>{scaleMode ? "动力 F₁（测力计示数）" : "动力 F₁"}</span>
              <strong className={styles.readValue}>{fN(ev.F1)}<small> N</small></strong>
            </div>
            <div className={`${styles.reading} ${styles.readingR}`}>
              <span className={styles.readLabel}>动力臂 l₁</span>
              <strong className={styles.readValue}>{fL(ev.l1)}<small> m</small></strong>
            </div>
            <div className={`${styles.reading} ${styles.readingL}`}>
              <span className={styles.readLabel}>阻力 F₂</span>
              <strong className={styles.readValue}>{fN(ev.F2)}<small> N</small></strong>
            </div>
            <div className={`${styles.reading} ${styles.readingL}`}>
              <span className={styles.readLabel}>阻力臂 l₂</span>
              <strong className={styles.readValue}>{fL(ev.l2)}<small> m</small></strong>
            </div>
          </div>
          <dl className={styles.facts}>
            <div><dt>F₁l₁</dt><dd>{fP(ev.F1 * ev.l1)} N·m</dd></div>
            <div><dt>F₂l₂</dt><dd>{fP(ev.F2 * ev.l2)} N·m</dd></div>
            <div><dt>杠杆</dt><dd>{dirWord}</dd></div>
          </dl>
          <p className={styles.explain}>{describe(s, ev)}</p>
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
            <Notice type="success" title="实验全部完成！">杠杆平衡时，动力×动力臂都等于阻力×阻力臂，即 F₁l₁ = F₂l₂。测力计斜着拉时，动力臂变短了，所以要用更大的力。</Notice>
          )}
        </Card>
      </div>

      <div className={styles.panels}>
        <Card className={styles.records}>
          <Title as="h2" variant="tab" tone="blue">实验记录</Title>
          <p className={styles.note}>螺母调平后，杠杆每在水平位置平衡一次，就自动记一行。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>序号</th><th>动力 F₁/N</th><th>动力臂 l₁/m</th><th>阻力 F₂/N</th><th>阻力臂 l₂/m</th><th>右侧</th></tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={6} className={styles.empty}>还没有记录。先调平衡螺母，再在两侧挂钩码。</td></tr>
                ) : records.map((r, i) => (
                  <tr key={r.key}>
                    <td>{i + 1}</td><td>{fN(r.F1)}</td><td>{fL(r.l1)}</td><td>{fN(r.F2)}</td><td>{fL(r.l2)}</td><td className={styles.how}>{modeName(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className={styles.rules}>
          <Title as="h2" variant="tab" tone="yellow">杠杆的平衡条件</Title>
          <p className={styles.note}>用钩码做出 3 组不同的平衡数据后，这里把每一组的乘积算出来。</p>
          {ruleReady ? (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>序号</th><th>动力×动力臂 F₁l₁/N·m</th><th>阻力×阻力臂 F₂l₂/N·m</th></tr></thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.key}><td>{i + 1}</td><td>{fP(r.F1 * r.l1)}</td><td>{fP(r.F2 * r.l2)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.conclusion}>动力 × 动力臂 = 阻力 × 阻力臂，即 F₁l₁ = F₂l₂</p>
              {records.some((r) => r.kind === "scale") && <p className={styles.note}>测力计的示数只读到 0.1 N，所以用测力计得到的两个乘积会有一点点差别。</p>}
            </>
          ) : (
            <p className={styles.empty}>还没做出来。已经有 {hookRows.length} 组钩码数据。</p>
          )}
        </Card>
      </div>
    </div>
  );
}
