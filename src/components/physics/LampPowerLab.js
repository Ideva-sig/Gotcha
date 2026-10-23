"use client";

// 测量小灯泡的电功率实验室：电路图 + 电流表、电压表的表盘。
// 物理模型在 src/lib/lampPowerLab.js（小灯泡数据来自 ohmLab.js）。画面不做自动动画，服务器渲染出来的初始画面就是完整的静态图。
import { useRef, useState } from "react";
import { Card, Check, Notice, Progress, Title } from "@/components/island/Island";
import {
  AMMETER, LAMP_U, RHEO_MAX, RHEO_STEP, SOURCE, U_HIGH_MAX, VOLTMETER,
  addRow, brightWord, clamp, closeWarning, doneCompare, doneHigh, doneLow, doneRated, makeRow, meterRead,
  ratedPower, rheoAtMax, snap, solveLampCircuit, suggestSmaller, voltageKind,
} from "@/lib/lampPowerLab";
import styles from "./LampPowerLab.module.css";

const BLUE = "#287fc4";
const CORAL = "#c9554d";
const YELLOW = "#bf8d08";
const LINE = "#52626a";

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

function Circuit({ closed, Rp, brightness, onToggle, onRheo }) {
  const svgRef = useRef(null);
  const drag = useRef(false);
  const sx = xOf(Rp);
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

  return (
    <svg ref={svgRef} className={styles.circuit} viewBox="0 0 860 420" role="group"
      aria-label={`电路图：电源、开关${closed ? "已闭合" : "断开"}、滑动变阻器、小灯泡、电流表串联，电压表并联在小灯泡两端`}
      onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
      {/* 导线 */}
      <g fill="none" stroke={LINE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${LEFT} ${TOP}H210`} />
        <path d={`M290 ${TOP}H${RH0}`} />
        <path d={`M${sx} 56H700V${TOP}H${RIGHT}`} />
        <path d={`M${RIGHT} ${TOP}V${BOT}`} />
        <path d={`M${RIGHT} ${BOT}H640H578`} />
        <path d={`M480 ${BOT}H542`} />
        <path d={`M322 ${BOT}H480`} />
        <path d={`M${LEFT} ${BOT}H278`} />
        <path d={`M${LEFT} ${TOP}V134M${LEFT} 204V${BOT}`} />
        {/* 电压表支路 */}
        <path d={`M480 ${BOT}V340H538M582 340H640V${BOT}`} />
      </g>
      <circle cx="480" cy={BOT} r="4.5" fill={LINE} />
      <circle cx="640" cy={BOT} r="4.5" fill={LINE} />

      {/* 电源（三节干电池） */}
      <g stroke={LINE} strokeLinecap="round">
        {[134, 162, 190].map((y) => (
          <g key={y}>
            <path d={`M${LEFT - 18} ${y}H${LEFT + 18}`} strokeWidth="2.4" />
            <path d={`M${LEFT - 10} ${y + 14}H${LEFT + 10}`} strokeWidth="6" />
          </g>
        ))}
      </g>
      <text x="94" y="165" textAnchor="end" className={styles.partLabel}>电源</text>
      <text x="94" y="190" textAnchor="end" className={styles.valLabel}>{SOURCE} V</text>

      {/* 开关 */}
      <circle cx="210" cy={TOP} r="4.5" fill={LINE} />
      <circle cx="290" cy={TOP} r="4.5" fill={LINE} />
      <path d={closed ? `M210 ${TOP}L290 ${TOP}` : `M210 ${TOP}L280 66`} stroke={closed ? CORAL : LINE} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <text x="250" y="140" textAnchor="middle" className={styles.partLabel}>开关 S</text>

      {/* 滑动变阻器 */}
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
      <rect className={styles.hit} x="196" y="50" width="108" height="76" fill="transparent" role="switch" aria-checked={closed} aria-label="开关"
        tabIndex={0} onClick={onToggle} onKeyDown={toggleKey} />

      {/* 电流表 */}
      <circle cx="300" cy={BOT} r="22" fill="#fff" stroke={LINE} strokeWidth="2.4" />
      <text x="300" y={BOT + 1} textAnchor="middle" dominantBaseline="central" className={styles.sym} fill={CORAL}>A</text>
      <text x="300" y="308" textAnchor="middle" className={styles.partLabel}>电流表</text>

      {/* 小灯泡：越亮，周围的光越大 */}
      <text x="560" y="196" textAnchor="middle" className={styles.partLabel}>小灯泡 {LAMP_U} V</text>
      {glow > 0.02 && <circle cx="560" cy={BOT} r={18 + glow * 14} fill={YELLOW} opacity={0.12 + glow * 0.4} />}
      <circle cx="560" cy={BOT} r="18" fill="#fff" fillOpacity="0.75" stroke={LINE} strokeWidth="2.4" />
      <path d={`M547 ${BOT - 13}L573 ${BOT + 13}M573 ${BOT - 13}L547 ${BOT + 13}`} stroke={LINE} strokeWidth="2.4" strokeLinecap="round" />

      {/* 电压表 */}
      <circle cx="560" cy="340" r="22" fill="#fff" stroke={LINE} strokeWidth="2.4" />
      <text x="560" y="341" textAnchor="middle" dominantBaseline="central" className={styles.sym} fill={BLUE}>V</text>
      <text x="560" y="392" textAnchor="middle" className={styles.partLabel}>电压表</text>
    </svg>
  );
}

const TASKS = [
  { key: "safe", text: "把滑片放在阻值最大处，再闭合开关" },
  { key: "rated", text: "调滑片，使电压表示数正好是 2.5 V，记录额定功率" },
  { key: "low", text: "使电压低于 2.5 V，记录一组，看灯的亮度" },
  { key: "high", text: "使电压略高于 2.5 V（2.7～3.0 V，不超过额定电压的 1.2 倍），记录一组" },
  { key: "compare", text: "比较三组数据：实际功率越大，灯越亮" },
];

export default function LampPowerLab() {
  const [closed, setClosed] = useState(false);
  const [Rp, setRp] = useState(RHEO_MAX);
  const [aIdx, setAIdx] = useState(0);
  const [vIdx, setVIdx] = useState(0);
  const [rows, setRows] = useState([]);
  const [safe, setSafe] = useState(false);
  const [note, setNote] = useState(null);

  const sol = solveLampCircuit({ Rp, closed });
  const aRead = meterRead(AMMETER[aIdx], sol.I);
  const vRead = meterRead(VOLTMETER[vIdx], sol.U);
  const word = closed ? brightWord(sol.brightness) : "不亮";

  const done = {
    safe,
    rated: doneRated(rows),
    low: doneLow(rows),
    high: doneHigh(rows),
    compare: doneCompare(rows),
  };

  const toggle = () => {
    setNote(null);
    if (!closed) {
      const w = closeWarning(Rp);
      if (w) setNote({ type: "warning", title: "闭合开关前，滑片应该放在阻值最大的一端", text: w });
      else setSafe(true);
    }
    setClosed(!closed);
  };

  const moveRp = (v) => { setRp(v); setNote(null); };

  const record = () => {
    setNote(null);
    if (!closed) {
      setNote({ type: "info", title: "先闭合开关", text: "开关断开时电路中没有电流，电表没有示数。" });
      return;
    }
    if (aRead.over || vRead.over) {
      setNote({ type: "warning", title: "有电表超量程了", text: "指针打到头，读数不可信。先换大量程，或者把滑片向阻值大的一端调，再记录。" });
      return;
    }
    if (vIdx !== 0 || aIdx !== 0) {
      setNote({ type: "info", title: "换用小量程再读", text: "电压不到 3 V、电流不到 0.6 A，用 0～3 V 和 0～0.6 A 两个小量程读得更准。换好再记录。" });
      return;
    }
    const kind = voltageKind(vRead.reading);
    if (kind === "none") {
      setNote({ type: "info", title: "电表几乎没有示数", text: "示数是 0 的数据没有用处。把滑片向阻值小的一端调一点。" });
      return;
    }
    if (kind === "tooHigh") {
      setNote({ type: "warning", title: "电压超过额定电压的 1.2 倍了", text: "灯泡两端的电压太高，容易烧坏灯丝，这一组不记。把滑片向阻值大的一端调（向右），使电压表示数不超过 3.0 V。" });
      return;
    }
    setRows(addRow(rows, makeRow(vRead.reading, aRead.reading, sol.brightness), "U", 8));
  };

  const reset = () => {
    setClosed(false);
    setRp(RHEO_MAX);
    setAIdx(0);
    setVIdx(0);
    setNote(null);
    setRows([]);
    setSafe(false);
  };

  const alerts = [];
  if (note) alerts.push(note);
  if (closed && aRead.over) alerts.push({ type: "warning", title: "电流表超量程了", text: aIdx < AMMETER.length - 1 ? "指针打到头，读不出数。换到 0～3 A 量程。" : "已经是最大量程了，把电流调小一点。" });
  if (closed && vRead.over) alerts.push({ type: "warning", title: "电压表超量程了", text: vIdx < VOLTMETER.length - 1 ? "灯泡两端的电压超过 3 V，指针打到头。把滑片向阻值大的一端调（向右），使电压不超过额定电压的 1.2 倍。" : "已经是最大量程了，把电压调低一点。" });
  if (closed && sol.U > U_HIGH_MAX + 1e-9) alerts.push({ type: "warning", title: "灯泡两端的电压太高，容易烧坏", text: "电压超过了额定电压的 1.2 倍。把滑片向阻值大的一端调（向右）。" });

  let explain;
  if (!closed) explain = `先确认滑片在阻值最大处，再闭合开关。小灯泡上标着“${LAMP_U} V”，用滑动变阻器控制它两端的电压：低于、等于和略高于 ${LAMP_U} V 各测一组。`;
  else if (word === "正常发光") explain = `电压表 ${vRead.text} V，电流表 ${aRead.text} A，小灯泡正常发光。记录这一组：电功率 P = UI。`;
  else if (word === "较暗") explain = `电压表 ${vRead.text} V，电流表 ${aRead.text} A，电压低于 ${LAMP_U} V，小灯泡较暗。可以记录这一组，也可以向左调滑片，让电压升到 ${LAMP_U} V。`;
  else explain = `电压表 ${vRead.text} V，电流表 ${aRead.text} A，电压高于 ${LAMP_U} V，小灯泡较亮。电压不要超过 3.0 V。`;

  const doneCount = TASKS.filter((t) => done[t.key]).length;
  const rated = ratedPower(rows);

  return (
    <div className={styles.lab}>
      <Card className={styles.benchCard}>
        <div className={styles.stage}>
          <div className={styles.circuitWrap}>
            <Circuit closed={closed} Rp={Rp} brightness={sol.brightness} onToggle={toggle} onRheo={moveRp} />
          </div>
          <div className={styles.meters}>
            <MeterBlock name="电流表" unit="A" amp specs={AMMETER} idx={aIdx} setIdx={setAIdx} value={sol.I} color={CORAL} />
            <MeterBlock name="电压表" unit="V" specs={VOLTMETER} idx={vIdx} setIdx={setVIdx} value={sol.U} color={BLUE} />
          </div>
        </div>

        <div className={styles.controls}>
          <button type="button" aria-pressed={closed} className={`island-btn ${closed ? "island-btn--primary" : ""} ${styles.btn}`} onClick={toggle}>
            {closed ? "断开开关" : "闭合开关"}
          </button>
          <div className={styles.group} role="group" aria-label="调节滑动变阻器">
            <span className={styles.groupLabel}>变阻器 {fmt(Rp)} Ω</span>
            <button type="button" className={`island-btn ${styles.btn}`} disabled={Rp <= 0} onClick={() => moveRp(clamp(tidy(Rp - 1), 0, RHEO_MAX))}>调小 1 Ω</button>
            <button type="button" className={`island-btn ${styles.btn}`} disabled={Rp <= 0} onClick={() => moveRp(clamp(tidy(Rp - RHEO_STEP), 0, RHEO_MAX))}>调小 0.1 Ω</button>
            <button type="button" className={`island-btn ${styles.btn}`} disabled={Rp >= RHEO_MAX} onClick={() => moveRp(clamp(tidy(Rp + RHEO_STEP), 0, RHEO_MAX))}>调大 0.1 Ω</button>
            <button type="button" className={`island-btn ${styles.btn}`} disabled={Rp >= RHEO_MAX} onClick={() => moveRp(clamp(tidy(Rp + 1), 0, RHEO_MAX))}>调大 1 Ω</button>
          </div>
          <div className={styles.sideControls}>
            <button type="button" className={`island-btn island-btn--primary ${styles.btn}`} onClick={record}>记录这一组数据</button>
            <button type="button" className={`island-btn ${styles.btn}`} onClick={reset}>重来</button>
          </div>
        </div>
        <p className={styles.dragHint}>拖动电路图里蓝色的滑片，或用按钮一点一点调。点击电路图里的开关也可以闭合、断开。</p>
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
            <div><dt>电源</dt><dd>{SOURCE} V（三节干电池）</dd></div>
            <div><dt>开关</dt><dd>{closed ? "闭合" : "断开"}</dd></div>
            <div><dt>变阻器</dt><dd>接入 {fmt(Rp)} Ω{rheoAtMax(Rp) ? "（最大阻值处）" : ""}</dd></div>
            <div><dt>小灯泡</dt><dd>{word}</dd></div>
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
            <Notice type="success" title="实验全部完成！">小灯泡在额定电压下工作时的电功率叫额定功率。电压不同，实际功率不同；实际功率越大，小灯泡越亮。</Notice>
          )}
        </Card>
      </div>

      <div className={styles.panels}>
        <Card className={styles.records}>
          <Title as="h2" variant="tab" tone="blue">实验记录</Title>
          <p className={styles.note}>小灯泡的额定电压是 {LAMP_U} V。每按一次“记录这一组数据”，记一行，按电压从小到大排。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>序号</th><th>电压 U/V</th><th>电流 I/A</th><th>电功率 P/W</th><th>小灯泡亮度</th></tr></thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={5} className={styles.empty}>还没有记录。闭合开关，调节滑片，读出两个电表后记录。</td></tr>
                ) : rows.map((r, i) => (
                  <tr key={r.U}><td>{i + 1}</td><td>{fmt(r.U)}</td><td>{fmt(r.I, 2)}</td><td>{fmt(r.P, 2)}</td><td>{r.word}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className={styles.rules}>
          <Title as="h2" variant="tab" tone="yellow">实验结论</Title>
          <p className={styles.note}>做出来的才填上。</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>项目</th><th>结论</th></tr></thead>
              <tbody>
                <tr>
                  <td className={styles.range}>额定功率</td>
                  {done.rated && rated !== null ? <td className={styles.left}>小灯泡的额定电压是 {LAMP_U} V，在额定电压下工作时的电功率就是额定功率，约 {fmt(rated, 2)} W。</td> : <td className={styles.empty}>还没做出来</td>}
                </tr>
                <tr>
                  <td className={styles.range}>实际功率与亮度</td>
                  {done.compare ? <td className={styles.left}>电压不同，小灯泡的电功率不同。实际功率越大，小灯泡越亮。</td> : <td className={styles.empty}>还没做出来</td>}
                </tr>
              </tbody>
            </table>
          </div>
          <p className={styles.note}>不同电压下小灯泡的电功率不同，所以几次测得的电功率不能求平均值。</p>
        </Card>
      </div>
    </div>
  );
}
