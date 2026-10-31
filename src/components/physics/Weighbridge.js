"use client";

import { useState } from "react";
import { weighbridgeSetup, weighbridgeAt, weighbridgeLayout, wbSlideY, WB, WB_VIEW } from "@/lib/weighbridge";
import styles from "./Weighbridge.module.css";

// 题目解析后的互动图：拖滑杆当“车越来越重”，看滑片 P 下移时电流表不变、电压表变大。
const fmt = (v, d) => Number(v.toFixed(d)).toString();
// 流动的小珠，写法同旋转开关电热器：电流越大流得越快。
const Beads = ({ d, amp }) => {
  const style = { animationDuration: `${(34 / (240 * amp)).toFixed(2)}s` };
  return <>
    <path className={`${styles.flow} ${styles.ring}`} d={d} style={style} />
    <path className={`${styles.flow} ${styles.core}`} d={d} style={style} />
  </>;
};

export default function Weighbridge({ config }) {
  const setup = weighbridgeSetup(config);
  const L = weighbridgeLayout();
  const [p, setP] = useState(setup.p);
  const now = weighbridgeAt(setup, p);
  const { cx, top, bottom, halfW, rodX, V, A, R0 } = WB;
  const yP = wbSlideY(p);

  return (
    <div className={styles.widget} data-widget="weighbridge">
      <svg className={styles.circuit} viewBox={`0 0 ${WB_VIEW.w} ${WB_VIEW.h}`} aria-label="地磅电路：滑片 P 下移，电流表示数不变，电压表示数变大">
        {L.wires.map((d, i) => <path key={i} d={d} fill="none" stroke="var(--course-blue)" strokeWidth="3" strokeLinejoin="round" />)}
        <path d={`M${cx} ${V.y}H${V.x + 20}`} fill="none" stroke="var(--course-light-line)" strokeWidth="2.2" />
        <path d={`M${V.x - 20} ${V.y}H${rodX}V${yP}H${cx - halfW - 8}`} fill="none" stroke="var(--course-light-line)" strokeWidth="2.2" strokeLinejoin="round" />
        <rect x={cx - halfW} y={top} width={halfW * 2} height={bottom - top} fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2" />
        <rect x={cx - halfW + 1} y={top + 1} width={halfW * 2 - 2} height={Math.max(0, yP - top - 1)} fill="var(--course-blue)" opacity="0.25" />
        {L.wires.map((d, i) => <Beads key={`f${i}`} d={d} amp={now.I} />)}
        <Beads d={`M${cx} ${top}V${bottom}`} amp={now.I} />
        <path d={`M${cx - halfW - 18} ${yP - 7}L${cx - halfW - 4} ${yP}L${cx - halfW - 18} ${yP + 7}Z`} fill="var(--course-ink)" />
        <text className={styles.sym} x={cx + halfW + 14} y={(top + bottom) / 2 + 6}>R</text>
        <text className={styles.sym} x={cx - halfW - 22} y={yP + 28} textAnchor="end">P</text>
        <circle cx={cx} cy={V.y} r="4" fill="var(--course-ink)" />
        <rect x={R0.x - 34} y={R0.y - 10} width="68" height="20" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2" />
        <text className={styles.sym} x={R0.x} y={R0.y - 18} textAnchor="middle">R<tspan dy="5" fontSize="13">0</tspan></text>
        <path d="M268 56L308 56" stroke="var(--course-ink)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="268" cy="56" r="4" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2" />
        <circle cx="308" cy="56" r="4" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2" />
        <text className={styles.sym} x="288" y="36" textAnchor="middle">S</text>
        <circle cx={V.x} cy={V.y} r="20" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2" />
        <text className={styles.letter} x={V.x} y={V.y + 6} textAnchor="middle">V</text>
        <circle cx={A.x} cy={A.y} r="20" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2" />
        <text className={styles.letter} x={A.x} y={A.y + 6} textAnchor="middle">A</text>
        <text className={styles.value} x={V.x} y={V.y - 30} textAnchor="middle">{fmt(now.Uv, 1)} V</text>
        <text className={styles.value} x={A.x} y={A.y - 30} textAnchor="middle">{fmt(now.I, 2)} A</text>
        {L.sourceTerminals.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2" />)}
        <text className={styles.sym} x="494" y="156" textAnchor="start">U</text>
      </svg>

      <label className={styles.slider}>
        <span className={styles.sliderLabel}>拖动：车越重，滑片 P 越往下</span>
        <input type="range" min="0" max="100" step="5" value={p} onChange={(e) => setP(Number(e.target.value))}
          aria-valuetext={`滑片 P 在变阻器 ${p}% 处`} />
      </label>

      <p className={styles.readout}>
        总电阻 <strong className={styles.keyed}>{fmt(now.total, 0)} Ω</strong>，不变
        　电流表 <strong className={styles.keyed} style={{ "--key": "var(--course-blue)" }}>{fmt(now.I, 2)} A</strong>，不变
        <br />电压表测 P 以上的 {fmt(now.Rtop, 0)} Ω：<strong className={styles.keyed} style={{ "--key": "var(--course-coral)" }}>{fmt(now.Uv, 1)} V</strong>
      </p>
      <p className={styles.note}>
        R₀ 和变阻器的全部阻值串联，滑片只是改变电压表“量到哪里”，电路总电阻没变，所以电流不变；电压表并联的电阻越长，示数越大。图中 U = {fmt(setup.U, 0)} V、R₀ = {fmt(setup.R0, 0)} Ω、R = {fmt(setup.R, 0)} Ω 只是示意数值。
      </p>
    </div>
  );
}
