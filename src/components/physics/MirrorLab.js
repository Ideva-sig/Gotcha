"use client";

// 平面镜成像 + 光的反射实验室。两个模式：光的反射（量角器 + 可折转的纸板）、平面镜成像（桌面俯视图）。
// 物理模型在 src/lib/mirrorLab.js。画面不做自动动画，服务器渲染出来的初始画面就是完整的静态图。
import { useEffect, useRef, useState } from "react";
import { Card, Check, Notice, Progress, Tabs, Title } from "@/components/island/Island";
import {
  A_D_MAX, A_D_MIN, A_D_STEP, A_Y_MAX, A_Y_MIN, A_Y_STEP, B_D_MAX, B_D_MIN, B_STEP, B_Y_MAX, B_Y_MIN,
  BOARD, CANDLE_R, CENTER_Y, DIM_Y, EMITTER_R, FOLD_BACK, FOLD_FRONT, GUIDE_R, INC_MAX, INC_MIN, INC_STEP, LABEL_ANGLES, LABEL_R,
  MIRROR_H, ORIGIN_R, PLATE_X, PX_CM, RAY_LEN, START_A, START_B, START_INC, TICK_R, VIEW_I, VIEW_R,
  addAngleRow, addImageRow, clamp, foldTransform, gap, imageOf, imageRow, imageTasks, overlaps, rayPoint, rayState,
  reflectRow, reflectTasks, reflectedSeen, screenView, snap, xOfA, xOfB, yOf,
} from "@/lib/mirrorLab";
import styles from "./MirrorLab.module.css";

const BLUE = "#287fc4";
const CORAL = "#c9554d";
const YELLOW = "#bf8d08";
const GREEN = "#197a60";
const LINE = "#52626a";
const LIGHT = "#bec9ce";
const INK = "#20272b";

const MODES = [
  { key: "a", label: "光的反射" },
  { key: "b", label: "平面镜成像" },
];

const TASKS = [
  { key: "angles", text: "多次改变入射角，记录入射角和反射角（至少 3 组）" },
  { key: "fold", text: "把纸板 F 向后折（或向前折），看纸板上还有没有反射光" },
  { key: "reverse", text: "让光沿 FO 射入，看反射光是不是沿 OE 射出" },
  { key: "pos", text: "移动蜡烛 B，找到像的位置，比较像距和物距（至少 3 组）" },
  { key: "screen", text: "在像的位置放一块光屏，看光屏上接不接得到像" },
];

const fmt = (x, d = 1) => x.toFixed(d);
const tidy = (x) => Number(x.toFixed(1));

// ---------- 光的反射：量角器 + 纸板 ----------
function Ticks({ side }) {
  const items = [];
  for (let a = 0; a <= 90; a += 5) {
    if (a === 0 && side > 0) continue;
    const s = a === 0 ? 1 : side;
    const p = rayPoint(a, s, TICK_R);
    const q = rayPoint(a, s, a % 10 === 0 ? GUIDE_R : TICK_R + 8);
    items.push(<path key={a} d={`M${p.x.toFixed(2)} ${p.y.toFixed(2)}L${q.x.toFixed(2)} ${q.y.toFixed(2)}`} stroke={LINE} strokeWidth={a % 10 === 0 ? 1.4 : 0.9} />);
  }
  return <g>{items}</g>;
}

function TickLabels({ side }) {
  return (
    <g className={styles.tickLabel} textAnchor="middle" dominantBaseline="central">
      {LABEL_ANGLES.filter((a) => !(a === 0 && side > 0)).map((a) => {
        const p = rayPoint(a, a === 0 ? 0 : side, LABEL_R);
        return <text key={a} x={p.x.toFixed(2)} y={p.y.toFixed(2)}>{a}</text>;
      })}
    </g>
  );
}

// 一条光线：从 O 到发射器，再往外一小段淡虚线对准刻度；emitter 为 true 时画激光笔，否则画一个小光斑
function Beam({ angle, side, emitter, color }) {
  const end = rayPoint(angle, side, RAY_LEN);
  const guide = rayPoint(angle, side, GUIDE_R);
  const fx = (p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  return (
    <g>
      <path d={`M0 0L${fx(end)}`} stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d={`M${fx(end)}L${fx(guide)}`} stroke={color} strokeWidth="1.6" strokeDasharray="4 4" opacity="0.55" />
      {emitter ? (
        <g transform={`translate(${fx(end)}) rotate(${side * angle})`}>
          <rect x="-6" y="-11" width="12" height="22" rx="3" fill="#dfe6e9" stroke={LINE} strokeWidth="1.6" />
          <circle cx="0" cy="9" r="3" fill={color} />
        </g>
      ) : (
        <circle cx={end.x.toFixed(2)} cy={end.y.toFixed(2)} r="5" fill={color} />
      )}
    </g>
  );
}

function Arc({ angle, side, color, r = 56 }) {
  const p = rayPoint(angle, side, r);
  return <path d={`M0 ${-r}A${r} ${r} 0 0 ${side > 0 ? 1 : 0} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />;
}

function ReflectBench({ inc, side, fold, onAngle }) {
  const svgRef = useRef(null);
  const drag = useRef(false);
  const s = rayState(inc, side);
  const seen = reflectedSeen(fold);
  const { sx, shear } = foldTransform(fold);

  const angleAt = (e) => {
    const svg = svgRef.current;
    const m = svg.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const dx = p.x - ORIGIN_R.x;
    const dy = ORIGIN_R.y - p.y;
    return (Math.atan2(Math.abs(dx), dy) * 180) / Math.PI;
  };
  const start = (e) => {
    e.preventDefault();
    drag.current = true;
    svgRef.current.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!drag.current) return;
    const a = angleAt(e);
    if (a != null) onAngle(clamp(snap(a, INC_STEP), INC_MIN, INC_MAX));
  };
  const stop = () => { drag.current = false; };
  const keys = (e) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    onAngle(clamp(inc + d * INC_STEP, INC_MIN, INC_MAX));
  };

  const emitEnd = rayPoint(inc, side, RAY_LEN);
  const half = (sd) => (sd < 0 ? "left" : "right");
  // 每一侧的光线：入射光在 side，反射光在 −side；右半块折走后，上面没有光
  const rays = [
    { angle: s.i, side: s.side, emitter: true, color: CORAL, kind: "i" },
    { angle: s.r, side: s.outSide, emitter: false, color: CORAL, kind: "r" },
  ];
  const onHalf = (sd) => rays.filter((r) => r.side === sd && (sd < 0 || seen));

  const board = (sd) => (
    <g>
      <path d={`M0 ${-BOARD.h}H${sd * BOARD.w}V0H0Z`} fill={sd < 0 || seen ? "#f7f9fa" : "#e3e9ec"} stroke={LINE} strokeWidth="1.8" strokeLinejoin="round" />
      <Ticks side={sd} />
      <TickLabels side={sd} />
      <text x={sd * (BOARD.w - 20)} y={-BOARD.h + 24} textAnchor="middle" className={styles.faceLabel}>{sd < 0 ? "E" : "F"}</text>
      {onHalf(sd).filter((r) => r.kind === "r").map((r) => <Beam key="r" {...r} />)}
      {onHalf(sd).filter((r) => r.kind === "i").map((r) => <Beam key="i" {...r} />)}
      {sd < 0 && <Arc angle={s.side < 0 ? s.i : s.r} side={-1} color={s.side < 0 ? BLUE : GREEN} />}
      {sd > 0 && seen && <Arc angle={s.side > 0 ? s.i : s.r} side={1} color={s.side > 0 ? BLUE : GREEN} />}
    </g>
  );

  return (
    <svg ref={svgRef} className={styles.bench} viewBox={`0 0 ${VIEW_R.w} ${VIEW_R.h}`} role="group"
      aria-label={`光的反射：入射角 ${inc} 度，${seen ? `反射角 ${s.r} 度` : "纸板折起来了，纸板上看不到反射光"}`}
      onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
      <g transform={`translate(${ORIGIN_R.x} ${ORIGIN_R.y})`}>
        {/* 平面镜 */}
        <rect x={-BOARD.w - 10} y="0" width={2 * BOARD.w + 20} height={MIRROR_H} rx="2" fill="#dceff9" stroke={BLUE} strokeWidth="1.8" />
        <path d={`M${-BOARD.w - 10} ${MIRROR_H}H${BOARD.w + 10}`} stroke={LINE} strokeWidth="1.4" />
        {/* 纸板左半块 E，右半块 F */}
        {board(-1)}
        <g transform={`matrix(${sx.toFixed(4)} ${shear.toFixed(4)} 0 1 0 0)`}>{board(1)}</g>
        {/* 法线 */}
        <path d={`M0 0V${-TICK_R}`} stroke={LINE} strokeWidth="1.6" strokeDasharray="7 5" />
        <circle cx="0" cy="0" r="3.2" fill={INK} />
        <text x="14" y="26" textAnchor="middle" className={styles.partLabel}>O</text>
        {/* 拖动把手：发射器上的透明圆 */}
        <circle className={styles.handle} cx={emitEnd.x.toFixed(2)} cy={emitEnd.y.toFixed(2)} r={EMITTER_R + 14} fill="transparent"
          tabIndex={0} role="slider" aria-label={`入射光的方向（${half(side) === "left" ? "E" : "F"} 一侧）`} aria-valuemin={INC_MIN} aria-valuemax={INC_MAX} aria-valuenow={inc}
          aria-valuetext={`入射角 ${inc} 度`} onPointerDown={start} onKeyDown={keys} />
      </g>
    </svg>
  );
}

// ---------- 平面镜成像：桌面俯视图 ----------
function Candle({ x, y, lit, fill, stroke }) {
  return (
    <g>
      {lit && <circle cx={x} cy={y} r={CANDLE_R + 7} fill={YELLOW} opacity="0.22" />}
      <circle cx={x} cy={y} r={CANDLE_R} fill={fill} stroke={stroke} strokeWidth="2" />
      {lit && <circle cx={x} cy={y} r="3.2" fill={CORAL} />}
    </g>
  );
}

function ImageBench({ a, b, screenOn, onA, onB }) {
  const svgRef = useRef(null);
  const drag = useRef(null);
  const img = imageOf(a);
  const ok = overlaps(a, b);
  const near = gap(img, b) <= 1.5;

  const toCm = (e) => {
    const svg = svgRef.current;
    const m = svg.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  const start = (which) => (e) => {
    e.preventDefault();
    drag.current = which;
    svgRef.current.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!drag.current) return;
    const p = toCm(e);
    if (!p) return;
    const y = (CENTER_Y - p.y) / PX_CM;
    if (drag.current === "a") {
      onA({ d: clamp(snap((PLATE_X - p.x) / PX_CM, A_D_STEP), A_D_MIN, A_D_MAX), y: clamp(snap(y, A_Y_STEP), A_Y_MIN, A_Y_MAX) });
    } else {
      onB({ d: clamp(snap((p.x - PLATE_X) / PX_CM, B_STEP), B_D_MIN, B_D_MAX), y: clamp(snap(y, B_STEP), B_Y_MIN, B_Y_MAX) });
    }
  };
  const stop = () => { drag.current = null; };
  const keysA = (e) => {
    const dx = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0; // 屏幕向左 = 离玻璃板更远
    const dy = e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : 0;
    if (!dx && !dy) return;
    e.preventDefault();
    onA({ d: clamp(a.d + dx * A_D_STEP, A_D_MIN, A_D_MAX), y: clamp(a.y + dy * A_Y_STEP, A_Y_MIN, A_Y_MAX) });
  };
  const keysB = (e) => {
    const dx = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const dy = e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : 0;
    if (!dx && !dy) return;
    e.preventDefault();
    onB({ d: clamp(tidy(b.d + dx * B_STEP), B_D_MIN, B_D_MAX), y: clamp(tidy(b.y + dy * B_STEP), B_Y_MIN, B_Y_MAX) });
  };

  const ax = xOfA(a.d);
  const ay = yOf(a.y);
  const ix = xOfB(img.d);
  const iy = yOf(img.y);
  const bx = xOfB(b.d);
  const by = yOf(b.y);
  const aLen = ax;
  const bLen = bx;
  const sq = 9;

  return (
    <svg ref={svgRef} className={styles.bench} viewBox={`0 0 ${VIEW_I.w} ${VIEW_I.h}`} role="group"
      aria-label={`平面镜成像俯视图：蜡烛 A 到玻璃板 ${fmt(a.d)} 厘米，${screenOn ? "光屏" : "蜡烛 B"} 到玻璃板 ${fmt(b.d)} 厘米，${ok ? "已和像重合" : "还没和像重合"}`}
      onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
      {/* 桌面上的白纸 */}
      <rect x="10" y="30" width={VIEW_I.w - 20} height="282" rx="6" fill="#fff" stroke={LIGHT} strokeWidth="1.6" />
      {/* 物和像的连线，垂直于玻璃板 */}
      <path d={`M${ax} ${ay}H${ix}`} stroke={LIGHT} strokeWidth="1.6" strokeDasharray="6 5" />
      <path d={`M${PLATE_X - sq} ${iy}v${-sq}h${sq}`} fill="none" stroke={LINE} strokeWidth="1.4" />
      {/* 玻璃板 */}
      <rect x={PLATE_X - 3} y="30" width="6" height="282" fill="#dceff9" stroke={BLUE} strokeWidth="1.6" />
      {/* 眼睛，在 A 这一侧 */}
      <g stroke={LINE} strokeWidth="1.8" fill="#fff">
        <path d={`M24 ${CENTER_Y}q16 -14 32 0q-16 14 -32 0z`} />
        <circle cx="40" cy={CENTER_Y} r="4" fill={INK} stroke="none" />
      </g>
      {/* A 的像（虚线圈，看得见，但摸不到） */}
      <circle cx={ix} cy={iy} r={CANDLE_R + 7} fill={YELLOW} opacity="0.18" />
      <circle cx={ix} cy={iy} r={CANDLE_R} fill="none" stroke={YELLOW} strokeWidth="2" strokeDasharray="4 3" />
      <circle cx={ix} cy={iy} r="3.2" fill={CORAL} opacity="0.6" />
      {/* 蜡烛 A */}
      <Candle x={ax} y={ay} lit fill="#fdf0c8" stroke={YELLOW} />
      {/* 蜡烛 B 或光屏 */}
      {screenOn ? (
        <rect x={bx - 4} y={by - 22} width="8" height="44" rx="2" fill="#f4f6f7" stroke={LINE} strokeWidth="1.8" />
      ) : (
        <Candle x={bx} y={by} fill="#eef2f3" stroke={LINE} />
      )}
      {/* 测量距离的线（都在纸的下面一行） */}
      <g stroke={LINE} strokeWidth="1.6" fill="none">
        <path d={`M${aLen} ${DIM_Y}H${PLATE_X}M${aLen} ${DIM_Y - 6}v12M${PLATE_X} ${DIM_Y - 6}v12`} />
        <path d={`M${PLATE_X} ${DIM_Y}H${bLen}M${bLen} ${DIM_Y - 6}v12`} />
      </g>
      <text x={PLATE_X - 8} y={DIM_Y + 22} textAnchor="end" className={styles.dimText}>蜡烛 A 到玻璃板 {fmt(a.d)} cm</text>
      <text x={PLATE_X + 8} y={DIM_Y + 22} textAnchor="start" className={styles.dimText}>{screenOn ? "光屏" : "蜡烛 B"}到玻璃板 {fmt(b.d)} cm</text>
      {/* 名字（最后画，压在上面） */}
      <g className={styles.partLabel} textAnchor="middle">
        <text x={PLATE_X} y="22">玻璃板</text>
        <text x="40" y={CENTER_Y + 30}>眼睛</text>
        <text x={ax} y={ay - CANDLE_R - 9} fill={YELLOW}>A</text>
        {ok && !screenOn ? (
          <text x={bx} y={by - CANDLE_R - 9} fill={GREEN}>B 与 A 的像重合</text>
        ) : (
          <>
            <text x={bx} y={by - CANDLE_R - (screenOn ? 15 : 9)}>{screenOn ? "光屏" : "B"}</text>
            {!near && <text x={ix} y={iy + CANDLE_R + 20} fill={YELLOW}>A 的像</text>}
          </>
        )}
      </g>
      {/* 拖动把手 */}
      <circle className={styles.handle} cx={ax} cy={ay} r="24" fill="transparent" tabIndex={0} role="slider"
        aria-label="蜡烛 A 的位置" aria-valuemin={A_D_MIN} aria-valuemax={A_D_MAX} aria-valuenow={a.d} aria-valuetext={`到玻璃板 ${fmt(a.d)} 厘米`}
        onPointerDown={start("a")} onKeyDown={keysA} />
      <circle className={styles.handle} cx={bx} cy={by} r="24" fill="transparent" tabIndex={0} role="slider"
        aria-label={screenOn ? "光屏的位置" : "蜡烛 B 的位置"} aria-valuemin={B_D_MIN} aria-valuemax={B_D_MAX} aria-valuenow={b.d} aria-valuetext={`到玻璃板 ${fmt(b.d)} 厘米`}
        onPointerDown={start("b")} onKeyDown={keysB} />
    </svg>
  );
}

// ---------- 主界面 ----------
export default function MirrorLab() {
  const [mode, setMode] = useState("a");

  // 光的反射
  const [inc, setInc] = useState(START_INC);
  const [reversed, setReversed] = useState(false);
  const [fold, setFold] = useState(0);
  const [angleRows, setAngleRows] = useState([]);
  const [foldSeen, setFoldSeen] = useState(false);
  const [reverseSeen, setReverseSeen] = useState(false);

  // 平面镜成像
  const [a, setA] = useState(START_A);
  const [b, setB] = useState(START_B);
  const [screenOn, setScreenOn] = useState(false);
  const [imageRows, setImageRows] = useState([]);
  const [screenSeen, setScreenSeen] = useState(false);

  const side = reversed ? 1 : -1;
  const st = rayState(inc, side);
  const seen = reflectedSeen(fold);

  // 角度停下来一会儿（纸板是平的），就自动记一行
  useEffect(() => {
    if (!seen) return undefined;
    const t = setTimeout(() => setAngleRows((rows) => addAngleRow(rows, reflectRow(inc, side))), 450);
    return () => clearTimeout(t);
  }, [inc, seen, side]);

  // B 和像重合了，自动记一行；光屏放在像的位置，记下“接不到”
  useEffect(() => {
    if (!overlaps(a, b)) return;
    if (screenOn) { setScreenSeen(true); return; }
    setImageRows((rows) => addImageRow(rows, imageRow(a, b)));
  }, [a, b, screenOn]);

  const aTasks = reflectTasks({ rows: angleRows, foldSeen, reverseSeen });
  const bTasks = imageTasks({ rows: imageRows, screenSeen });
  const done = { ...aTasks, ...bTasks };
  const doneCount = TASKS.filter((t) => done[t.key]).length;

  const turn = (d) => setInc((v) => clamp(v + d, INC_MIN, INC_MAX));
  const doFold = (f) => {
    setFold(f);
    if (f !== 0) { setReversed(false); setFoldSeen(true); }
  };
  const toggleReverse = () => {
    setFold(0);
    setReversed((r) => {
      if (!r) setReverseSeen(true);
      return !r;
    });
  };
  const moveA = (dd, dy) => setA((p) => ({ d: clamp(p.d + dd * A_D_STEP, A_D_MIN, A_D_MAX), y: clamp(p.y + dy * A_Y_STEP, A_Y_MIN, A_Y_MAX) }));
  const moveB = (dd, dy) => setB((p) => ({ d: clamp(tidy(p.d + dd * B_STEP), B_D_MIN, B_D_MAX), y: clamp(tidy(p.y + dy * B_STEP), B_Y_MIN, B_Y_MAX) }));

  const reset = () => {
    if (mode === "a") {
      setInc(START_INC); setReversed(false); setFold(0); setAngleRows([]); setFoldSeen(false); setReverseSeen(false);
    } else {
      setA(START_A); setB(START_B); setScreenOn(false); setImageRows([]); setScreenSeen(false);
    }
  };

  // ----- 说明 -----
  const ok = overlaps(a, b);
  const sv = screenView(a, b);
  const from = reversed ? "F" : "E";
  const to = reversed ? "E" : "F";
  let explain;
  if (mode === "a") {
    if (!seen) explain = `纸板 F 折起来了，和纸板 E 不在同一个平面内，纸板 F 上看不到反射光。反射光线、入射光线和法线在同一平面内，复原纸板再看。`;
    else if (reversed) explain = `光沿 ${from}O 射入，入射角 ${inc}°，反射光沿 O${to} 射出，反射角也是 ${st.r}°。这条光路和前面的入射、反射光路完全重合，只是方向反过来了：光路可逆。`;
    else explain = `激光沿 ${from}O 射到 O 点，入射角 ${inc}°，反射光沿 O${to} 射出，反射角 ${st.r}°，两条光线分别在法线两侧。改变入射角，看看反射角怎样跟着变。`;
  } else if (screenOn) {
    explain = ok ? "光屏放在了像的位置，可是光屏上没有蜡烛的像：虚像不是真实光线会聚成的，光屏接不到。换回蜡烛 B，从玻璃板这一侧看，像仍然在。" : "先把光屏挪到像的位置（原来蜡烛 B 和像重合的地方），再看光屏上有没有像。";
  } else if (ok) {
    explain = `蜡烛 B 和蜡烛 A 的像完全重合了，B 的位置就是像的位置：蜡烛到玻璃板 ${fmt(a.d)} cm，像到玻璃板 ${fmt(b.d)} cm。多移动几次蜡烛 A，每次都找到像的位置。`;
  } else {
    explain = "蜡烛 A 点燃了，眼睛在 A 这一侧通过玻璃板看，能看到 A 的像（虚线圈）。在玻璃板后面移动没点燃的蜡烛 B，直到它看上去和像完全重合。";
  }

  const leftGap = gap(imageOf(a), b);

  return (
    <div className={styles.lab}>
      <Card className={styles.benchCard}>
        <Tabs bare items={MODES} defaultKey="a" onChange={setMode} />
        <div className={styles.benchWrap}>
          {mode === "a" ? (
            <ReflectBench inc={inc} side={side} fold={fold} onAngle={setInc} />
          ) : (
            <ImageBench a={a} b={b} screenOn={screenOn} onA={setA} onB={setB} />
          )}
        </div>

        <div className={styles.controls}>
          {mode === "a" ? (
            <>
              <div className={styles.group} role="group" aria-label="改变入射角">
                <span className={styles.groupLabel}>入射角</span>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={inc <= INC_MIN} onClick={() => turn(-INC_STEP)}>减小 {INC_STEP}°</button>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={inc >= INC_MAX} onClick={() => turn(INC_STEP)}>增大 {INC_STEP}°</button>
              </div>
              <div className={styles.group} role="group" aria-label="折转纸板 F">
                <span className={styles.groupLabel}>纸板 F</span>
                <button type="button" aria-pressed={fold === FOLD_BACK} className={`island-btn ${fold === FOLD_BACK ? "island-btn--primary" : ""} ${styles.btn}`} onClick={() => doFold(FOLD_BACK)}>向后折</button>
                <button type="button" aria-pressed={fold === FOLD_FRONT} className={`island-btn ${fold === FOLD_FRONT ? "island-btn--primary" : ""} ${styles.btn}`} onClick={() => doFold(FOLD_FRONT)}>向前折</button>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={fold === 0} onClick={() => doFold(0)}>复原</button>
              </div>
              <button type="button" aria-pressed={reversed} className={`island-btn ${reversed ? "island-btn--primary" : ""} ${styles.btn}`} onClick={toggleReverse}>
                {reversed ? "光改回沿 EO 射入" : "让光沿 FO 射入"}
              </button>
            </>
          ) : (
            <>
              <div className={styles.group} role="group" aria-label="移动蜡烛 A">
                <span className={styles.groupLabel}>蜡烛 A</span>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={a.d <= A_D_MIN} onClick={() => moveA(-1, 0)}>靠近玻璃板</button>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={a.d >= A_D_MAX} onClick={() => moveA(1, 0)}>远离玻璃板</button>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={a.y >= A_Y_MAX} onClick={() => moveA(0, 1)}>向上</button>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={a.y <= A_Y_MIN} onClick={() => moveA(0, -1)}>向下</button>
              </div>
              <div className={styles.group} role="group" aria-label={screenOn ? "移动光屏" : "移动蜡烛 B"}>
                <span className={styles.groupLabel}>{screenOn ? "光屏" : "蜡烛 B"}</span>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={b.d <= B_D_MIN} onClick={() => moveB(-1, 0)}>靠近玻璃板</button>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={b.d >= B_D_MAX} onClick={() => moveB(1, 0)}>远离玻璃板</button>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={b.y >= B_Y_MAX} onClick={() => moveB(0, 1)}>向上</button>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={b.y <= B_Y_MIN} onClick={() => moveB(0, -1)}>向下</button>
              </div>
              <button type="button" aria-pressed={screenOn} className={`island-btn ${screenOn ? "island-btn--primary" : ""} ${styles.btn}`} onClick={() => setScreenOn((v) => !v)}>
                {screenOn ? "换回蜡烛 B" : "把蜡烛 B 换成光屏"}
              </button>
            </>
          )}
          <div className={styles.sideControls}>
            <button type="button" className={`island-btn ${styles.btn}`} onClick={reset}>重来</button>
          </div>
        </div>
        <p className={styles.dragHint}>
          {mode === "a"
            ? `直接拖动激光笔，或用按钮一点一点调（每次 ${INC_STEP}°，范围 ${INC_MIN}°～${INC_MAX}°）。角度停下来，就自动记一行。`
            : "直接拖动蜡烛，或用按钮一点一点挪（A 每次 1 cm，B 每次 0.5 cm）。B 和像重合了，就自动记一行。"}
        </p>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.status}>
          <Title as="h2" variant="tab" tone="teal">现在的情况</Title>
          {mode === "a" ? (
            <>
              <div className={styles.readRow}>
                <div className={styles.reading}>
                  <span className={styles.readLabel}>入射角 ∠i</span>
                  <strong className={styles.readValue}>{inc}<small>°</small></strong>
                </div>
                <div className={`${styles.reading} ${styles.readingV}`}>
                  <span className={styles.readLabel}>反射角 ∠r</span>
                  <strong className={`${styles.readValue} ${seen ? "" : styles.readWord}`}>{seen ? <>{st.r}<small>°</small></> : "看不到"}</strong>
                </div>
              </div>
              <dl className={styles.facts}>
                <div><dt>入射光</dt><dd>沿 {from}O 射到 O 点（纸板 {from} 上）</dd></div>
                <div><dt>反射光</dt><dd>{seen ? `沿 O${to} 射出（纸板 ${to} 上）` : "纸板上看不到"}</dd></div>
                <div><dt>纸板 F</dt><dd>{fold === 0 ? "和纸板 E 在同一平面" : fold > 0 ? `向后折了 ${fold}°` : `向前折了 ${-fold}°`}</dd></div>
              </dl>
            </>
          ) : (
            <>
              <div className={styles.readRow}>
                <div className={styles.reading}>
                  <span className={styles.readLabel}>蜡烛 A 到玻璃板</span>
                  <strong className={styles.readValue}>{fmt(a.d)}<small> cm</small></strong>
                </div>
                <div className={`${styles.reading} ${styles.readingV}`}>
                  <span className={styles.readLabel}>{screenOn ? "光屏" : "蜡烛 B"}到玻璃板</span>
                  <strong className={styles.readValue}>{fmt(b.d)}<small> cm</small></strong>
                </div>
              </div>
              <dl className={styles.facts}>
                <div><dt>{screenOn ? "光屏" : "蜡烛 B"}</dt><dd>{ok ? "在像的位置" : `离像还差 ${fmt(leftGap)} cm`}</dd></div>
                <div><dt>{screenOn ? "光屏上" : "看上去"}</dt><dd>{screenOn ? (sv.atImage ? "没有蜡烛的像" : "什么也没有") : ok ? "B 和 A 的像完全重合" : "B 和 A 的像没有重合"}</dd></div>
              </dl>
            </>
          )}
          <p className={styles.explain}>{explain}</p>
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
            <Notice type="success" title="实验全部完成！">反射角等于入射角，反射光和入射光分居法线两侧，光路可逆；平面镜成的像是虚像，大小与物体相等，像和物体到镜面的距离相等。</Notice>
          )}
        </Card>
      </div>

      <div className={styles.panels}>
        <Card className={styles.records}>
          <Title as="h2" variant="tab" tone="blue">实验记录</Title>
          {mode === "a" ? (
            <>
              <p className={styles.note}>用量角器量 ON 两侧的 ∠i 和 ∠r。每改变一次入射角，自动记一行。</p>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>序号</th><th>∠i</th><th>∠r</th></tr></thead>
                  <tbody>
                    {angleRows.length === 0 ? (
                      <tr><td colSpan={3} className={styles.empty}>还没有记录。改变入射角，等一下就会记上。</td></tr>
                    ) : angleRows.map((r, i) => (
                      <tr key={r.i} className={r.i === inc ? styles.currentRow : undefined}><td>{i + 1}</td><td>{r.i}°</td><td>{r.r}°</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <p className={styles.note}>蜡烛 B 和像重合时，B 的位置就是像的位置。每找到一个，自动记一行。</p>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>序号</th><th>蜡烛到平面镜的距离/cm</th><th>蜡烛的像到平面镜的距离/cm</th></tr></thead>
                  <tbody>
                    {imageRows.length === 0 ? (
                      <tr><td colSpan={3} className={styles.empty}>还没有记录。移动蜡烛 B，让它和像重合。</td></tr>
                    ) : imageRows.map((r, i) => (
                      <tr key={r.u} className={r.u === a.d && ok ? styles.currentRow : undefined}><td>{i + 1}</td><td>{fmt(r.u)}</td><td>{fmt(r.v)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        <Card className={styles.rules}>
          <Title as="h2" variant="tab" tone="yellow">实验结论</Title>
          <p className={styles.note}>做出来的才填上。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>实验</th><th>结论</th></tr></thead>
              <tbody>
                <tr className={mode === "a" ? styles.currentRow : undefined}>
                  <td className={styles.range}>光的反射定律</td>
                  <td className={styles.left}>
                    {aTasks.angles || aTasks.fold ? (
                      <ul className={styles.signList}>
                        {aTasks.fold && <li>反射光线、入射光线和法线在同一平面内。</li>}
                        {aTasks.angles && <li>反射光线和入射光线分别位于法线两侧。</li>}
                        {aTasks.angles && <li>反射角等于入射角。</li>}
                      </ul>
                    ) : <span className={styles.empty}>还没做出来</span>}
                  </td>
                </tr>
                <tr className={mode === "a" ? styles.currentRow : undefined}>
                  <td className={styles.range}>光路的可逆性</td>
                  {aTasks.reverse ? <td className={styles.left}>在反射现象中，光路可逆。</td> : <td className={styles.empty}>还没做出来</td>}
                </tr>
                <tr className={mode === "b" ? styles.currentRow : undefined}>
                  <td className={styles.range}>平面镜成像的特点</td>
                  <td className={styles.left}>
                    {bTasks.pos || bTasks.screen ? (
                      <ul className={styles.signList}>
                        {bTasks.screen && <li>平面镜所成的像为虚像。</li>}
                        {bTasks.pos && <li>像的大小与物体的大小相等。</li>}
                        {bTasks.pos && <li>像和物体到平面镜的距离相等。</li>}
                        {bTasks.pos && <li>像和物体的连线与镜面垂直。</li>}
                      </ul>
                    ) : <span className={styles.empty}>还没做出来</span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
