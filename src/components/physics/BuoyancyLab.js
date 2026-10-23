"use client";

// 浮力实验室：弹簧测力计挂着物体，一点点浸入液体，用称重法测浮力，再用溢水杯比较 F浮 和 G排。
// 物理模型在 src/lib/buoyancyLab.js。画面不做自动动画，服务器渲染出来的初始画面就是完整的静态图。
import { useEffect, useRef, useState } from "react";
import { Card, Check, Notice, Progress, Switch, Title } from "@/components/island/Island";
import {
  BUCKET_WEIGHT, H_MIN, H_START, H_STEP, LIQUID_DEPTH, LIQUIDS, OBJECTS, SCALE_MAX,
  addInfoRow, addOverflowRow, archimedesDone, bucketTotal, changesWithLiquid, clamp, collectedAfter,
  constantAfterFull, growsBeforeFull, hangState, immersedVolume, infoRow, liquidOf, maxHangDepth,
  objectOf, overflowRow, sameVolumeSameBuoyancy, settle, settleDone, settleKey, snap, volumeOf,
} from "@/lib/buoyancyLab";
import styles from "./BuoyancyLab.module.css";

const BLUE = "#287fc4";
const CORAL = "#c9554d";
const YELLOW = "#bf8d08";
const GREEN = "#197a60";
const LINE = "#52626a";
const LIGHT = "#bec9ce";
const INK = "#20272b";

const LIQ_STYLE = {
  water: { fill: "#d6ebf8", line: BLUE },
  salt: { fill: "#d3eee4", line: GREEN },
  alcohol: { fill: "#f6efd0", line: YELLOW },
};
const OBJ_FILL = { A: "#cfd8dc", B: "#e2a77d", C: "#cfd8dc", D: "#f1e08a" };
const BLOCK_W = { A: 60, B: 60, C: 84, D: 60 };

const fmt = (x) => x.toFixed(2);
const fmtH = (h) => (Number.isInteger(h) ? `${h}` : h.toFixed(1));

// ---------- 实验台 ----------
const SP = 12; // 每厘米多少像素
const YS = 304; // 液面
const CX = 230; // 测力计和烧杯的中心线
const BX0 = 120; // 烧杯内壁
const BX1 = 340;
const BOTTOM = YS + LIQUID_DEPTH * SP; // 杯底 472
const BLOCK_H = 5 * SP;
const SC = { top: 24, zero: 34, perN: 34 }; // 测力计：0 N 的位置、每牛多少像素
const sy = (F) => SC.zero + clamp(F, 0, SCALE_MAX) * SC.perN;

function Scale({ reading }) {
  const bottom = sy(SCALE_MAX) + 10;
  return (
    <g>
      <text x={CX} y="14" textAnchor="middle" className={styles.partLabel}>弹簧测力计</text>
      <rect x={CX - 20} y={SC.top} width="40" height={bottom - SC.top} rx="6" fill="#f4f6f7" stroke={LINE} strokeWidth="2" />
      {Array.from({ length: 51 }, (_, i) => i).map((i) => (
        <path key={i} d={`M${CX - 20} ${sy(i / 10)}h${i % 10 === 0 ? 12 : i % 5 === 0 ? 9 : 5}`} stroke={LINE} strokeWidth={i % 10 === 0 ? 1.4 : 0.8} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <text key={n} x={CX - 26} y={sy(n) + 4} textAnchor="end" className={styles.tick}>{n} N</text>
      ))}
      {reading != null && (
        <>
          <path d={`M${CX - 20} ${sy(reading)}h40`} stroke={CORAL} strokeWidth="3" strokeLinecap="round" />
          <path d={`M${CX + 22} ${sy(reading)}l9 -6v12z`} fill={CORAL} />
        </>
      )}
      <circle cx={CX} cy={bottom + 7} r="6" fill="none" stroke={LINE} strokeWidth="2" />
    </g>
  );
}

function Bench({ obj, liq, hh, sim, released, overflow, collected, maxH, onDrag, onDrop }) {
  const svgRef = useRef(null);
  const drag = useRef(null);
  const ls = LIQ_STYLE[liq.id];
  const w = BLOCK_W[obj.id];
  const top = YS + (hh - 5) * SP;
  const bottom = YS + hh * SP;
  const showDim = hh > 0.01;

  const toY = (e) => {
    const m = svgRef.current?.getScreenCTM();
    if (!m) return null;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()).y;
  };
  const start = (e) => {
    e.preventDefault();
    const y = toY(e);
    if (y == null) return;
    drag.current = y - bottom;
    svgRef.current.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (drag.current == null) return;
    const y = toY(e);
    if (y == null) return;
    onDrag(clamp(snap((y - drag.current - YS) / SP, H_STEP), H_MIN, maxH));
  };
  const stop = () => {
    if (drag.current == null) return;
    drag.current = null;
    onDrop();
  };
  const keys = (e) => {
    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    onDrag(clamp(Math.round(hh) + d, H_MIN, maxH));
  };

  const bucketFill = Math.min(1, collected / 100) * 56;

  return (
    <svg ref={svgRef} className={styles.bench} viewBox="0 0 480 524" role="group"
      aria-label={`${obj.name}挂在弹簧测力计下，${liq.name}中，${released ? "已松手" : `示数 ${fmt(sim.readF)} 牛`}`}
      onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
      <defs>
        <clipPath id="buoy-bucket"><path d="M372 412L380 476H444L452 412Z" /></clipPath>
      </defs>

      <Scale reading={released ? 0 : sim.readF} />
      <rect x="268" y="24" width="136" height="48" rx="8" fill="#f4f6f7" stroke={LIGHT} strokeWidth="1.4" />
      <text x="278" y="42" className={styles.tick}>测力计示数 F拉</text>
      <text x="278" y="64" className={styles.bigNum}>{released ? "—" : `${fmt(sim.readF)} N`}</text>

      {/* 液体 */}
      <rect x={BX0} y={YS} width={BX1 - BX0} height={BOTTOM + 3 - YS} fill={ls.fill} opacity="0.75" />

      {/* 细线和物体 */}
      {!released && <path d={`M${CX} ${sy(SCALE_MAX) + 23}V${top}`} stroke={LINE} strokeWidth="2" />}
      <rect x={CX - w / 2} y={top} width={w} height={BLOCK_H} rx="3" fill={OBJ_FILL[obj.id]} stroke={LINE} strokeWidth="2" />
      <path d={`M${CX - w / 2 + 1} ${top + 1}h${w - 2}`} stroke="#fff" strokeWidth="1.5" opacity="0.7" />
      {/* 液面以下的部分再蒙一层液体的颜色 */}
      <rect x={BX0} y={YS} width={BX1 - BX0} height={BOTTOM + 3 - YS} fill={ls.fill} opacity="0.35" />
      <path d={`M${BX0} ${YS}H${BX1}`} stroke={ls.line} strokeWidth="2" />
      <text x={CX} y={top + 36} textAnchor="middle" className={styles.blockLetter}>{obj.id}</text>

      {/* 烧杯 / 溢水杯 */}
      <path d={`M${BX0} 276V${BOTTOM + 4}H${BX1}V276`} fill="none" stroke={LINE} strokeWidth="2.6" strokeLinejoin="round" />
      {overflow && (
        <>
          <path d={`M${BX1} ${YS}H396L404 316H${BX1}`} fill={ls.fill} stroke={LINE} strokeWidth="2.2" strokeLinejoin="round" />
          <path d={`M372 412L380 476H444L452 412`} fill="#fff" stroke="none" />
          {collected > 0 && <rect x="370" y={476 - bucketFill} width="84" height={bucketFill} fill={ls.fill} clipPath="url(#buoy-bucket)" />}
          {collected > 0 && <path d={`M372 ${476 - bucketFill}H452`} stroke={ls.line} strokeWidth="1.6" clipPath="url(#buoy-bucket)" />}
          <path d="M372 412L380 476H444L452 412" fill="none" stroke={LINE} strokeWidth="2.4" strokeLinejoin="round" />
          <text x="412" y="498" textAnchor="middle" className={styles.partLabel}>小桶</text>
        </>
      )}

      {/* 深度 h */}
      <text x="114" y={YS - 8} textAnchor="end" className={styles.tick}>液面</text>
      {showDim && (
        <g>
          <path d={`M100 ${YS}V${bottom}M94 ${YS}h12M94 ${bottom}h12`} stroke={CORAL} strokeWidth="1.8" />
          <text x="90" y={(YS + bottom) / 2 + 5} textAnchor="end" className={styles.dimLabel}>h</text>
        </g>
      )}

      {/* 名称 */}
      <text x={CX} y="498" textAnchor="middle" className={styles.partLabel}>{overflow ? "溢水杯" : "烧杯"}</text>
      <text x={CX} y="518" textAnchor="middle" className={styles.tick}>{liq.name}　ρ = {liq.rhoText} g/cm³</text>

      {/* 拖动把手：整块物体及四周的透明触摸区 */}
      {!released && (
        <rect className={styles.handle} x={CX - 50} y={top - 12} width="100" height={BLOCK_H + 24} fill="transparent"
          tabIndex={0} role="slider" aria-orientation="vertical" aria-label="物体放进液体的深度"
          aria-valuemin={H_MIN} aria-valuemax={Number(maxH.toFixed(1))} aria-valuenow={Number(hh.toFixed(1))}
          aria-valuetext={`下表面在液面${hh > 0 ? "下" : "上"} ${Math.abs(Number(hh.toFixed(1)))} 厘米`}
          onPointerDown={start} onKeyDown={keys} />
      )}
    </svg>
  );
}

// ---------- F浮—深度图像 ----------
const G = { x0: 60, x1: 500, y0: 32, y1: 270, xmax: 13, ymax: 1.4 };
const gx = (h) => G.x0 + (h / G.xmax) * (G.x1 - G.x0);
const gy = (F) => G.y1 - (F / G.ymax) * (G.y1 - G.y0);

function Graph({ rows, obj }) {
  const mine = rows.filter((r) => r.obj === obj.id);
  const series = LIQUIDS.map((l) => ({ liq: l, pts: mine.filter((r) => r.liq === l.id).sort((a, b) => a.h - b.h) })).filter((s) => s.pts.length);
  return (
    <svg className={styles.graph} viewBox="0 0 520 344" role="img" aria-label={`${obj.name}的浮力随浸入深度变化的图像`}>
      {[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4].map((F) => (
        <g key={F}>
          <path d={`M${G.x0} ${gy(F)}H${G.x1}`} stroke="#e6ebed" strokeWidth="1" />
          <text x={G.x0 - 8} y={gy(F) + 4} textAnchor="end" className={styles.tick}>{F.toFixed(1)}</text>
        </g>
      ))}
      {[0, 2, 4, 6, 8, 10, 12].map((h) => (
        <g key={h}>
          <path d={`M${gx(h)} ${G.y1}v5`} stroke={LINE} strokeWidth="1.2" />
          <text x={gx(h)} y={G.y1 + 22} textAnchor="middle" className={styles.tick}>{h}</text>
        </g>
      ))}
      <path d={`M${gx(5)} ${G.y0}V${G.y1}`} stroke={LIGHT} strokeWidth="1.4" strokeDasharray="5 4" />
      <path d={`M${G.x0} ${G.y0 - 8}V${G.y1}H${G.x1 + 8}`} fill="none" stroke={LINE} strokeWidth="1.5" />
      <text x="8" y="16" className={styles.note14}>浮力 F浮/N</text>
      <text x={G.x1 + 8} y={G.y1 + 44} textAnchor="end" className={styles.note14}>物体下表面的深度 h/cm</text>
      {series.map(({ liq, pts }) => (
        <g key={liq.id}>
          {pts.length > 1 && (
            <path d={pts.map((p, i) => `${i ? "L" : "M"}${gx(p.h).toFixed(1)} ${gy(p.Fb).toFixed(1)}`).join("")}
              fill="none" stroke={LIQ_STYLE[liq.id].line} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          )}
          {pts.map((p) => <circle key={p.h} cx={gx(p.h)} cy={gy(p.Fb)} r="5" fill={LIQ_STYLE[liq.id].line} stroke="#fff" strokeWidth="2" />)}
        </g>
      ))}
      {series.length === 0 && <text x={(G.x0 + G.x1) / 2} y={(G.y0 + G.y1) / 2} textAnchor="middle" className={styles.note14}>还没有数据：把物体一点点放进液体里</text>}
      {/* 图例单独一行，放在坐标轴下面 */}
      {LIQUIDS.map((l, i) => (
        <g key={l.id}>
          <path d={`M${G.x0 + i * 78} 334h22`} stroke={LIQ_STYLE[l.id].line} strokeWidth="3" strokeLinecap="round" />
          <text x={G.x0 + i * 78 + 28} y="339" className={styles.tick}>{l.name}</text>
        </g>
      ))}
      <path d={`M${G.x0 + 240} 334h22`} stroke={LIGHT} strokeWidth="2" strokeDasharray="5 4" />
      <text x={G.x0 + 268} y="339" className={styles.tick}>刚好浸没（h = 5 cm）</text>
    </svg>
  );
}

// ---------- 说明文字 ----------
function describe({ released, rel, obj, liq, hh, sim, overflow, collected }) {
  if (released) {
    return rel.state === "sink"
      ? `松手后${obj.name}沉到了杯底。浸没时它受到的浮力比重力小（F浮 < G），所以下沉。`
      : rel.state === "float"
        ? `松手后${obj.name}浮在${liq.name}面上，一部分露在外面。漂浮时浮力等于重力（F浮 = G）。`
        : `松手后${obj.name}停在原处不动：浮力等于重力，悬浮。`;
  }
  const tail = overflow && collected > 0 ? "水从溢水口流进了小桶。" : "";
  if (hh <= 0) return overflow ? "物体还在液面上方，测力计的示数就是物重 G。慢慢放下去，看看小桶里会怎样。" : "物体还在液面上方，测力计的示数就是物重 G。慢慢放下去，看看示数怎么变。";
  if (!sim.full && sim.readF === 0) return `示数变成了 0：浮力等于重力（F浮 = G = ${fmt(sim.readG)} N），${obj.name}漂在${liq.name}面上，细线松了，再也放不深。可以松手看看。`;
  if (!sim.full) return `${obj.name}浸入了一部分，示数比物重小，说明受到了浮力：F浮 = G − F拉 = ${fmt(sim.readG)} − ${fmt(sim.readF)} = ${fmt(sim.readFb)} N。${tail}`;
  if (hh < 5.01) return `刚好浸没。F浮 = G − F拉 = ${fmt(sim.readG)} − ${fmt(sim.readF)} = ${fmt(sim.readFb)} N。继续往下放，示数会变吗？${tail}`;
  return `又放深了，示数没有变，浮力还是 ${fmt(sim.readFb)} N：物体浸没以后，浮力的大小跟浸没的深度没有关系。${tail}`;
}

const TASKS = [
  { key: "weigh", text: "用称重法测出浮力：把物体浸没在液体里，用 G 和 F拉 算出 F浮" },
  { key: "grow", text: "浸没之前，一点点放深：浸在液体中的体积越大，浮力怎样变？（至少停在 3 个深度）" },
  { key: "deep", text: "浸没以后继续往下放：浮力变不变？（至少比较相差 2 cm 的两个深度）" },
  { key: "liquid", text: "把同一个物体浸没在不同的液体里：浮力一样吗？（至少换 2 种液体）" },
  { key: "arch", text: "打开“用溢水杯”，浸没后比一比 F浮 和 G排（做出 2 组，换物体或液体再做一组）" },
];

export default function BuoyancyLab() {
  const [objId, setObjId] = useState("A");
  const [liqId, setLiqId] = useState("water");
  const [h, setH] = useState(H_START);
  const [overflow, setOverflow] = useState(false);
  const [collected, setCollected] = useState(0);
  const [released, setReleased] = useState(false);
  const [rows, setRows] = useState([]);
  const [ovRows, setOvRows] = useState([]);
  const [seen, setSeen] = useState([]);

  const obj = objectOf(objId);
  const liq = liquidOf(liqId);
  const maxH = maxHangDepth(obj, liq);
  const rel = settle(obj, liq, h);
  const hh = released ? rel.h : h;
  const sim = hangState(obj, liq, hh);

  // 溢水杯：流出去的液体不会回来，小桶里收到的是浸入过的最大体积
  useEffect(() => {
    if (!overflow) return;
    setCollected((c) => collectedAfter(c, immersedVolume(obj, hh)));
  }, [overflow, obj, hh]);

  // 记录表：物体挂在测力计上、停在整数厘米的深度时记一行
  useEffect(() => {
    if (released || !Number.isInteger(h) || h < 1) return;
    setRows((r) => addInfoRow(r, infoRow(obj, liq, h)));
  }, [released, h, obj, liq]);

  useEffect(() => {
    if (released || !overflow) return;
    setOvRows((r) => addOverflowRow(r, overflowRow(obj, liq, h, collected)));
  }, [released, overflow, h, obj, liq, collected]);

  const resetCollect = () => setCollected(0);
  const pickObj = (id) => { setObjId(id); setH(H_START); setReleased(false); resetCollect(); };
  const pickLiq = (id) => { setLiqId(id); setH(H_START); setReleased(false); resetCollect(); };
  const toggleOverflow = (v) => { setOverflow(v); setH(H_START); setReleased(false); resetCollect(); };
  const refill = () => { setH(H_START); setReleased(false); resetCollect(); };
  const move = (d) => setH((p) => clamp(Math.round(p) + d, H_MIN, maxH));
  const drop = () => setH((p) => clamp(Math.round(p), H_MIN, maxH));
  const release = () => {
    setReleased(true);
    const key = settleKey(obj, liq, rel.state);
    setSeen((s) => (s.includes(key) ? s : [...s, key]));
  };
  const regrab = () => { setH(clamp(rel.h, H_MIN, maxH)); setReleased(false); };
  const reset = () => {
    setObjId("A"); setLiqId("water"); setH(H_START); setOverflow(false); setReleased(false);
    setCollected(0); setRows([]); setOvRows([]); setSeen([]);
  };

  const done = {
    weigh: rows.some((r) => r.full),
    grow: growsBeforeFull(rows),
    deep: constantAfterFull(rows),
    liquid: changesWithLiquid(rows),
    arch: archimedesDone(ovRows),
  };
  const doneCount = TASKS.filter((t) => done[t.key]).length;
  const floatDone = settleDone(seen);
  const sameDone = sameVolumeSameBuoyancy(rows);

  const gTotal = bucketTotal(liq, collected);
  const inAir = !released && hh <= 0;
  const FbText = released ? "—" : fmt(sim.readFb);

  return (
    <div className={styles.lab}>
      <Card className={styles.benchCard}>
        <div className={styles.stage}>
          <div className={styles.benchWrap}>
            <Bench obj={obj} liq={liq} hh={hh} sim={sim} released={released} overflow={overflow} collected={collected}
              maxH={maxH} onDrag={setH} onDrop={drop} />
          </div>

          <div className={styles.side}>
            <div className={styles.choose} role="group" aria-label="换物体">
              <span className={styles.groupLabel}>物体</span>
              <div className={styles.choices}>
                {OBJECTS.map((o) => (
                  <button key={o.id} type="button" aria-pressed={o.id === objId}
                    className={`island-btn ${o.id === objId ? "island-btn--primary" : ""} ${styles.chooseBtn}`} onClick={() => pickObj(o.id)}>
                    {o.name}
                    <small>{volumeOf(o)} cm³</small>
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.choose} role="group" aria-label="换液体">
              <span className={styles.groupLabel}>液体</span>
              <div className={styles.choices}>
                {LIQUIDS.map((l) => (
                  <button key={l.id} type="button" aria-pressed={l.id === liqId}
                    className={`island-btn ${l.id === liqId ? "island-btn--primary" : ""} ${styles.chooseBtn}`} onClick={() => pickLiq(l.id)}>
                    {l.name}
                    <small>{l.rhoText} g/cm³</small>
                  </button>
                ))}
              </div>
            </div>
            <label className={styles.switchRow}>
              <Switch checked={overflow} onChange={toggleOverflow} label="用溢水杯" />
              <span>用溢水杯（收集排开的液体）</span>
            </label>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.moveGroup} role="group" aria-label="移动物体">
            <span className={styles.groupLabel}>物体</span>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={released || h <= H_MIN} onClick={() => move(-1)}>提起 1 cm</button>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={released || h >= maxH} onClick={() => move(1)}>放下 1 cm</button>
          </div>
          <div className={styles.sideControls}>
            {released ? (
              <button type="button" className={`island-btn island-btn--primary ${styles.stepBtn}`} onClick={regrab}>重新挂上</button>
            ) : (
              <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={hh < Math.min(5, maxH) - 1e-9} onClick={release}>松手（选做）</button>
            )}
            {overflow && <button type="button" className={`island-btn ${styles.stepBtn}`} onClick={refill}>倒掉小桶里的液体，重新装满</button>}
            <button type="button" className={`island-btn ${styles.resetBtn}`} onClick={reset}>重来</button>
          </div>
        </div>
        <p className={styles.dragHint}>直接上下拖动物体，或用按钮一格一格放（松开后物体停在整数厘米处，并自动记一行）。测力计分度值 0.1 N，读数估读到 0.05 N。</p>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.status}>
          <Title as="h2" variant="tab" tone="teal">现在的情况</Title>
          <div className={styles.readRow}>
            <div className={styles.reading}>
              <span className={styles.readLabel}>物重 G</span>
              <strong className={styles.readValue}>{fmt(sim.readG)}<small> N</small></strong>
              <span className={styles.readLabel}>在空气中称</span>
            </div>
            <div className={`${styles.reading} ${styles.readingF}`}>
              <span className={styles.readLabel}>示数 F拉</span>
              <strong className={styles.readValue}>{released ? "—" : fmt(sim.readF)}{!released && <small> N</small>}</strong>
              <span className={styles.readLabel}>{released ? "没有挂着" : "浸在液体里称"}</span>
            </div>
            <div className={`${styles.reading} ${styles.readingB}`}>
              <span className={styles.readLabel}>浮力 F浮</span>
              <strong className={styles.readValue}>{FbText}{!released && <small> N</small>}</strong>
              <span className={styles.readLabel}>F浮 = G − F拉</span>
            </div>
          </div>
          <dl className={styles.facts}>
            <div><dt>物体</dt><dd>{obj.name}，体积 {volumeOf(obj)} cm³</dd></div>
            <div><dt>下表面深度 h</dt><dd>{inAir ? "在液面上方" : `${fmtH(hh)} cm`}</dd></div>
            <div><dt>浸在液体中的体积</dt><dd>{sim.V} cm³</dd></div>
            {overflow && (
              <>
                <div><dt>小桶</dt><dd>空桶重 G桶 = {fmt(BUCKET_WEIGHT)} N，现在 G总 = {fmt(gTotal)} N</dd></div>
                <div><dt>排开的液体重 G排</dt><dd>{fmt(Number((gTotal - BUCKET_WEIGHT).toFixed(2)))} N</dd></div>
              </>
            )}
          </dl>
          <p className={styles.explain}>{describe({ released, rel, obj, liq, hh, sim, overflow, collected })}</p>
        </Card>

        <Card className={styles.tasks}>
          <Title as="h2" variant="tab" tone="green">实验任务</Title>
          <Progress value={doneCount} max={TASKS.length} label={`${doneCount} / ${TASKS.length}`} ariaLabel="实验任务完成了几项" />
          <ul className={styles.taskList}>
            {TASKS.map((t) => (
              <li key={t.key}><Check checked={done[t.key]} onChange={() => {}}>{t.text}</Check></li>
            ))}
          </ul>
          <ul className={styles.taskList}>
            <li><Check checked={floatDone} onChange={() => {}}>选做：用塑料块 D，浸没后松手，看它在水里和在盐水里各怎样</Check></li>
          </ul>
          {doneCount === TASKS.length && (
            <Notice type="success" title="实验全部完成！">物体在液体中所受浮力的大小，跟它浸在液体中的体积有关，跟液体的密度有关：体积越大、液体密度越大，浮力就越大；浸没以后，跟深度没有关系。浸在液体中的物体受到向上的浮力，浮力的大小等于它排开的液体所受的重力：F浮 = G排。</Notice>
          )}
        </Card>
      </div>

      <div className={styles.panels}>
        <Card className={styles.records}>
          <Title as="h2" variant="tab" tone="blue">实验记录</Title>
          <p className={styles.note}>物体停在整数厘米的深度，就自动记一行。F浮 = G − F拉。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>物体</th><th>液体</th><th>深度 h/cm</th><th>浸在液体中的体积/cm³</th><th>F拉/N</th><th>F浮/N</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className={styles.empty}>还没有记录。把物体放进液体里，停在 1 cm、2 cm……处。</td></tr>
                ) : rows.map((r) => (
                  <tr key={`${r.obj}${r.liq}${r.h}`} className={!released && r.obj === objId && r.liq === liqId && r.h === h ? styles.currentRow : undefined}>
                    <td>{objectOf(r.obj).name}</td><td>{liquidOf(r.liq).name}</td><td>{r.h}</td><td>{r.V}</td><td>{fmt(r.F)}</td><td>{fmt(r.Fb)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className={styles.records}>
          <Title as="h2" variant="tab" tone="orange">溢水杯实验记录</Title>
          <p className={styles.note}>打开“用溢水杯”，物体浸没后自动记一行。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>序号</th><th>物体、液体</th><th>G桶/N</th><th>G物/N</th><th>F拉/N</th><th>G总/N</th><th>F浮/N</th><th>G排/N</th></tr>
              </thead>
              <tbody>
                {ovRows.length === 0 ? (
                  <tr><td colSpan={8} className={styles.empty}>还没有记录。用溢水杯把物体浸没在液体里。</td></tr>
                ) : ovRows.map((r, i) => (
                  <tr key={`${r.obj}${r.liq}`}>
                    <td>{i + 1}</td><td className={styles.wrapCell}>{objectOf(r.obj).name}、{liquidOf(r.liq).name}</td>
                    <td>{fmt(r.Gbucket)}</td><td>{fmt(r.Gobj)}</td><td>{fmt(r.F)}</td><td>{fmt(r.Gtotal)}</td><td>{fmt(r.Fb)}</td><td>{fmt(r.Gdisp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className={styles.panels}>
        <Card className={styles.rules}>
          <Title as="h2" variant="tab" tone="yellow">浮力的大小跟什么有关</Title>
          <p className={styles.note}>做出来的才填上。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>改变的量</th><th>发现</th></tr></thead>
              <tbody>
                <tr><td className={styles.range}>浸在液体中的体积</td>{done.grow ? <td className={styles.left}>浸没之前，体积越大，浮力越大</td> : <td className={styles.empty}>还没做出来</td>}</tr>
                <tr><td className={styles.range}>浸没后的深度</td>{done.deep ? <td className={styles.left}>浸没以后，浮力跟深度没有关系</td> : <td className={styles.empty}>还没做出来</td>}</tr>
                <tr><td className={styles.range}>液体的密度</td>{done.liquid ? <td className={styles.left}>液体的密度越大，浮力越大</td> : <td className={styles.empty}>还没做出来</td>}</tr>
                <tr><td className={styles.range}>物体的密度</td>{sameDone ? <td className={styles.left}>铝块 A、铜块 B 体积相同、密度不同，浸没在同一种液体里浮力相等，跟物体的密度无关</td> : <td className={styles.empty}>还没做出来（把铝块 A 和铜块 B 分别浸没在同一种液体里）</td>}</tr>
                <tr><td className={styles.range}>浮力和排开的液体</td>{done.arch ? <td className={styles.left}>F浮 = G排：浮力的大小等于它排开的液体所受的重力</td> : <td className={styles.empty}>还没做出来</td>}</tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card className={styles.rules}>
          <Title as="h2" variant="tab" tone="lime">浮力—深度图像（{obj.name}）</Title>
          <p className={styles.note}>记录表里的数据自动画出来：先升高，浸没后变成水平的线。</p>
          <Graph rows={rows} obj={obj} />
        </Card>
      </div>
    </div>
  );
}
