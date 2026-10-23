"use client";

// 液体压强实验室：U 形管压强计的探头放进液体里，转动方向、放深、换液体，看 U 形管两边液面的高度差 Δh。
// 物理模型在 src/lib/liquidPressureLab.js。画面不做自动动画，服务器渲染出来的初始画面就是完整的静态图。
import { useEffect, useRef, useState } from "react";
import { Card, Check, Notice, Progress, Title } from "@/components/island/Island";
import {
  BEAKER_BOTTOM_Y, BEAKER_RIM_Y, BEAKER_X0, BEAKER_X1, DEPTH_MAX, DEPTH_MIN, DEPTH_START, DEPTH_STEP,
  DIRECTIONS, LIQUIDS, PROBE_R, PROBE_X, RECORD_MIN_DEPTH, ROD_TOP, SP, U_BASE_Y, U_LEFT_X,
  U_RIGHT_X, U_TOP_H, U_TOP_Y, VIEW_H, VIEW_W, YS,
  addRow, clampDepth, deltaH, densityDone, depthDone, depthFromY, directionOf, directionsDone,
  liquidOf, membraneY, probeBox, readLevels, record, stemX, uY,
} from "@/lib/liquidPressureLab";
import styles from "./LiquidPressureLab.module.css";

const BLUE = "#287fc4";
const CORAL = "#c9554d";
const YELLOW = "#bf8d08";
const GREEN = "#197a60";
const LINE = "#52626a";
const LIGHT = "#bec9ce";
const U_RED = "#e0746c";

const LIQ_STYLE = {
  water: { fill: "#d6ebf8", line: BLUE },
  salt: { fill: "#d3eee4", line: GREEN },
  alcohol: { fill: "#f6efd0", line: YELLOW },
};
const FACE_ANGLE = { up: -90, down: 90, side: 0 };

const fmt1 = (x) => x.toFixed(1);

// 探头橡皮膜：金属盒朝着某个方向的一段圆弧
function membranePath(cx, cy, R, deg) {
  const a0 = ((deg - 50) * Math.PI) / 180;
  const a1 = ((deg + 50) * Math.PI) / 180;
  const p = (a) => `${(cx + R * Math.cos(a)).toFixed(1)} ${(cy + R * Math.sin(a)).toFixed(1)}`;
  return `M${p(a0)}A${R} ${R} 0 0 1 ${p(a1)}`;
}

// ---------- 实验台 ----------
function Bench({ liq, dir, h, onDrag, dh }) {
  const svgRef = useRef(null);
  const drag = useRef(null);
  const ls = LIQ_STYLE[liq.id];
  const box = probeBox(dir, h);
  const ym = membraneY(h);
  const sx = stemX(dir);
  const lv = readLevels(dh);
  const yl = uY(lv.left);
  const yr = uY(lv.right);
  const tubePath = `M${U_LEFT_X} ${U_TOP_Y}V412A28 28 0 0 0 ${U_RIGHT_X} 412V${U_TOP_Y}`;

  const toY = (e) => {
    const m = svgRef.current?.getScreenCTM();
    if (!m) return null;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()).y;
  };
  const start = (e) => {
    e.preventDefault();
    const y = toY(e);
    if (y == null) return;
    drag.current = y - ym;
    svgRef.current.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (drag.current == null) return;
    const y = toY(e);
    if (y == null) return;
    onDrag(depthFromY(y - drag.current));
  };
  const stop = () => {
    drag.current = null;
  };
  const keys = (e) => {
    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    onDrag(clampDepth(h + d * DEPTH_STEP));
  };

  return (
    <svg ref={svgRef} className={styles.bench} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="group"
      aria-label={`U 形管压强计，探头${directionOf(dir).name}，在${liq.name}里 ${h} 厘米深处，两侧液面高度差 ${fmt1(lv.dh)} 厘米`}
      onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
      <defs>
        <clipPath id="lp-liquid">
          <rect x={U_LEFT_X - 20} y={yl} width="40" height={500 - yl} />
          <rect x={U_RIGHT_X - 20} y={yr} width="40" height={500 - yr} />
        </clipPath>
      </defs>

      {/* 烧杯里的液体 */}
      <rect x={BEAKER_X0} y={YS} width={BEAKER_X1 - BEAKER_X0} height={BEAKER_BOTTOM_Y + 3 - YS} fill={ls.fill} opacity="0.75" />

      {/* 橡皮管和探头的细管 */}
      <path d={`M${sx} ${ROD_TOP}H${U_LEFT_X}V${U_TOP_Y}`} fill="none" stroke={LINE} strokeWidth="8" strokeLinejoin="round" />
      <path d={`M${sx} ${ROD_TOP}H${U_LEFT_X}V${U_TOP_Y}`} fill="none" stroke="#eef2f3" strokeWidth="4" strokeLinejoin="round" />
      {dir === "up"
        ? <path d={`M${box.cx - PROBE_R} ${box.cy}H${sx}V${ROD_TOP}`} fill="none" stroke={LINE} strokeWidth="6" strokeLinejoin="round" />
        : <path d={`M${sx} ${box.top}V${ROD_TOP}`} fill="none" stroke={LINE} strokeWidth="6" />}

      {/* 探头：空金属盒，一面蒙着橡皮膜 */}
      <circle cx={box.cx} cy={box.cy} r={PROBE_R} fill="#cfd8dc" stroke={LINE} strokeWidth="2" />
      <path d={membranePath(box.cx, box.cy, PROBE_R, FACE_ANGLE[dir])} fill="none" stroke={CORAL} strokeWidth="5" strokeLinecap="round" />

      {/* 液面以下再蒙一层液体的颜色 */}
      <rect x={BEAKER_X0} y={YS} width={BEAKER_X1 - BEAKER_X0} height={BEAKER_BOTTOM_Y + 3 - YS} fill={ls.fill} opacity="0.35" />
      <path d={`M${BEAKER_X0} ${YS}H${BEAKER_X1}`} stroke={ls.line} strokeWidth="2" />

      {/* 烧杯 */}
      <path d={`M${BEAKER_X0} ${BEAKER_RIM_Y}V${BEAKER_BOTTOM_Y + 4}H${BEAKER_X1}V${BEAKER_RIM_Y}`} fill="none" stroke={LINE} strokeWidth="2.6" strokeLinejoin="round" />
      <text x={(BEAKER_X0 + BEAKER_X1) / 2} y={BEAKER_BOTTOM_Y + 28} textAnchor="middle" className={styles.partLabel}>烧杯</text>
      <text x={(BEAKER_X0 + BEAKER_X1) / 2} y={BEAKER_BOTTOM_Y + 48} textAnchor="middle" className={styles.tick}>{liq.name}　ρ = {liq.rhoText} g/cm³</text>

      {/* 烧杯右壁的深度刻度：从液面往下数，每厘米一格 */}
      {Array.from({ length: 14 }, (_, i) => i + 1).map((c) => (
        <g key={c}>
          <path d={`M${BEAKER_X1} ${YS + c * SP}h${c % 2 === 0 ? -10 : -6}`} stroke={LINE} strokeWidth="1.2" />
          {c % 2 === 0 && <text x={BEAKER_X1 - 14} y={YS + c * SP + 4} textAnchor="end" className={styles.tick}>{c}</text>}
        </g>
      ))}
      <text x={BEAKER_X0 + 6} y={YS - 8} className={styles.tick}>液面</text>

      {/* 深度 h */}
      {h > 0 && (
        <g>
          <path d={`M78 ${YS}V${ym}M72 ${YS}h12M72 ${ym}h12`} stroke={CORAL} strokeWidth="1.8" />
          <text x="68" y={(YS + ym) / 2 + 5} textAnchor="end" className={styles.dimLabel}>h</text>
        </g>
      )}

      {/* 读数框 */}
      <rect x="372" y="80" width="140" height="64" rx="8" fill="#f4f6f7" stroke={LIGHT} strokeWidth="1.4" />
      <text x="382" y="100" className={styles.tick}>两侧液面高度差 Δh</text>
      <text x="382" y="130" className={styles.bigNum}>{fmt1(lv.dh)} cm</text>

      {/* U 形管：左边接探头，右边通大气 */}
      <path d={tubePath} fill="none" stroke={LINE} strokeWidth="18" />
      <path d={tubePath} fill="none" stroke="#fff" strokeWidth="14" />
      <path d={tubePath} fill="none" stroke={U_RED} strokeWidth="12" clipPath="url(#lp-liquid)" />
      <text x={(U_LEFT_X + U_RIGHT_X) / 2} y={U_BASE_Y + 62} textAnchor="middle" className={styles.partLabel}>U 形管压强计</text>

      {/* U 形管旁的刻度尺（单位 cm）和两边液面的高度 */}
      <path d={`M318 ${U_BASE_Y}V${U_TOP_Y}`} stroke={LINE} strokeWidth="1.5" />
      {Array.from({ length: U_TOP_H + 1 }, (_, i) => i).map((c) => (
        <g key={c}>
          <path d={`M318 ${uY(c)}h${c % 2 === 0 ? -10 : -6}`} stroke={LINE} strokeWidth="1.2" />
          {c % 2 === 0 && <text x="304" y={uY(c) + 4} textAnchor="end" className={styles.tick}>{c}</text>}
        </g>
      ))}
      <text x="318" y={U_TOP_Y - 10} textAnchor="middle" className={styles.tick}>cm</text>
      <path d={`M318 ${yl}H446`} stroke={LINE} strokeWidth="1.2" strokeDasharray="4 3" />
      <path d={`M318 ${yr}H446`} stroke={CORAL} strokeWidth="1.2" strokeDasharray="4 3" />
      {lv.dh > 0 && (
        <g>
          <path d={`M440 ${yl}V${yr}M434 ${yr}h12M434 ${yl}h12`} stroke={CORAL} strokeWidth="1.8" />
          <text x="452" y={(yl + yr) / 2 + 5} className={styles.dimLabel}>Δh</text>
        </g>
      )}

      {/* 拖动把手：整个探头及四周的透明触摸区 */}
      <rect className={styles.handle} x={PROBE_X - 54} y={box.top - 14} width="108" height={box.bottom - box.top + 28} fill="transparent"
        tabIndex={0} role="slider" aria-orientation="vertical" aria-label="探头在液体里的深度"
        aria-valuemin={DEPTH_MIN} aria-valuemax={DEPTH_MAX} aria-valuenow={h}
        aria-valuetext={`橡皮膜在液面下 ${h} 厘米`}
        onPointerDown={start} onKeyDown={keys} />
    </svg>
  );
}

// ---------- 说明文字 ----------
function describe({ liq, dir, h, dh }) {
  if (h < RECORD_MIN_DEPTH) return "探头还在液面附近，U 形管两侧的液面几乎一样高。把探头往下放，看看两侧液面怎么变。";
  return `探头在${liq.name}里 ${h} cm 深处，橡皮膜${directionOf(dir).name}，U 形管两侧液面的高度差是 ${fmt1(dh)} cm。高度差越大，橡皮膜受到的压强越大。`;
}

const TASKS = [
  { key: "dir", text: "同一深度转动探头：朝上、朝下、朝侧面各量一次，各个方向的压强相等吗？" },
  { key: "depth", text: "增大探头在液体中的深度：压强怎么变？（同一种液体、同一朝向，至少量 3 个深度）" },
  { key: "dens", text: "换用密度不同的液体，保持深度相同：压强跟液体的密度有关吗？（至少换 2 种液体）" },
];

export default function LiquidPressureLab() {
  const [liqId, setLiqId] = useState("water");
  const [dir, setDir] = useState("up");
  const [h, setH] = useState(DEPTH_START);
  const [rows, setRows] = useState([]);

  const liq = liquidOf(liqId);
  const dh = readLevels(deltaH(liq, h)).dh;
  const lv = readLevels(deltaH(liq, h));

  // 记录表：探头整个浸在液体里，停在整数厘米，就记一行
  useEffect(() => {
    setRows((r) => addRow(r, record(liq, dir, h)));
  }, [liq, dir, h]);

  const move = (d) => setH((p) => clampDepth(p + d * DEPTH_STEP));
  const reset = () => { setLiqId("water"); setDir("up"); setH(DEPTH_START); setRows([]); };

  const done = { dir: directionsDone(rows), depth: depthDone(rows), dens: densityDone(rows) };
  const doneCount = TASKS.filter((t) => done[t.key]).length;

  return (
    <div className={styles.lab}>
      <Card className={styles.benchCard}>
        <div className={styles.stage}>
          <div className={styles.benchWrap}>
            <Bench liq={liq} dir={dir} h={h} dh={dh} onDrag={setH} />
          </div>

          <div className={styles.side}>
            <div className={styles.choose} role="group" aria-label="转动探头">
              <span className={styles.groupLabel}>橡皮膜朝向</span>
              <div className={styles.choices}>
                {DIRECTIONS.map((d) => (
                  <button key={d.id} type="button" aria-pressed={d.id === dir}
                    className={`island-btn ${d.id === dir ? "island-btn--primary" : ""} ${styles.chooseBtn}`} onClick={() => setDir(d.id)}>
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.choose} role="group" aria-label="换液体">
              <span className={styles.groupLabel}>烧杯里的液体</span>
              <div className={styles.choices}>
                {LIQUIDS.map((l) => (
                  <button key={l.id} type="button" aria-pressed={l.id === liqId}
                    className={`island-btn ${l.id === liqId ? "island-btn--primary" : ""} ${styles.chooseBtn}`} onClick={() => setLiqId(l.id)}>
                    {l.name}
                    <small>{l.rhoText} g/cm³</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.moveGroup} role="group" aria-label="移动探头">
            <span className={styles.groupLabel}>探头</span>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={h <= DEPTH_MIN} onClick={() => move(-1)}>提起 1 cm</button>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={h >= DEPTH_MAX} onClick={() => move(1)}>放深 1 cm</button>
          </div>
          <div className={styles.sideControls}>
            <button type="button" className={`island-btn ${styles.resetBtn}`} onClick={reset}>重来</button>
          </div>
        </div>
        <p className={styles.dragHint}>直接上下拖动探头，或用按钮一格一格放（每次 1 cm）。深度从橡皮膜的中心量起；探头整个浸在液体里（2 cm 起），停在整数厘米处会自动记一行。Δh 读到 0.1 cm。</p>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.status}>
          <Title as="h2" variant="tab" tone="teal">现在的情况</Title>
          <div className={styles.readRow}>
            <div className={styles.reading}>
              <span className={styles.readLabel}>探头深度 h</span>
              <strong className={styles.readValue}>{h}<small> cm</small></strong>
              <span className={styles.readLabel}>橡皮膜到液面</span>
            </div>
            <div className={`${styles.reading} ${styles.readingDh}`}>
              <span className={styles.readLabel}>液面高度差 Δh</span>
              <strong className={styles.readValue}>{fmt1(lv.dh)}<small> cm</small></strong>
              <span className={styles.readLabel}>右边 − 左边</span>
            </div>
          </div>
          <dl className={styles.facts}>
            <div><dt>液体</dt><dd>{liq.name}，ρ = {liq.rhoText} g/cm³</dd></div>
            <div><dt>橡皮膜朝向</dt><dd>{directionOf(dir).name}</dd></div>
            <div><dt>U 形管左边液面</dt><dd>{fmt1(lv.left)} cm（刻度尺读数）</dd></div>
            <div><dt>U 形管右边液面</dt><dd>{fmt1(lv.right)} cm（刻度尺读数）</dd></div>
          </dl>
          <p className={styles.explain}>{describe({ liq, dir, h, dh: lv.dh })}</p>
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
            <Notice type="success" title="实验全部完成！">在液体内部的同一深度，向各个方向的压强都相等；深度越大，压强越大；液体内部压强的大小还与液体的密度有关，在深度相同时，液体的密度越大，压强越大。</Notice>
          )}
        </Card>
      </div>

      <div className={styles.panels}>
        <Card className={styles.records}>
          <Title as="h2" variant="tab" tone="blue">实验记录</Title>
          <p className={styles.note}>探头停在整数厘米的深度，就自动记一行。Δh 越大，压强越大。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>序号</th><th>液体</th><th>探头朝向</th><th>深度 h/cm</th><th>液面高度差 Δh/cm</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={5} className={styles.empty}>还没有记录。把探头放进液体里，停在 2 cm、3 cm……处。</td></tr>
                ) : rows.map((r, i) => (
                  <tr key={`${r.liq}${r.dir}${r.h}`} className={r.liq === liqId && r.dir === dir && r.h === h ? styles.currentRow : undefined}>
                    <td>{i + 1}</td><td>{liquidOf(r.liq).name}</td><td>{directionOf(r.dir).name}</td><td>{r.h}</td><td>{fmt1(r.dh)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className={styles.rules}>
          <Title as="h2" variant="tab" tone="yellow">液体内部压强的特点</Title>
          <p className={styles.note}>做出来的才填上。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>改变的量</th><th>发现</th></tr></thead>
              <tbody>
                <tr><td className={styles.range}>探头的方向</td>{done.dir ? <td className={styles.left}>在液体内部的同一深度，向各个方向的压强都相等</td> : <td className={styles.empty}>还没做出来</td>}</tr>
                <tr><td className={styles.range}>探头的深度</td>{done.depth ? <td className={styles.left}>深度越大，压强越大</td> : <td className={styles.empty}>还没做出来</td>}</tr>
                <tr><td className={styles.range}>液体的密度</td>{done.dens ? <td className={styles.left}>在深度相同时，液体的密度越大，压强越大</td> : <td className={styles.empty}>还没做出来</td>}</tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
