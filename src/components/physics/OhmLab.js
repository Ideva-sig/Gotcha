"use client";

// 欧姆定律实验室：电路图 + 电流表、电压表的表盘。四个模式：电流与电压、电流与电阻、伏安法测电阻、电路故障。
// 物理模型在 src/lib/ohmLab.js。画面不做自动动画，服务器渲染出来的初始画面就是完整的静态图。
import { useRef, useState } from "react";
import { Card, Check, Notice, Progress, Tabs, Title } from "@/components/island/Island";
import {
  AMMETER, FAULTS, LAMP_U, R_FAULT, RA_OPTIONS, RB_OPTIONS, RHEO_MAX, RHEO_STEP, RX_HIDDEN, SOURCE_FIXED,
  SOURCE_MAX, SOURCE_STEP, STEADY_U, VOLTMETER,
  addRow, averageR, clamp, doneA, doneB, doneLamp, doneRx, meterRead, nextFault, resistanceOf, rheoAtMax,
  rheostatEnough, round1, snap, solveCircuit, steadyHint, suggestSmaller,
} from "@/lib/ohmLab";
import styles from "./OhmLab.module.css";

const BLUE = "#287fc4";
const CORAL = "#c9554d";
const YELLOW = "#bf8d08";
const LINE = "#52626a";

const MODES = [
  { key: "a", label: "电流与电压" },
  { key: "b", label: "电流与电阻" },
  { key: "c", label: "伏安法测电阻" },
  { key: "d", label: "电路故障" },
];

// 每种故障对应的“两表示数”现象，做出来之后写进总结
const SIGNS = {
  loadOpen: "电流表几乎没有示数，电压表示数接近电源电压",
  loadShort: "电压表没有示数，电流表示数比正常时大",
  restOpen: "电流表、电压表都没有示数",
  voltOpen: "电流表有正常的示数，电压表没有示数",
  rheoTop: "两表示数都偏大，移动滑片示数不变",
  rheoBottom: "两表示数都偏小，移动滑片示数不变",
};

const fmt = (x, d = 1) => x.toFixed(d);
const tidy = (x) => Number(x.toFixed(1));

// ---------- 表盘 ----------
const CX = 120;
const CY = 126;
const RA = 92;
const SPAN = 55; // 指针从 −55° 摆到 +55°

function Dial({ spec, frac, over, unit, needleColor, name }) {
  const ang = (f) => -SPAN + 2 * SPAN * f;
  const pt = (f, r) => {
    const a = (ang(f) * Math.PI) / 180;
    return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
  };
  const n = Math.round(spec.max / spec.res);
  const isMul = (v, step) => Math.abs(v / step - Math.round(v / step)) < 1e-6;
  const ticks = [];
  for (let i = 0; i <= n; i++) {
    const v = i * spec.res;
    const major = isMul(v, spec.major);
    const mid = !major && isMul(v, spec.major / 2);
    const [x1, y1] = pt(i / n, RA);
    const [x2, y2] = pt(i / n, RA - (major ? 14 : mid ? 10 : 6));
    ticks.push(<path key={i} d={`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`} stroke={LINE} strokeWidth={major ? 2 : 1.2} />);
    if (major) {
      const [tx, ty] = pt(i / n, RA + 15);
      ticks.push(<text key={`t${i}`} x={tx.toFixed(1)} y={ty.toFixed(1)} textAnchor="middle" dominantBaseline="central" className={styles.dialNum}>{Number(v.toFixed(2))}</text>);
    }
  }
  const [ax0, ay0] = pt(0, RA);
  const [ax1, ay1] = pt(1, RA);
  return (
    <svg className={styles.dial} viewBox="0 0 240 150" role="img" aria-label={`${name}表盘，量程 ${spec.label}`}>
      <rect x="2" y="2" width="236" height="146" rx="12" fill={over ? "#fdf0ee" : "#fbfcfc"} stroke={LINE} strokeWidth="2" />
      <path d={`M${ax0.toFixed(1)} ${ay0.toFixed(1)}A${RA} ${RA} 0 0 1 ${ax1.toFixed(1)} ${ay1.toFixed(1)}`} fill="none" stroke={LINE} strokeWidth="1.6" />
      {ticks}
      <text x="22" y="136" className={styles.dialUnit}>{unit}</text>
      <g className={styles.needle} style={{ transform: `rotate(${ang(frac).toFixed(2)}deg)`, transformOrigin: `${CX}px ${CY}px` }}>
        <path d={`M${CX} ${CY + 12}V${CY - 88}`} stroke={needleColor} strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx={CX} cy={CY} r="8" fill={LINE} />
      <circle cx={CX} cy={CY} r="3" fill="#fff" />
    </svg>
  );
}

function MeterBlock({ name, unit, specs, idx, setIdx, value, color, amp }) {
  const spec = specs[idx];
  const r = meterRead(spec, value);
  const small = suggestSmaller(specs, idx, value);
  return (
    <div className={styles.meter}>
      <Dial spec={spec} frac={r.frac} over={r.over} unit={unit} needleColor={color} name={name} />
      <div className={styles.meterRead}>
        <span className={styles.meterName}>{name}</span>
        <strong className={`${styles.meterValue} ${r.over ? styles.meterOver : ""}`}>
          {r.text}
          {!r.over && <small> {amp ? "A" : "V"}</small>}
        </strong>
      </div>
      <div className={styles.rangeRow} role="group" aria-label={`${name}量程`}>
        {specs.map((s, i) => (
          <button key={s.label} type="button" aria-pressed={i === idx} className={`island-btn ${i === idx ? "island-btn--primary" : ""} ${styles.rangeBtn}`} onClick={() => setIdx(i)}>
            {s.label}
          </button>
        ))}
      </div>
      <p className={styles.meterNote}>
        {r.over ? "指针超出量程，打到头了" : small ? "指针偏得太少，换小量程读得更准" : `最小分度 ${spec.res} ${unit}`}
      </p>
    </div>
  );
}

// ---------- 电路图 ----------
const TOP = 100;
const BOT = 260;
const LEFT = 130;
const RIGHT = 780;
const RH0 = 430; // 滑动变阻器电阻丝左端
const RH1 = 610;
const xOf = (Rp) => RH0 + (Rp / RHEO_MAX) * (RH1 - RH0);

function Cross({ x, y }) {
  return <path d={`M${x - 11} ${y - 11}L${x + 11} ${y + 11}M${x + 11} ${y - 11}L${x - 11} ${y + 11}`} stroke={CORAL} strokeWidth="4.5" strokeLinecap="round" />;
}

function Circuit({ mode, closed, Us, Rp, load, brightness, markFault, onToggle, onRheo }) {
  const svgRef = useRef(null);
  const drag = useRef(false);
  const hasRheo = mode !== "a";
  const sx = xOf(Rp);
  const lamp = load.type === "lamp";
  const glow = Math.min(brightness, 1.4);

  const toRp = (e) => {
    const m = svgRef.current.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return clamp(tidy(snap(((p.x - RH0) / (RH1 - RH0)) * RHEO_MAX, RHEO_STEP)), 0, RHEO_MAX);
  };
  const start = (e) => {
    e.preventDefault();
    drag.current = true;
    svgRef.current.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!drag.current) return;
    const v = toRp(e);
    if (v != null) onRheo(v);
  };
  const stop = () => { drag.current = false; };
  const keys = (e) => {
    const d = { ArrowLeft: -RHEO_STEP, ArrowDown: -RHEO_STEP, ArrowRight: RHEO_STEP, ArrowUp: RHEO_STEP, PageDown: -1, PageUp: 1 }[e.key];
    if (!d) return;
    e.preventDefault();
    onRheo(clamp(tidy(Rp + d), 0, RHEO_MAX));
  };
  const toggleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  const rLabel = mode === "a" || mode === "b" ? `R = ${load.R} Ω` : mode === "d" ? `R = ${R_FAULT} Ω` : lamp ? `小灯泡 ${LAMP_U} V` : "Rx = ？";

  return (
    <svg ref={svgRef} className={styles.circuit} viewBox="0 0 860 420" role="group"
      aria-label={`电路图：${mode === "a" ? "实验电源" : "电源"}、开关${closed ? "已闭合" : "断开"}${hasRheo ? "、滑动变阻器" : ""}、${lamp ? "小灯泡" : "电阻"}、电流表串联，电压表并联在${lamp ? "小灯泡" : "电阻"}两端`}
      onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
      {/* 导线 */}
      <g fill="none" stroke={LINE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${LEFT} ${TOP}H210`} />
        <path d={`M290 ${TOP}H${hasRheo ? RH0 : RIGHT}`} />
        {hasRheo && <path d={`M${sx} 56H700V${TOP}H${RIGHT}`} />}
        <path d={`M${RIGHT} ${TOP}V${BOT}`} />
        <path d={`M${RIGHT} ${BOT}H640H${lamp ? 578 : 620}`} />
        <path d={`M480 ${BOT}H${lamp ? 542 : 500}`} />
        <path d={`M322 ${BOT}H480`} />
        <path d={`M${LEFT} ${BOT}H278`} />
        <path d={`M${LEFT} ${TOP}V${mode === "a" ? 126 : 134}M${LEFT} ${mode === "a" ? 214 : 204}V${BOT}`} />
        {/* 电压表支路 */}
        <path d={`M480 ${BOT}V340H538M582 340H640V${BOT}`} />
      </g>
      <circle cx="480" cy={BOT} r="4.5" fill={LINE} />
      <circle cx="640" cy={BOT} r="4.5" fill={LINE} />

      {/* 电源 */}
      {mode === "a" ? (
        <g>
          <rect x="104" y="126" width="52" height="88" rx="8" fill="#fff" stroke={LINE} strokeWidth="2.4" />
          <text x={LEFT} y="160" textAnchor="middle" className={styles.sym}>+</text>
          <text x={LEFT} y="196" textAnchor="middle" className={styles.sym}>−</text>
        </g>
      ) : (
        <g stroke={LINE} strokeLinecap="round">
          {[134, 162, 190].map((y) => (
            <g key={y}>
              <path d={`M${LEFT - 18} ${y}H${LEFT + 18}`} strokeWidth="2.4" />
              <path d={`M${LEFT - 10} ${y + 14}H${LEFT + 10}`} strokeWidth="6" />
            </g>
          ))}
        </g>
      )}
      <text x="94" y="165" textAnchor="end" className={styles.partLabel}>{mode === "a" ? "实验电源" : "电源"}</text>
      <text x="94" y="190" textAnchor="end" className={styles.valLabel}>{mode === "a" ? `${fmt(Us)} V` : `${SOURCE_FIXED} V`}</text>

      {/* 开关 */}
      <circle cx="210" cy={TOP} r="4.5" fill={LINE} />
      <circle cx="290" cy={TOP} r="4.5" fill={LINE} />
      <path d={closed ? `M210 ${TOP}L290 ${TOP}` : `M210 ${TOP}L280 66`} stroke={closed ? CORAL : LINE} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <text x="250" y="140" textAnchor="middle" className={styles.partLabel}>开关 S</text>

      {/* 滑动变阻器 */}
      {hasRheo && (
        <g>
          <rect x={RH0} y="86" width={RH1 - RH0} height="28" fill="#fff" stroke={LINE} strokeWidth="2.4" />
          <path d={`M${sx} 56V84`} stroke={LINE} strokeWidth="2.6" fill="none" />
          <path d={`M${sx - 7} 74L${sx} 85L${sx + 7} 74Z`} fill={LINE} />
          <circle cx={sx} cy="56" r="7.5" fill={BLUE} stroke="#fff" strokeWidth="2" />
          <text x={RH0} y="136" textAnchor="start" className={styles.valLabel}>阻值小</text>
          <text x={RH1} y="136" textAnchor="end" className={styles.valLabel}>阻值大</text>
          <text x={(RH0 + RH1) / 2} y="164" textAnchor="middle" className={styles.partLabel}>滑动变阻器 0～{RHEO_MAX} Ω</text>
          <rect className={styles.handle} x={sx - 28} y="30" width="56" height="88" fill="transparent"
            tabIndex={0} role="slider" aria-label="滑动变阻器的滑片" aria-valuemin={0} aria-valuemax={RHEO_MAX} aria-valuenow={Rp}
            aria-valuetext={`接入电阻 ${fmt(Rp)} 欧`}
            onPointerDown={start} onKeyDown={keys} />
        </g>
      )}
      <rect className={styles.hit} x="196" y="50" width="108" height="76" fill="transparent" role="switch" aria-checked={closed} aria-label="开关"
        tabIndex={0} onClick={onToggle} onKeyDown={toggleKey} />

      {/* 电流表 */}
      <circle cx="300" cy={BOT} r="22" fill="#fff" stroke={LINE} strokeWidth="2.4" />
      <text x="300" y={BOT + 1} textAnchor="middle" dominantBaseline="central" className={styles.sym} fill={CORAL}>A</text>
      <text x="300" y="308" textAnchor="middle" className={styles.partLabel}>电流表</text>

      {/* 被测电阻或小灯泡 */}
      <text x="560" y="196" textAnchor="middle" className={styles.partLabel}>{rLabel}</text>
      {lamp ? (
        <g>
          {glow > 0.02 && <circle cx="560" cy={BOT} r={18 + glow * 14} fill={YELLOW} opacity={0.12 + glow * 0.4} />}
          <circle cx="560" cy={BOT} r="18" fill="#fff" fillOpacity="0.75" stroke={LINE} strokeWidth="2.4" />
          <path d={`M547 ${BOT - 13}L573 ${BOT + 13}M573 ${BOT - 13}L547 ${BOT + 13}`} stroke={LINE} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ) : (
        <rect x="500" y={BOT - 16} width="120" height="32" fill="#fff" stroke={LINE} strokeWidth="2.4" />
      )}

      {/* 电压表 */}
      <circle cx="560" cy="340" r="22" fill="#fff" stroke={LINE} strokeWidth="2.4" />
      <text x="560" y="341" textAnchor="middle" dominantBaseline="central" className={styles.sym} fill={BLUE}>V</text>
      <text x="560" y="392" textAnchor="middle" className={styles.partLabel}>电压表</text>

      {/* 揭晓故障时，把出故障的地方标出来 */}
      {markFault === "loadOpen" && <Cross x={560} y={BOT} />}
      {markFault === "loadShort" && <path d={`M480 ${BOT}V228H640V${BOT}`} stroke={CORAL} strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {markFault === "restOpen" && <Cross x={400} y={BOT} />}
      {markFault === "voltOpen" && <Cross x={480} y={300} />}
      {(markFault === "rheoTop" || markFault === "rheoBottom") && (
        <rect x="412" y="40" width="216" height="84" rx="12" fill="none" stroke={CORAL} strokeWidth="3.4" strokeDasharray="9 6" />
      )}
    </svg>
  );
}

// ---------- 图像（模式 a） ----------
function IUGraph({ rows, R }) {
  const G = { x0: 58, x1: 352, y0: 32, y1: 246 };
  const yMax = SOURCE_MAX / R;
  const gx = (U) => G.x0 + (U / SOURCE_MAX) * (G.x1 - G.x0);
  const gy = (I) => G.y1 - (I / yMax) * (G.y1 - G.y0);
  const ticksY = [0, 1, 2, 3, 4].map((k) => (yMax * k) / 4);
  const path = rows.length >= 2 ? rows.map((r, i) => `${i ? "L" : "M"}${gx(r.U).toFixed(1)} ${gy(r.I).toFixed(1)}`).join("") : null;
  return (
    <svg className={styles.graph} viewBox="0 0 380 290" role="img" aria-label="电流随电压变化的图像">
      {ticksY.map((v) => <path key={v} d={`M${G.x0} ${gy(v)}H${G.x1}`} stroke="#e6ebed" strokeWidth="1" />)}
      {ticksY.map((v) => <text key={v} x={G.x0 - 8} y={gy(v) + 4} textAnchor="end" className={styles.tick}>{Number(v.toFixed(2))}</text>)}
      {[0, 1, 2, 3, 4, 5, 6].map((U) => (
        <g key={U}>
          <path d={`M${gx(U)} ${G.y1}v5`} stroke={LINE} strokeWidth="1.2" />
          <text x={gx(U)} y={G.y1 + 20} textAnchor="middle" className={styles.tick}>{U}</text>
        </g>
      ))}
      <path d={`M${G.x0} ${G.y0 - 14}V${G.y1}H${G.x1 + 8}`} fill="none" stroke={LINE} strokeWidth="1.5" />
      <text x="8" y="12" className={styles.note2}>I/A</text>
      <text x={G.x1 + 8} y={G.y1 + 42} textAnchor="end" className={styles.note2}>U/V</text>
      {path && <path d={path} fill="none" stroke={BLUE} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />}
      {rows.map((r) => <circle key={r.U} cx={gx(r.U)} cy={gy(r.I)} r="5.5" fill={CORAL} stroke="#fff" strokeWidth="2" />)}
    </svg>
  );
}

// ---------- 文字 ----------
function brightWord(b) {
  if (b < 0.03) return "不亮";
  if (b < 0.5) return "很暗";
  if (b < 0.9) return "较暗";
  if (b <= 1.15) return "正常发光";
  return "比正常发光亮得多";
}

const TASKS = [
  { key: "a", text: "电流与电压：电阻不变，改变电压，记录 5 组数据（电压至少跨 2 V）" },
  { key: "b", text: "电流与电阻：换 4 个不同的电阻，每次都把电压表调到 2.5 V 再记录" },
  { key: "rx", text: "伏安法：测待测电阻 Rx 三次（每次电压不同），求平均值" },
  { key: "lamp", text: "伏安法：换成小灯泡，测 4 组以上（电压至少跨 1 V），比较电阻" },
  { key: "fault", text: "电路故障：判断对 3 个不同的故障" },
];

export default function OhmLab() {
  const [mode, setMode] = useState("a");
  const [closed, setClosed] = useState(false);
  const [Us, setUs] = useState(0);
  const [Ra, setRa] = useState(10);
  const [Rb, setRb] = useState(5);
  const [kind, setKind] = useState("rx");
  const [Rp, setRp] = useState(RHEO_MAX);
  const [aIdx, setAIdx] = useState(0);
  const [vIdx, setVIdx] = useState(0);
  const [rowsA, setRowsA] = useState([]);
  const [rowsB, setRowsB] = useState([]);
  const [rowsRx, setRowsRx] = useState([]);
  const [rowsLamp, setRowsLamp] = useState([]);
  const [done, setDone] = useState({});
  const [note, setNote] = useState(null);
  const [faultId, setFaultId] = useState("loadOpen");
  const [observed, setObserved] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [solved, setSolved] = useState([]);

  const lamp = mode === "c" && kind === "lamp";
  const load = mode === "a" ? { type: "R", R: Ra } : mode === "b" ? { type: "R", R: Rb } : mode === "d" ? { type: "R", R: R_FAULT } : lamp ? { type: "lamp" } : { type: "R", R: RX_HIDDEN };
  const Usrc = mode === "a" ? Us : SOURCE_FIXED;
  const fault = mode === "d" ? faultId : null;
  // 模式 a 的电路里没有滑动变阻器（课本用实验电源改变电压）
  const sol = solveCircuit({ Us: Usrc, Rp: mode === "a" ? 0 : Rp, load, closed, fault });
  const aSpec = AMMETER[aIdx];
  const vSpec = VOLTMETER[vIdx];
  const aRead = meterRead(aSpec, sol.I);
  const vRead = meterRead(vSpec, sol.Uv);
  const answered = answer !== null;

  const mark = (key) => setDone((d) => (d[key] ? d : { ...d, [key]: true }));

  const changeMode = (key) => {
    setMode(key);
    setClosed(false);
    setRp(RHEO_MAX);
    setAIdx(0);
    setVIdx(0);
    setNote(null);
  };

  const toggle = () => {
    setNote(null);
    if (!closed) {
      if (mode !== "a" && !rheoAtMax(Rp)) {
        setNote({ type: "warning", title: "闭合开关前，滑片应该放在阻值最大的一端", text: "这样电路里的电流最小，不容易损坏器材。这次先闭合了，下次记得先把滑片调到最右边。" });
      }
      if (mode === "d") setObserved(true);
    }
    setClosed(!closed);
  };

  const moveRp = (v) => { setRp(v); setNote(null); };

  // ----- 记录 -----
  const canRecord = () => {
    if (!closed) {
      setNote({ type: "info", title: "先闭合开关", text: "开关断开时电路中没有电流，电表没有示数。" });
      return false;
    }
    if (aRead.over || vRead.over) {
      setNote({ type: "warning", title: "有电表超量程了", text: "指针打到头，读数不可信。先换大量程，或者把电流、电压调小，再记录。" });
      return false;
    }
    if (aRead.reading <= 0 || vRead.reading <= 0) {
      setNote({ type: "info", title: "电表几乎没有示数", text: "示数是 0 的数据没有用处。把电压调大一点，或者换小量程再读。" });
      return false;
    }
    return true;
  };

  const record = () => {
    setNote(null);
    if (!canRecord()) return;
    const U = vRead.reading;
    const I = aRead.reading;
    if (mode === "a") {
      const rows = addRow(rowsA, { U, I }, "U");
      setRowsA(rows);
      if (doneA(rows)) mark("a");
    } else if (mode === "b") {
      if (steadyHint(U) !== "ok" || Math.abs(sol.Uv - STEADY_U) > 0.05) {
        setNote({ type: "warning", title: "电压表示数还不是 2.5 V", text: "这一组不记。先调节滑片，让电压表示数稳稳停在 2.5 V（用 0～3 V 量程读得更准），再记录。" });
        return;
      }
      const rows = addRow(rowsB, { R: Rb, I }, "R");
      setRowsB(rows);
      if (doneB(rows)) mark("b");
    } else if (mode === "c") {
      const row = { U, I, R: resistanceOf(U, I) };
      if (kind === "rx") {
        const rows = addRow(rowsRx, row, "U", 6);
        setRowsRx(rows);
        if (doneRx(rows)) mark("rx");
      } else {
        const rows = addRow(rowsLamp, row, "U", 8);
        setRowsLamp(rows);
        if (doneLamp(rows)) mark("lamp");
      }
    }
  };

  const reset = () => {
    setClosed(false);
    setRp(RHEO_MAX);
    setAIdx(0);
    setVIdx(0);
    setNote(null);
    if (mode === "a") { setRowsA([]); setUs(0); setDone((d) => ({ ...d, a: false })); }
    if (mode === "b") { setRowsB([]); setDone((d) => ({ ...d, b: false })); }
    if (mode === "c") { setRowsRx([]); setRowsLamp([]); setKind("rx"); setDone((d) => ({ ...d, rx: false, lamp: false })); }
    if (mode === "d") { setAnswer(null); setObserved(false); setSolved([]); setFaultId("loadOpen"); setDone((d) => ({ ...d, fault: false })); }
  };

  const pickAnswer = (id) => {
    if (answered || !observed) return;
    setAnswer(id);
    if (id === faultId) {
      const next = solved.includes(id) ? solved : [...solved, id];
      setSolved(next);
      if (next.length >= 3) mark("fault");
    }
  };

  const newFault = () => {
    const f = nextFault(faultId, solved, Math.random());
    setFaultId(f.id);
    setAnswer(null);
    setObserved(false);
    setClosed(false);
    setRp(RHEO_MAX);
    setAIdx(0);
    setVIdx(0);
    setNote(null);
  };

  // ----- 说明与提醒 -----
  const alerts = [];
  if (note) alerts.push(note);
  if (closed && aRead.over) {
    alerts.push({ type: "warning", title: "电流表超量程了", text: aIdx < AMMETER.length - 1 ? "指针打到头，读不出数。真做实验要马上断开开关，换大量程再试。" : "已经是最大量程了，把电流调小一点（调大变阻器的电阻，或降低电源电压）。" });
  }
  if (closed && vRead.over) {
    alerts.push({ type: "warning", title: "电压表超量程了", text: vIdx < VOLTMETER.length - 1 ? "指针打到头，读不出数。换到 0～15 V 量程再读。" : "已经是最大量程了，把电压调低一点。" });
  }
  if (closed && lamp && sol.brightness > 1.3) {
    alerts.push({ type: "warning", title: "灯泡比正常发光亮得多，容易烧坏", text: "把滑片向阻值大的一端调（向右），让灯泡两端的电压不要超过 2.5 V 太多。" });
  }

  let explain;
  if (mode === "a") {
    if (!closed) explain = "开关断开，两个电表都没有示数。先闭合开关，再用“实验电源”改变电压。";
    else if (Us === 0) explain = "实验电源现在输出 0 V，电路里没有电流。把电压调大一点。";
    else explain = `电阻 ${Ra} Ω 不变，实验电源是 ${fmt(Us)} V：电压表 ${vRead.text} V，电流表 ${aRead.text} A。多调几个电压，看看电流跟着怎样变。`;
  } else if (mode === "b") {
    const hint = steadyHint(vRead.over ? sol.Uv : vRead.reading);
    if (!closed) explain = `先确认滑片在阻值最大处，再闭合开关。目标：用滑片把电阻两端的电压保持在 ${STEADY_U} V，再记录电流。`;
    else if (hint === "higher") explain = `电压表比 ${STEADY_U} V 大了，要把滑片向阻值大的一端调（向右）：变阻器分到更多电压，电阻两端的电压就降下来。`;
    else if (hint === "lower") explain = `电压表比 ${STEADY_U} V 小了，要把滑片向阻值小的一端调（向左）。`;
    else explain = `电压表示数是 ${STEADY_U} V，保持住了！读出电流，按“记录这一组数据”。然后换一个电阻再试：换大电阻后，电压表示数会变大，要重新调节滑片。`;
    if (!rheostatEnough(SOURCE_FIXED, Rb, STEADY_U)) explain += " 这个电阻太大，变阻器的最大阻值不够用了。";
  } else if (mode === "c") {
    if (!closed) explain = "先把滑片放在阻值最大处，闭合开关。改变滑片位置，多测几组电压和电流，再算电阻。";
    else if (lamp) explain = `小灯泡现在${brightWord(sol.brightness)}。电压表 ${vRead.text} V，电流表 ${aRead.text} A，电阻 = 电压 ÷ 电流。灯越亮，算出的电阻有什么变化？`;
    else explain = `电压表 ${vRead.text} V，电流表 ${aRead.text} A。每测一组就算一次电阻（电阻 = 电压 ÷ 电流），最后求平均值。`;
  } else if (!closed) {
    explain = `电源 ${SOURCE_FIXED} V，电阻 ${R_FAULT} Ω。先闭合开关，观察两个电表；也可以移动滑片，再看示数变不变。`;
  } else {
    explain = "观察两个电表的示数，移动滑片看看它们变不变，再选出你认为的故障。";
  }

  const doneCount = TASKS.filter((t) => done[t.key]).length;
  const rhNeed = mode !== "a";

  const rowsOfKind = kind === "rx" ? rowsRx : rowsLamp;
  const avg = averageR(rowsRx);

  return (
    <div className={styles.lab}>
      <Card className={styles.benchCard}>
        <Tabs bare items={MODES} defaultKey="a" onChange={changeMode} />
        <div className={styles.stage}>
          <div className={styles.circuitWrap}>
            <Circuit mode={mode} closed={closed} Us={Us} Rp={Rp} load={load} brightness={sol.brightness}
              markFault={mode === "d" && answered ? faultId : null} onToggle={toggle} onRheo={moveRp} />
          </div>
          <div className={styles.meters}>
            <MeterBlock name="电流表" unit="A" amp specs={AMMETER} idx={aIdx} setIdx={setAIdx} value={sol.I} color={CORAL} />
            <MeterBlock name="电压表" unit="V" specs={VOLTMETER} idx={vIdx} setIdx={setVIdx} value={sol.Uv} color={BLUE} />
          </div>
        </div>

        <div className={styles.controls}>
          <button type="button" aria-pressed={closed} className={`island-btn ${closed ? "island-btn--primary" : ""} ${styles.btn}`} onClick={toggle}>
            {closed ? "断开开关" : "闭合开关"}
          </button>

          {mode === "a" && (
            <>
              <div className={styles.group} role="group" aria-label="实验电源电压">
                <span className={styles.groupLabel}>实验电源</span>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={Us <= 0} onClick={() => setUs((v) => clamp(tidy(v - SOURCE_STEP), 0, SOURCE_MAX))}>电压调小</button>
                <button type="button" className={`island-btn ${styles.btn}`} disabled={Us >= SOURCE_MAX} onClick={() => setUs((v) => clamp(tidy(v + SOURCE_STEP), 0, SOURCE_MAX))}>电压调大</button>
              </div>
              <div className={styles.group} role="group" aria-label="换定值电阻">
                <span className={styles.groupLabel}>定值电阻</span>
                {RA_OPTIONS.map((r) => (
                  <button key={r} type="button" aria-pressed={Ra === r} className={`island-btn ${Ra === r ? "island-btn--primary" : ""} ${styles.btn}`}
                    onClick={() => { if (r !== Ra) { setRa(r); setRowsA([]); setNote({ type: "info", title: `换成 ${r} Ω 了`, text: "换了电阻，之前的记录清掉，重新测一组。" }); } }}>
                    {r} Ω
                  </button>
                ))}
              </div>
            </>
          )}

          {mode === "b" && (
            <div className={styles.group} role="group" aria-label="换定值电阻">
              <span className={styles.groupLabel}>换电阻</span>
              {RB_OPTIONS.map((r) => (
                <button key={r} type="button" aria-pressed={Rb === r} className={`island-btn ${Rb === r ? "island-btn--primary" : ""} ${styles.btn}`} onClick={() => { setRb(r); setNote(null); }}>
                  {r} Ω
                </button>
              ))}
            </div>
          )}

          {mode === "c" && (
            <div className={styles.group} role="group" aria-label="被测对象">
              <span className={styles.groupLabel}>被测对象</span>
              <button type="button" aria-pressed={kind === "rx"} className={`island-btn ${kind === "rx" ? "island-btn--primary" : ""} ${styles.btn}`} onClick={() => { setKind("rx"); setNote(null); }}>待测电阻 Rx</button>
              <button type="button" aria-pressed={kind === "lamp"} className={`island-btn ${kind === "lamp" ? "island-btn--primary" : ""} ${styles.btn}`} onClick={() => { setKind("lamp"); setNote(null); }}>小灯泡</button>
            </div>
          )}

          {rhNeed && (
            <div className={styles.group} role="group" aria-label="调节滑动变阻器">
              <span className={styles.groupLabel}>变阻器 {fmt(Rp)} Ω</span>
              <button type="button" className={`island-btn ${styles.btn}`} disabled={Rp <= 0} onClick={() => moveRp(clamp(tidy(Rp - 1), 0, RHEO_MAX))}>调小 1 Ω</button>
              <button type="button" className={`island-btn ${styles.btn}`} disabled={Rp <= 0} onClick={() => moveRp(clamp(tidy(Rp - RHEO_STEP), 0, RHEO_MAX))}>调小 0.1 Ω</button>
              <button type="button" className={`island-btn ${styles.btn}`} disabled={Rp >= RHEO_MAX} onClick={() => moveRp(clamp(tidy(Rp + RHEO_STEP), 0, RHEO_MAX))}>调大 0.1 Ω</button>
              <button type="button" className={`island-btn ${styles.btn}`} disabled={Rp >= RHEO_MAX} onClick={() => moveRp(clamp(tidy(Rp + 1), 0, RHEO_MAX))}>调大 1 Ω</button>
            </div>
          )}

          <div className={styles.sideControls}>
            {mode !== "d" && <button type="button" className={`island-btn island-btn--primary ${styles.btn}`} onClick={record}>记录这一组数据</button>}
            <button type="button" className={`island-btn ${styles.btn}`} onClick={reset}>重来</button>
          </div>
        </div>
        <p className={styles.dragHint}>
          {rhNeed ? "拖动电路图里蓝色的滑片，或用按钮一点一点调。" : "用“电压调大 / 调小”改变实验电源的输出，每次 0.5 V。"}
          点击电路图里的开关也可以闭合、断开。
        </p>
        {alerts.map((a, i) => <Notice key={`${a.title}-${i}`} type={a.type} title={a.title}>{a.text}</Notice>)}
      </Card>

      <div className={styles.panels}>
        <Card className={styles.status}>
          <Title as="h2" variant="tab" tone="teal">现在的情况</Title>
          <div className={styles.readRow}>
            <div className={styles.reading}>
              <span className={styles.readLabel}>电流表 I</span>
              <strong className={styles.readValue}>{aRead.over ? <span className={styles.over}>超量程</span> : <>{aRead.text}<small> A</small></>}</strong>
            </div>
            <div className={`${styles.reading} ${styles.readingV}`}>
              <span className={styles.readLabel}>电压表 U</span>
              <strong className={styles.readValue}>{vRead.over ? <span className={styles.over}>超量程</span> : <>{vRead.text}<small> V</small></>}</strong>
            </div>
          </div>
          <dl className={styles.facts}>
            <div><dt>电源</dt><dd>{mode === "a" ? `实验电源 ${fmt(Us)} V` : `${SOURCE_FIXED} V（三节干电池）`}</dd></div>
            <div><dt>开关</dt><dd>{closed ? "闭合" : "断开"}</dd></div>
            {rhNeed && <div><dt>变阻器</dt><dd>接入 {fmt(Rp)} Ω{mode === "d" ? "" : rheoAtMax(Rp) ? "（最大阻值处）" : ""}</dd></div>}
            <div><dt>{lamp ? "小灯泡" : "电阻"}</dt><dd>{mode === "a" ? `${Ra} Ω` : mode === "b" ? `${Rb} Ω` : mode === "d" ? `${R_FAULT} Ω` : lamp ? (closed ? brightWord(sol.brightness) : "不亮") : "未知，要测出来"}</dd></div>
          </dl>
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
            <Notice type="success" title="实验全部完成！">电阻一定，电流和电压成正比；电压一定，电流和电阻成反比。用伏安法测电阻要多测几次求平均；小灯泡的电阻会随温度升高而变大。看电表的示数，就能判断出电路里是哪里出了故障。</Notice>
          )}
        </Card>
      </div>

      <div className={styles.panels}>
        {mode === "d" ? (
          <Card className={styles.records}>
            <Title as="h2" variant="tab" tone="orange">判断电路故障</Title>
            <p className={styles.note}>电路里设了一个故障。闭合开关，看两个电表（也可以移动滑片再看），然后选出故障。已判断对 {solved.length} 个不同的故障。</p>
            <div className={styles.choices} role="group" aria-label="选择故障">
              {FAULTS.map((f) => {
                const picked = answer === f.id;
                const right = answered && f.id === faultId;
                return (
                  <button key={f.id} type="button" disabled={answered || !observed} aria-pressed={picked}
                    className={`island-btn ${picked || right ? "island-btn--primary" : ""} ${styles.choice}`} onClick={() => pickAnswer(f.id)}>
                    {f.choice}
                  </button>
                );
              })}
            </div>
            {!observed && <p className={styles.note}>先闭合开关，观察电表，再选。</p>}
            {answered && (
              <>
                <Notice type={answer === faultId ? "success" : "error"} title={answer === faultId ? "判断对了！" : `不对，这次的故障是：${FAULTS.find((f) => f.id === faultId).choice}`}>
                  {FAULTS.find((f) => f.id === faultId).why}
                </Notice>
                <button type="button" className={`island-btn island-btn--primary ${styles.btn}`} onClick={newFault}>换一个故障</button>
              </>
            )}
          </Card>
        ) : mode === "a" ? (
          <Card className={styles.records}>
            <Title as="h2" variant="tab" tone="blue">实验记录</Title>
            <p className={styles.note}>电阻 R = {Ra} Ω。每按一次“记录这一组数据”，记一行。</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>序号</th><th>电压 U/V</th><th>电流 I/A</th></tr></thead>
                <tbody>
                  {rowsA.length === 0 ? (
                    <tr><td colSpan={3} className={styles.empty}>还没有记录。闭合开关，调节电压，读出两个电表后记录。</td></tr>
                  ) : rowsA.map((r, i) => <tr key={r.U}><td>{i + 1}</td><td>{fmt(r.U)}</td><td>{fmt(r.I, 2)}</td></tr>)}
                </tbody>
              </table>
            </div>
            <IUGraph rows={rowsA} R={Ra} />
          </Card>
        ) : mode === "b" ? (
          <Card className={styles.records}>
            <Title as="h2" variant="tab" tone="blue">实验记录</Title>
            <p className={styles.note}>电阻两端的电压 U = {STEADY_U} V 保持不变。</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>序号</th><th>电阻 R/Ω</th><th>电流 I/A</th></tr></thead>
                <tbody>
                  {rowsB.length === 0 ? (
                    <tr><td colSpan={3} className={styles.empty}>还没有记录。把电压表调到 2.5 V，再记录。</td></tr>
                  ) : rowsB.map((r, i) => <tr key={r.R}><td>{i + 1}</td><td>{r.R}</td><td>{fmt(r.I, 2)}</td></tr>)}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className={styles.records}>
            <Title as="h2" variant="tab" tone="blue">实验记录</Title>
            <p className={styles.note}>{kind === "rx" ? "待测电阻 Rx：每次电压不同，各算一个电阻，最后求平均值。" : "小灯泡：每次电压不同，各算一个电阻，比较它们。"}</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>序号</th><th>电压 U/V</th><th>电流 I/A</th><th>电阻 R/Ω</th></tr></thead>
                <tbody>
                  {rowsOfKind.length === 0 ? (
                    <tr><td colSpan={4} className={styles.empty}>还没有记录。闭合开关，移动滑片，读出两个电表后记录。</td></tr>
                  ) : rowsOfKind.map((r, i) => <tr key={r.U}><td>{i + 1}</td><td>{fmt(r.U)}</td><td>{fmt(r.I, 2)}</td><td>{fmt(round1(r.R))}</td></tr>)}
                  {kind === "rx" && avg !== null && rowsRx.length >= 2 && (
                    <tr className={styles.avgRow}><td colSpan={3}>平均值</td><td>{fmt(round1(avg))}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Card className={styles.rules}>
          <Title as="h2" variant="tab" tone="yellow">实验结论</Title>
          <p className={styles.note}>做出来的才填上。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>实验</th><th>结论</th></tr></thead>
              <tbody>
                <tr className={mode === "a" ? styles.currentRow : undefined}>
                  <td className={styles.range}>电流与电压</td>
                  {done.a ? <td className={styles.left}>在电阻一定的情况下，通过导体的电流与导体两端的电压成正比。</td> : <td className={styles.empty}>还没做出来</td>}
                </tr>
                <tr className={mode === "b" ? styles.currentRow : undefined}>
                  <td className={styles.range}>电流与电阻</td>
                  {done.b ? <td className={styles.left}>导体两端的电压一定时，通过导体的电流与导体的电阻成反比。</td> : <td className={styles.empty}>还没做出来</td>}
                </tr>
                <tr className={mode === "c" && kind === "rx" ? styles.currentRow : undefined}>
                  <td className={styles.range}>伏安法测电阻</td>
                  {done.rx && avg !== null ? <td className={styles.left}>多次测量，求出电阻的平均值：Rx 约 {fmt(round1(avg))} Ω。</td> : <td className={styles.empty}>还没做出来</td>}
                </tr>
                <tr className={mode === "c" && kind === "lamp" ? styles.currentRow : undefined}>
                  <td className={styles.range}>小灯泡的电阻</td>
                  {done.lamp ? <td className={styles.left}>小灯泡的电阻不是定值：灯泡越亮，灯丝温度越高，电阻越大。</td> : <td className={styles.empty}>还没做出来</td>}
                </tr>
                <tr className={mode === "d" ? styles.currentRow : undefined}>
                  <td className={styles.range}>电路故障</td>
                  {solved.length > 0 ? (
                    <td className={styles.left}>
                      <ul className={styles.signList}>
                        {solved.map((id) => <li key={id}>{SIGNS[id]}：{FAULTS.find((f) => f.id === id).choice}</li>)}
                      </ul>
                    </td>
                  ) : <td className={styles.empty}>还没做出来</td>}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
