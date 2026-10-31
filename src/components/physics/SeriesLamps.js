"use client";

import { useState } from "react";
import { seriesSetup, seriesAt, glow, LAMP_STATE, SERIES, SERIES_VIEW } from "@/lib/seriesLamps";
import styles from "./SeriesLamps.module.css";

// 题目解析后的互动图：拖电源电压，看串联电路里电流处处相等，两灯谁先达到额定电流、谁先正常发光。
const fmt = (v, d = 2) => Number(v.toFixed(d)).toString();
const sub = (n) => "₁₂"[n];

export default function SeriesLamps({ config }) {
  const setup = seriesSetup(config);
  const [U, setU] = useState(0);
  const now = seriesAt(setup, U);
  const { left, right, top, bottom, supplyY, lamps, lampR, ammeter, ammeterR } = SERIES;
  const loop = `M${left} ${supplyY - 10}V${top}H${right}V${bottom}H${left}V${supplyY + 4}`;
  // 小珠流速跟电流成正比，顺着电流方向流（从电源长板出来）
  const flowStyle = { animationDuration: `${(34 / (600 * Math.max(now.I, 0.001))).toFixed(2)}s` };

  return (
    <div className={styles.widget} data-widget="series-lamps">
      <svg className={styles.stage} viewBox={`0 0 ${SERIES_VIEW.w} ${SERIES_VIEW.h}`} aria-label={`两灯串联：电源 ${U} V，电流 ${fmt(now.I)} A`}>
        <path d={loop} fill="none" stroke="var(--course-blue)" strokeWidth="3" strokeLinejoin="round" />
        {now.I >= 0.005 && <>
          <path className={`${styles.flow} ${styles.ring}`} d={loop} style={flowStyle} />
          <path className={`${styles.flow} ${styles.core}`} d={loop} style={flowStyle} />
        </>}
        {/* 电源：长板是正极 */}
        <path d={`M${left - 20} ${supplyY - 10}H${left + 20}`} stroke="var(--course-ink)" strokeWidth="3" />
        <path d={`M${left - 11} ${supplyY + 4}H${left + 11}`} stroke="var(--course-ink)" strokeWidth="3" />
        <text className={styles.small} x={left + 28} y={supplyY - 4}>＋</text>
        <text className={styles.label} x={left + 30} y={supplyY + 26} textAnchor="start">{fmt(U)} V</text>
        {/* 灯泡 */}
        {lamps.map((x, i) => {
          const l = now.lamps[i], d = lampR * 0.7;
          return (
            <g key={i}>
              <circle cx={x} cy={top} r={lampR} fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2.5" />
              <circle cx={x} cy={top} r={lampR - 2} fill="var(--course-yellow)" opacity={glow(l.ratio)} />
              <path d={`M${x - d} ${top - d}L${x + d} ${top + d}M${x - d} ${top + d}L${x + d} ${top - d}`} stroke="var(--course-ink)" strokeWidth="2" />
              <text className={styles.sym} x={x} y={top - 36} textAnchor="middle">L{sub(i)}</text>
              <text className={styles.small} x={x} y={top + 52} textAnchor="middle">{l.V} V　{l.A} A</text>
              <text className={l.state === "normal" ? styles.on : styles.small} x={x} y={top + 74} textAnchor="middle">{l.state === "normal" ? "正常发光" : l.state === "over" ? "太亮" : l.state === "off" ? "不亮" : "较暗"}</text>
            </g>
          );
        })}
        {/* 电流表 */}
        <circle cx={ammeter} cy={bottom} r={ammeterR} fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2.5" />
        <text className={styles.sym} x={ammeter} y={bottom + 7} textAnchor="middle">A</text>
        <text className={styles.label} x={ammeter} y={bottom + 42} textAnchor="middle">I = {fmt(now.I)} A</text>
      </svg>

      <label className={styles.slider}>
        <span className={styles.sliderLabel}>拖动：电源电压 <strong className={styles.keyed}>{fmt(U)} V</strong></span>
        <input type="range" min="0" max={setup.max} step={setup.step} value={U} onChange={(e) => setU(Number(e.target.value))} aria-valuetext={`${U}伏`} />
      </label>
      <p className={styles.readout}>
        串联，电流处处相等：<strong className={styles.keyed} style={{ "--key": "var(--course-blue)" }}>I = {fmt(now.I)} A</strong>
        {now.lamps.map((l, i) => (
          <span key={i}><br />L{sub(i)}：通过 {fmt(l.I)} A，额定 {l.A} A → <strong>{LAMP_STATE[l.state]}</strong></span>
        ))}
      </p>
      <p className={styles.note}>电压增大，电流跟着增大；额定电流小的灯（L{sub(setup.first)}，{setup.lamps[setup.first].A} A）先到额定，先正常发光。拖到电源 {fmt(setup.Ufirst)} V 就是这一刻，此时另一盏灯还暗着。</p>
    </div>
  );
}
