"use client";

// 凸透镜成像实验室：在光具座上拖动发光物体和光屏，找清晰的像，把结果记进课本那样的表格。
// 物理模型在 src/lib/lensLab.js。画面不做自动动画，服务器渲染出来的初始画面就是完整的静态图。
import { useEffect, useRef, useState } from "react";
import { Card, Check, Notice, Progress, Switch, Title } from "@/components/island/Island";
import {
  F, LENS_X, OBJ_H, OBJ_MAX, OBJ_MIN, SCREEN_MAX, SCREEN_MIN, SCREEN_STEP, REGION_LABEL,
  addRecord, clamp, imageOf, objU, recordRow, regionOf, screenS, screenView, snap,
} from "@/lib/lensLab";
import styles from "./LensLab.module.css";

const BLUE = "#287fc4";
const CORAL = "#c9554d";
const YELLOW = "#bf8d08";
const GREEN = "#197a60";
const LINE = "#52626a";
const LIGHT = "#bec9ce";
const INK = "#20272b";

const START_OBJ = 10;
const START_SCREEN = 80;

// ---------- 光具座侧视图 ----------
const SC = 7.6; // 每厘米多少像素
const X0 = 20;
const AY = 150; // 主光轴
const CLIP_BOTTOM = 262; // 光路和像只画到这里，下面留给文字和刻度尺
const xs = (cm) => X0 + cm * SC;
const ys = (h) => AY - h * SC;
const HALF = OBJ_H / 2;
const LENS_HALF = 6;

function Arrow({ x, from, to, color, dashed, width = 4 }) {
  // 从高度 from 画到高度 to（单位 cm），箭头在 to 一端
  const y1 = ys(from);
  const y2 = ys(to);
  const dir = Math.sign(y2 - y1) || 1;
  const head = Math.min(9, Math.abs(y2 - y1) * 0.45);
  return (
    <g>
      <path d={`M${x} ${y1}V${y2 - dir * head * 0.6}`} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? "6 5" : undefined} />
      <path d={`M${x - head * 0.8} ${y2 - dir * head}L${x} ${y2}L${x + head * 0.8} ${y2 - dir * head}Z`} fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  );
}

// 三条特殊光线（过光心一定画；平行于主光轴的一定画；过焦点的那条打在透镜上才画）
function Rays({ objPos, scrPos, look }) {
  const u = objU(objPos);
  const img = imageOf(u);
  const tipX = objPos;
  const end = look ? 100 : scrPos;
  const rays = [
    { yL: HALF, k: -HALF / F },
    { yL: 0, k: -HALF / u },
  ];
  if (Math.abs(u - F) > 0.5) {
    const yL = (-HALF * F) / (u - F);
    if (Math.abs(yL) <= LENS_HALF - 0.4) rays.push({ yL, k: 0 });
  }
  const at = (r, x) => r.yL + r.k * (x - LENS_X);
  const imgX = img.kind !== "none" ? LENS_X + img.v : null;
  return (
    <g stroke={CORAL} strokeWidth="2" strokeLinecap="round" fill="none">
      {rays.map((r, i) => (
        <g key={i}>
          <path d={`M${xs(tipX)} ${ys(HALF)}L${xs(LENS_X)} ${ys(r.yL)}L${xs(end)} ${ys(at(r, end))}`} />
          {img.kind === "real" && imgX > end && (
            <path d={`M${xs(end)} ${ys(at(r, end))}L${xs(Math.min(imgX, 100))} ${ys(at(r, Math.min(imgX, 100)))}`} strokeDasharray="4 5" opacity="0.6" />
          )}
          {img.kind === "virtual" && (
            <path d={`M${xs(LENS_X)} ${ys(r.yL)}L${xs(imgX)} ${ys(at(r, imgX))}`} strokeDasharray="4 5" opacity="0.6" />
          )}
        </g>
      ))}
    </g>
  );
}

function Bench({ objPos, scrPos, look, rays, onDragObj, onDragScreen }) {
  const svgRef = useRef(null);
  const drag = useRef(null);
  const u = objU(objPos);
  const s = screenS(scrPos);
  const img = imageOf(u);
  const view = screenView(u, s);
  const showImage = img.kind !== "none" && (rays || look || (img.kind === "real" && view.sharp));
  const imgX = img.kind !== "none" ? LENS_X + img.v : null;

  const toCm = (e) => {
    const svg = svgRef.current;
    const m = svg.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return (p.x - X0) / SC;
  };
  const start = (which) => (e) => {
    e.preventDefault();
    drag.current = which;
    svgRef.current.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!drag.current) return;
    const cm = toCm(e);
    if (cm == null) return;
    if (drag.current === "obj") onDragObj(clamp(Math.round(cm), OBJ_MIN, OBJ_MAX));
    else onDragScreen(clamp(snap(cm, SCREEN_STEP), SCREEN_MIN, SCREEN_MAX));
  };
  const stop = () => { drag.current = null; };
  const keys = (which) => (e) => {
    const d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    if (!d) return;
    e.preventDefault();
    if (which === "obj") onDragObj(clamp(objPos + d, OBJ_MIN, OBJ_MAX));
    else onDragScreen(clamp(scrPos + d * SCREEN_STEP, SCREEN_MIN, SCREEN_MAX));
  };

  const objLabelX = Math.min(xs(objPos), xs(LENS_X - 8));
  const scrLabelX = Math.max(xs(scrPos), xs(LENS_X + 8));

  return (
    <svg ref={svgRef} className={styles.bench} viewBox="0 40 800 320" role="group"
      aria-label={`光具座：物体在 ${objPos} 厘米处，凸透镜在 50 厘米处，${look ? "光屏已撤去" : `光屏在 ${scrPos} 厘米处`}`}
      onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
      <defs>
        <clipPath id="lens-optics"><rect x={xs(0)} y="40" width={xs(100) - xs(0)} height={CLIP_BOTTOM - 40} /></clipPath>
      </defs>
      {/* 主光轴 */}
      <path d={`M${xs(0)} ${AY}H${xs(100)}`} stroke={LIGHT} strokeWidth="1.4" strokeDasharray="10 4 2 4" />
      {/* 焦点、二倍焦距点 */}
      {[30, 40, 60, 70].map((p) => <circle key={p} cx={xs(p)} cy={AY} r="3" fill={INK} />)}
      {[[30, "2F"], [40, "F"], [60, "F"], [70, "2F"]].map(([p, t]) => (
        <text key={p} x={xs(p)} y="282" textAnchor="middle" className={styles.focusLabel}>{t}</text>
      ))}

      <g clipPath="url(#lens-optics)">
        {rays && <Rays objPos={objPos} scrPos={scrPos} look={look} />}
        {showImage && img.kind === "real" && (
          <Arrow x={xs(imgX)} from={HALF * img.m} to={-HALF * img.m} color={YELLOW} />
        )}
        {showImage && img.kind === "virtual" && (
          <Arrow x={xs(imgX)} from={-HALF * img.m} to={HALF * img.m} color={YELLOW} dashed />
        )}
      </g>

      {/* 凸透镜 */}
      <path d={`M${xs(LENS_X)} ${ys(LENS_HALF)}Q${xs(LENS_X) + 15} ${AY} ${xs(LENS_X)} ${ys(-LENS_HALF)}Q${xs(LENS_X) - 15} ${AY} ${xs(LENS_X)} ${ys(LENS_HALF)}Z`}
        fill="#dceff9" stroke={BLUE} strokeWidth="1.8" opacity="0.92" />
      <circle cx={xs(LENS_X)} cy={AY} r="2.6" fill={INK} />

      {/* 发光物体（F 形发光二极管，侧面看是一根竖条，箭头朝上） */}
      <Arrow x={xs(objPos)} from={-HALF} to={HALF} color={GREEN} width={5} />

      {/* 光屏或眼睛 */}
      {look ? (
        <g stroke={LINE} strokeWidth="1.8" fill="#fff">
          <path d={`M${xs(100) - 2} ${AY}q-9 -9 -18 0q9 9 18 0z`} />
          <circle cx={xs(100) - 11} cy={AY} r="3.2" fill={INK} stroke="none" />
        </g>
      ) : (
        <rect x={xs(scrPos) - 4} y={ys(7)} width="8" height={14 * SC} rx="2" fill="#f4f6f7" stroke={LINE} strokeWidth="1.6" />
      )}

      {/* 刻度尺 */}
      <rect x={xs(0)} y="292" width={xs(100) - xs(0)} height="6" rx="2" fill="#eef2f3" stroke={LINE} strokeWidth="1.2" />
      {Array.from({ length: 101 }, (_, i) => i).map((i) => (
        <path key={i} d={`M${xs(i)} 292v${i % 10 === 0 ? -8 : i % 5 === 0 ? -5 : -3}`} stroke={LINE} strokeWidth={i % 10 === 0 ? 1.4 : 0.8} />
      ))}
      {Array.from({ length: 11 }, (_, i) => i * 10).map((t) => (
        <text key={t} x={xs(t)} y="326" textAnchor="middle" className={styles.tick}>{t}</text>
      ))}
      <text x={xs(95)} y="326" textAnchor="middle" className={styles.tick}>cm</text>
      <text x={objLabelX} y="350" textAnchor="middle" className={styles.partLabel} fill={GREEN}>物体</text>
      <text x={xs(LENS_X)} y="350" textAnchor="middle" className={styles.partLabel} fill="#1f6aa6">凸透镜</text>
      {!look && <text x={scrLabelX} y="350" textAnchor="middle" className={styles.partLabel}>光屏</text>}

      {/* 拖动把手：刻度尺上的小三角 + 一整条透明的触摸区 */}
      <path d={`M${xs(objPos)} 300l-6 9h12z`} fill={GREEN} />
      <rect className={styles.handle} x={Math.max(xs(objPos) - 26, 0)} y="60" width={Math.min(52, xs(LENS_X) - (xs(objPos) - 26))} height="300" fill="transparent"
        tabIndex={0} role="slider" aria-label="物体的位置" aria-valuemin={OBJ_MIN} aria-valuemax={OBJ_MAX} aria-valuenow={objPos}
        aria-valuetext={`${objPos} 厘米，物距 ${u} 厘米`}
        onPointerDown={start("obj")} onKeyDown={keys("obj")} />
      {!look && (
        <>
          <path d={`M${xs(scrPos)} 300l-6 9h12z`} fill={LINE} />
          <rect className={styles.handle} x={Math.max(xs(scrPos) - 26, xs(LENS_X))} y="60" width="52" height="300" fill="transparent"
            tabIndex={0} role="slider" aria-label="光屏的位置" aria-valuemin={SCREEN_MIN} aria-valuemax={SCREEN_MAX} aria-valuenow={scrPos}
            aria-valuetext={`${scrPos} 厘米`}
            onPointerDown={start("scr")} onKeyDown={keys("scr")} />
        </>
      )}
    </svg>
  );
}

// ---------- 光屏上（或透过透镜）看到的 ----------
const PX = 13; // 每厘米多少像素
// F 字形，高 1、宽 0.62，中心在原点，正立（y 朝下为正，所以上横在 −0.5）
const F_RECTS = [
  [-0.31, -0.5, 0.16, 1],
  [-0.31, -0.5, 0.62, 0.16],
  [-0.31, -0.08, 0.46, 0.15],
];

function Glyph({ size, inverted, filter, opacity = 1 }) {
  return (
    <g transform={`translate(130 130) scale(${size}) rotate(${inverted ? 180 : 0})`} filter={filter} opacity={opacity}>
      {F_RECTS.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={YELLOW} />)}
    </g>
  );
}

function ScreenView({ objPos, scrPos, look }) {
  const u = objU(objPos);
  const s = screenS(scrPos);
  const img = imageOf(u);
  const view = screenView(u, s);
  if (look) {
    return (
      <svg className={styles.screen} viewBox="0 0 260 260" role="img"
        aria-label={img.kind === "none" ? "透过透镜看不到清晰的像" : `透过透镜看到${img.upright ? "正立" : "倒立"}、${img.size}的像`}>
        <defs>
          <clipPath id="lens-look"><circle cx="130" cy="130" r="112" /></clipPath>
          <filter id="lens-look-blur" filterUnits="userSpaceOnUse" x="0" y="0" width="260" height="260"><feGaussianBlur stdDeviation="14" /></filter>
        </defs>
        <circle cx="130" cy="130" r="112" fill="#eef7fc" stroke={BLUE} strokeWidth="3" />
        <g clipPath="url(#lens-look)">
          {img.kind === "none"
            ? <Glyph size={OBJ_H * 4 * PX} filter="url(#lens-look-blur)" opacity={0.5} />
            : <Glyph size={OBJ_H * img.m * PX} inverted={!img.upright} />}
        </g>
      </svg>
    );
  }
  // 离像越远越糊；糊的同时光也散开，但始终留一团看得见的光
  const std = Math.min(14, (view.blur * PX) / 4);
  return (
    <svg className={styles.screen} viewBox="0 0 260 260" role="img"
      aria-label={view.sharp ? `光屏上是清晰的倒立、${img.size}的像` : view.patch ? "光屏上只有一片光，没有像" : "光屏上的像是模糊的"}>
      <defs>
        <filter id="lens-screen-blur" filterUnits="userSpaceOnUse" x="0" y="0" width="260" height="260"><feGaussianBlur stdDeviation={std.toFixed(2)} /></filter>
        <clipPath id="lens-screen"><rect x="10" y="10" width="240" height="240" rx="10" /></clipPath>
      </defs>
      <rect x="10" y="10" width="240" height="240" rx="10" fill="#f4f6f7" stroke={LINE} strokeWidth="2" />
      <g clipPath="url(#lens-screen)">
        {view.patch ? (
          <circle cx="130" cy="130" r={Math.min(150, (view.blur / 2) * PX)} fill={YELLOW} opacity="0.28" filter="url(#lens-screen-blur)" />
        ) : (
          <>
            {!view.sharp && (
              // 没对准时，像的光散成一团：像越大、离得越远，光斑越大越淡
              <circle cx="130" cy="130" r={Math.min(110, (OBJ_H * view.scale * PX) / 2 + (view.blur * PX) / 2)}
                fill={YELLOW} opacity={Math.max(0.18, 0.4 / (1 + view.blur / 6))} filter="url(#lens-screen-blur)" />
            )}
            <Glyph size={OBJ_H * view.scale * PX} inverted filter={std > 0.05 ? "url(#lens-screen-blur)" : undefined} opacity={Math.max(0.45, 1 / (1 + view.blur / 10))} />
          </>
        )}
      </g>
    </svg>
  );
}

// ---------- 说明文字 ----------
const APPS = { gt2f: "照相机", eq2f: "—", f2f: "投影仪", ltf: "放大镜", eqf: "—" };

function describe(u, s, look, img, view) {
  if (img.kind === "none") return "物体正好在焦点上：从焦点发出的光经过凸透镜后变成平行光，不再会聚，所以不成像。";
  if (look) {
    if (img.kind === "virtual") return "看到了！透过透镜看到一个正立、放大的像，它和物体在透镜的同一侧。这个像不是光实际会聚成的，是虚像，光屏接不到。放大镜就是这样用的。";
    return "撤去光屏，从这一侧也能看到倒立的像。放回光屏，找一找它的位置。";
  }
  if (img.kind === "virtual") return "不管光屏怎么移，都只有一片模糊的光，接不到像。按“撤去光屏，从这一侧看”，像课本上那样从光屏一侧向透镜看看。";
  if (view.sharp) {
    const where = img.size === "缩小" ? "照相机就是这样成像的。" : img.size === "放大" ? "投影仪就是这样成像的。" : "像和物体一样大。";
    return `光屏上出现了清晰的像！是倒立、${img.size}的实像，像距 v = ${s} cm。${where}`;
  }
  if (LENS_X + img.v > SCREEN_MAX) return "光屏移到最远，也接不到清晰的像：像成在光具座外面了。把物体移远一点再试试。";
  return "光屏上的像还是模糊的。前后移动光屏，找到像最清楚的位置。";
}

const TASKS = [
  { key: "gt2f", text: "在光屏上得到一个缩小的像" },
  { key: "eq2f", text: "得到一个和物体一样大的像" },
  { key: "f2f", text: "得到一个放大的实像" },
  { key: "ltf", text: "把物体移到焦点以内，光屏还接得到像吗？从光屏一侧看看" },
  { key: "trend", text: "在 3 个不同的位置得到实像，比一比：物距变小，像距和像怎样变？" },
];

const RULES = [
  { key: "gt2f", range: "u > 2f", image: "倒立、缩小的实像", v: "f < v < 2f", app: "照相机" },
  { key: "eq2f", range: "u = 2f", image: "倒立、等大的实像", v: "v = 2f", app: "" },
  { key: "f2f", range: "f < u < 2f", image: "倒立、放大的实像", v: "v > 2f", app: "投影仪" },
  { key: "ltf", range: "u < f", image: "正立、放大的虚像", v: "像和物在透镜同侧", app: "放大镜" },
];

export default function LensLab() {
  const [objPos, setObjPos] = useState(START_OBJ);
  const [scrPos, setScrPos] = useState(START_SCREEN);
  const [look, setLook] = useState(false);
  const [rays, setRays] = useState(false);
  const [records, setRecords] = useState([]);

  const u = objU(objPos);
  const s = screenS(scrPos);
  const img = imageOf(u);
  const view = screenView(u, s);
  const region = regionOf(u);

  useEffect(() => {
    if (look && img.kind === "real") return;
    const row = recordRow(u, s, look);
    if (row) setRecords((r) => addRecord(r, row));
  }, [u, s, look, img.kind]);

  const found = new Set(records.map((r) => r.region));
  // 比一比要隔得开：3 个以上实像，最远和最近的物距差 10 cm 以上（挪物体时顺路碰上的几个相邻位置不算）
  const realUs = records.filter((r) => r.nature === "实像").map((r) => r.u);
  const trend = realUs.length >= 3 && Math.max(...realUs) - Math.min(...realUs) >= 10;
  const done = { gt2f: found.has("gt2f"), eq2f: found.has("eq2f"), f2f: found.has("f2f"), ltf: found.has("ltf"), trend };
  const doneCount = TASKS.filter((t) => done[t.key]).length;

  const known = (look && img.kind === "virtual") || (!look && img.kind === "real" && view.sharp);
  const imageText = img.kind === "none" ? "不成像" : known ? `${img.upright ? "正立" : "倒立"}、${img.size}的${img.kind === "real" ? "实像" : "虚像"}` : "先找到像，再判断";
  const screenText = look ? "已撤去" : view.sharp ? "清晰的像" : view.patch ? "一片光，没有像" : "模糊的像";
  const vText = look && img.kind === "virtual" ? "在物体同侧" : !look && view.sharp ? `${s}` : "—";

  const moveObj = (d) => setObjPos((p) => clamp(p + d, OBJ_MIN, OBJ_MAX));
  const moveScr = (d) => setScrPos((p) => clamp(p + d * SCREEN_STEP, SCREEN_MIN, SCREEN_MAX));
  const reset = () => { setObjPos(START_OBJ); setScrPos(START_SCREEN); setLook(false); setRays(false); setRecords([]); };

  return (
    <div className={styles.lab}>
      <Card className={styles.benchCard}>
        <div className={styles.stage}>
          <div className={styles.benchWrap}>
            <Bench objPos={objPos} scrPos={scrPos} look={look} rays={rays} onDragObj={setObjPos} onDragScreen={setScrPos} />
          </div>
          <figure className={styles.screenWrap}>
            <ScreenView objPos={objPos} scrPos={scrPos} look={look} />
            <figcaption>{look ? "透过透镜看到的" : "光屏上看到的"}</figcaption>
          </figure>
        </div>

        <div className={styles.controls}>
          <div className={styles.moveGroup} role="group" aria-label="移动物体">
            <span className={styles.groupLabel}>物体</span>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={objPos <= OBJ_MIN} onClick={() => moveObj(-1)}>远离透镜</button>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={objPos >= OBJ_MAX} onClick={() => moveObj(1)}>靠近透镜</button>
          </div>
          <div className={styles.moveGroup} role="group" aria-label="移动光屏">
            <span className={styles.groupLabel}>光屏</span>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={look || scrPos <= SCREEN_MIN} onClick={() => moveScr(-1)}>靠近透镜</button>
            <button type="button" className={`island-btn ${styles.stepBtn}`} disabled={look || scrPos >= SCREEN_MAX} onClick={() => moveScr(1)}>远离透镜</button>
          </div>
          <div className={styles.sideControls}>
            <label className={styles.switchRow}>
              <Switch checked={rays} onChange={setRays} label="显示光路" />
              <span>显示光路</span>
            </label>
            <button type="button" aria-pressed={look} className={`island-btn ${look ? "island-btn--primary" : ""} ${styles.lookBtn}`} onClick={() => setLook((v) => !v)}>
              {look ? "放回光屏" : "撤去光屏，从这一侧看"}
            </button>
            <button type="button" className={`island-btn ${styles.resetBtn}`} onClick={reset}>重来</button>
          </div>
        </div>
        <p className={styles.dragHint}>直接拖动物体、光屏，或者用下面的按钮一点一点挪（物体每次 1 cm，光屏每次 0.5 cm）。</p>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.status}>
          <Title as="h2" variant="tab" tone="teal">现在的情况</Title>
          <div className={styles.readRow}>
            <div className={styles.reading}>
              <span className={styles.readLabel}>物距 u</span>
              <strong className={styles.readValue}>{u}<small> cm</small></strong>
              <span className={styles.region}>{REGION_LABEL[region]}</span>
            </div>
            <div className={`${styles.reading} ${styles.readingV}`}>
              <span className={styles.readLabel}>像距 v</span>
              <strong className={`${styles.readValue} ${vText === "在物体同侧" ? styles.readWord : ""}`}>{vText}{vText !== "—" && vText !== "在物体同侧" && <small> cm</small>}</strong>
              <span className={styles.readLabel}>焦距 f = {F} cm</span>
            </div>
          </div>
          <dl className={styles.facts}>
            <div><dt>光屏上</dt><dd>{screenText}</dd></div>
            <div><dt>像</dt><dd>{imageText}</dd></div>
            <div><dt>相当于</dt><dd>{known ? APPS[region] : "—"}</dd></div>
          </dl>
          <p className={styles.explain}>{describe(u, s, look, img, view)}</p>
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
            <Notice type="success" title="实验全部完成！">物体从远处移近焦点：像从缩小变到等大、再变到放大，像也离透镜越来越远——物近像远像变大。进到焦点以内，就成了正立、放大的虚像。</Notice>
          )}
        </Card>
      </div>

      <div className={styles.panels}>
        <Card className={styles.records}>
          <Title as="h2" variant="tab" tone="blue">实验记录</Title>
          <p className={styles.note}>每找到一个清晰的像，就自动记一行。焦距 f = {F} cm。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th rowSpan={2}>物距/cm</th><th rowSpan={2}>像距/cm</th><th colSpan={3}>像的性质</th></tr>
                <tr><th>虚实</th><th>大小</th><th>正倒</th></tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={5} className={styles.empty}>还没有记录。先移动光屏，找到一个清晰的像。</td></tr>
                ) : records.map((r) => (
                  <tr key={r.u} className={r.u === u ? styles.currentRow : undefined}>
                    <td>{r.u}</td><td>{r.v ?? "—"}</td><td>{r.nature}</td><td>{r.size}</td><td>{r.orient}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className={styles.rules}>
          <Title as="h2" variant="tab" tone="yellow">凸透镜成像的规律</Title>
          <p className={styles.note}>做出来的才填上。当前物距所在的一行会标出来。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>物距</th><th>像的性质</th><th>像距</th><th>应用</th></tr></thead>
              <tbody>
                {RULES.map((r) => {
                  const ok = found.has(r.key);
                  return (
                    <tr key={r.key} className={region === r.key ? styles.currentRow : undefined}>
                      <td className={styles.range}>{r.range}</td>
                      {ok ? (
                        <><td>{r.image}</td><td>{r.v}</td><td>{r.app || "—"}</td></>
                      ) : (
                        <td colSpan={3} className={styles.empty}>还没做出来</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
