"use client";

import { useRef, useState } from "react";
import { rotaryHeaterSetup, rotaryHeaterAt, rotaryHeaterLayout, rotaryNearest, ROTARY_POSITIONS } from "@/lib/rotaryHeater";
import styles from "./RotaryHeater.module.css";

// 题目解析后的互动图：转旋转开关，看哪几段导线有电流、电阻怎么连、功率多大。
const GEAR = { ab: "断开", bc: "低温挡", cd: "中温挡", de: "高温挡" };
const HOOK = {
  ab: "开关只碰到 a、b 两个触点，a、b 都没接别的元件，电路断开。",
  bc: "开关接通 c：电流先过 R₁ 再过 R₂，两个电阻串联，总电阻最大，功率最小。",
  cd: "c、d 被开关连在一起，R₁ 两端直接用导线接通（短路），R₁ 没有电流，只剩 R₂ 工作。",
  de: "d、e 同时接通：R₂、R₃ 并联，各自都接在 220 V 上，功率相加，所以最大。",
};
const fmt = (v, d) => Number(v.toFixed(d)).toString();
// 流动的小珠：白圈蓝心，每 34 一颗，0.25 A 时每秒走 60，电流越大流得越快。
const Beads = ({ d, amp }) => {
  const style = { animationDuration: `${(34 / (240 * amp)).toFixed(2)}s` };
  return <>
    <path className={`${styles.flow} ${styles.ring}`} d={d} style={style} />
    <path className={`${styles.flow} ${styles.core}`} d={d} style={style} />
  </>;
};
const sub = (key) => <>R<tspan dy="5" fontSize="13">{key.slice(1)}</tspan></>;

export default function RotaryHeater({ config }) {
  const setup = rotaryHeaterSetup(config);
  const L = rotaryHeaterLayout();
  const [pos, setPos] = useState(ROTARY_POSITIONS.includes(config.position) ? config.position : "bc");
  const dragging = useRef(false);
  const now = rotaryHeaterAt(setup, pos);
  const all = ROTARY_POSITIONS.map((p) => rotaryHeaterAt(setup, p));
  const maxP = Math.max(...all.map((s) => s.P));
  const [p1, p2] = pos.split("").map((k) => L.contacts[k]);
  // 流动光点：导线上，加上开关刀片里从中心流到触点的那一段。
  const contactAmp = { c: now.branch.R1, d: pos.includes("d") ? now.branch.R2 : 0, e: now.branch.R3 };
  const flows = L.wires.map((w) => ({ d: w.d, amp: w.amp(now) })).filter((f) => f.amp > 0);
  const bladeFlows = Object.entries(contactAmp).filter(([, amp]) => amp > 0)
    .map(([k, amp]) => ({ d: `M${L.pivot.x} ${L.pivot.y}L${L.contacts[k].x.toFixed(1)} ${L.contacts[k].y.toFixed(1)}`, amp }));

  const angleOf = (e) => {
    const svg = e.currentTarget.ownerSVGElement;
    const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return (Math.atan2(L.pivot.y - q.y, q.x - L.pivot.x) * 180) / Math.PI;
  };
  const stop = () => { dragging.current = false; };
  const drag = {
    onPointerDown: (e) => { dragging.current = true; setPos(rotaryNearest(angleOf(e))); e.currentTarget.setPointerCapture(e.pointerId); },
    onPointerMove: (e) => { if (dragging.current) setPos(rotaryNearest(angleOf(e))); },
    onPointerUp: stop, onPointerCancel: stop, onLostPointerCapture: stop,
  };
  const step = (dir) => setPos((p) => ROTARY_POSITIONS[Math.max(0, Math.min(3, ROTARY_POSITIONS.indexOf(p) + dir))]);
  const keys = (e) => {
    if (["ArrowLeft", "ArrowDown"].includes(e.key)) { e.preventDefault(); step(-1); }
    if (["ArrowRight", "ArrowUp"].includes(e.key)) { e.preventDefault(); step(1); }
  };

  return (
    <div className={styles.widget} data-widget="rotary-heater">
      <svg className={styles.circuit} viewBox="90 16 430 296" aria-label="电热敷腰带电路：转动旋转开关，看电流经过哪些电阻">
        <path d={L.arc} stroke="var(--course-light-line)" strokeWidth="2" strokeDasharray="5 6" fill="none" />
        {L.wires.map((w, i) => (
          <path key={i} d={w.d} fill="none" strokeWidth={w.on(now) ? 3 : 2.2} strokeLinejoin="round"
            stroke={w.on(now) ? "var(--course-blue)" : "var(--course-light-line)"} />
        ))}
        {flows.map((f, i) => <Beads key={`f${i}`} {...f} />)}
        {L.resistors.map((r) => {
          const heat = now.branch[r.key] ** 2 * setup[r.key] / maxP;
          return (
            <g key={r.key}>
              <rect x={r.x - 34} y={r.y - 10} width="68" height="20" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2" />
              <rect x={r.x - 33} y={r.y - 9} width="66" height="18" fill="var(--course-coral)" opacity={Math.min(1, heat * 1.6) * 0.8} />
              <text className={styles.sym} x={r.x} y={r.y - 18} textAnchor="middle">{sub(r.key)}</text>
            </g>
          );
        })}
        {L.joints.map((j, i) => <circle key={i} cx={j.x} cy={j.y} r="4" fill="var(--course-ink)" />)}
        {L.terminals.map((t, i) => <circle key={i} cx={t.x} cy={t.y} r="5" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2" />)}
        <text className={styles.label} x="380" y="295" textAnchor="middle">220 V</text>
        <path d={`M${L.pivot.x} ${L.pivot.y}L${p1.x} ${p1.y}L${p2.x} ${p2.y}Z`} fill="var(--tint-neutral)" stroke="var(--course-ink)" strokeWidth="2" strokeLinejoin="round" />
        {bladeFlows.map((f, i) => (
          <g key={`b${i}`}>
            <path d={f.d} stroke="var(--course-blue)" strokeWidth="3" strokeLinecap="round" />
            <Beads {...f} />
          </g>
        ))}
        {Object.entries(L.contacts).map(([k, c]) => {
          const touched = pos.includes(k);
          const lp = L.labelAt(L.labelAngle[k]);
          return (
            <g key={k}>
              <circle cx={c.x} cy={c.y} r="5" fill={touched ? "var(--course-ink)" : "var(--surface)"} stroke="var(--course-ink)" strokeWidth="2" />
              <text className={styles.sym} x={lp.x} y={lp.y + 6} textAnchor="middle">{k}</text>
            </g>
          );
        })}
        <circle cx={L.pivot.x} cy={L.pivot.y} r="5" fill="var(--course-ink)" />
        <circle className={styles.handle} cx={L.pivot.x} cy={L.pivot.y} r="82" fill="transparent"
          role="slider" tabIndex={0} aria-label="旋转开关" aria-valuemin={0} aria-valuemax={3}
          aria-valuenow={ROTARY_POSITIONS.indexOf(pos)} aria-valuetext={`接 ${pos}，${GEAR[pos]}`}
          onKeyDown={keys} {...drag} />
      </svg>

      <div className={`isl-tabs isl-tabs--bare ${styles.picker}`}>
        <div className="isl-tabList" role="tablist" aria-label="开关位置">
          {ROTARY_POSITIONS.map((p) => (
            <button key={p} type="button" role="tab" className="isl-tabItem" aria-selected={p === pos} onClick={() => setPos(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.readout}>
        接 {pos}：<strong>{GEAR[pos]}</strong>
        {now.I > 0 && <>
          　总电阻 <strong className={styles.keyed}>{fmt(now.R, 0)} Ω</strong>
          　总电流 <strong className={styles.keyed} style={{ "--key": "var(--course-blue)" }}>{fmt(now.I, 2)} A</strong>
          　功率 <strong className={styles.keyed} style={{ "--key": "var(--course-coral)" }}>{fmt(now.P, 0)} W</strong>
        </>}
        {pos === "de" && <><br />其中 R₂ 支路 {fmt(now.branch.R2, 2)} A，R₃ 支路 {fmt(now.branch.R3, 2)} A</>}
      </p>

      <svg className={styles.chart} viewBox="0 0 560 150" aria-label="四个位置的功率比较">
        {all.map((s, i) => {
          const x = 70 + i * 120, h = (s.P / maxP) * 84, picked = s.position === pos;
          return (
            <g key={s.position} className={styles.bar} onClick={() => setPos(s.position)}>
              <rect x={x - 44} y="10" width="88" height="130" fill="transparent" />
              <rect x={x - 26} y={110 - h} width="52" height={Math.max(h, 2)} rx="4"
                fill={picked ? "var(--accent)" : "var(--course-light-line)"} />
              <text className={styles.value} x={x} y={104 - h} textAnchor="middle">{fmt(s.P, 0)} W</text>
              <text className={picked ? styles.axisOn : styles.axis} x={x} y="132" textAnchor="middle">{s.position} · {GEAR[s.position]}</text>
            </g>
          );
        })}
        <path d="M20 110H540" stroke="var(--course-line)" strokeWidth="1.5" />
      </svg>

      <p className={styles.hint}>{HOOK[pos]}</p>
      {setup.R3 && <p className={styles.note}>R₃ 题中没直接给，由高温挡总电流 {fmt(setup.Ihigh, 2)} A 推出：R₃ 支路电流 {fmt(setup.Ihigh - setup.U / setup.R2, 2)} A，R₃ = {fmt(setup.R3, 0)} Ω。电阻越红，发热越多；导线上的小珠顺着电流方向流，流得越快电流越大。</p>}
    </div>
  );
}
