"use client";

import { useState } from "react";
import { atomIonSetup, atomIonAt, atomIonLayout, ION_VIEW } from "@/lib/atomIon";
import styles from "./AtomIon.module.css";

// 题目解析后的互动图：拖滑杆让原子失去或得到电子，看质子数不变、电子数变、粒子带电。
const BLUE = "var(--course-blue)", CORAL = "var(--course-coral)", GREEN = "var(--course-green)";

export default function AtomIon({ config }) {
  const setup = atomIonSetup(config);
  const [n, setN] = useState(0);
  const now = atomIonAt(setup, n);
  const L = atomIonLayout(setup, n);
  const lose = setup.mode === "lose";
  const sign = now.charge > 0 ? "正" : "负";
  const label = lose ? "失去" : "得到";

  return (
    <div className={styles.widget} data-widget="atom-ion">
      <svg className={styles.stage} viewBox={`0 0 ${ION_VIEW.w} ${ION_VIEW.h}`} aria-label={`${setup.symbol} 原子${label} ${n} 个电子，变成 ${now.name}`}>
        {L.radii.map((r, i) => L.ringsShown[i] && <circle key={i} cx={L.center.x} cy={L.center.y} r={r} fill="none" stroke="var(--course-light-line)" strokeWidth="1.6" />)}
        <circle cx={L.center.x} cy={L.center.y} r={L.nucleusR} fill="color-mix(in srgb, var(--course-yellow) 35%, var(--surface))" stroke="var(--course-ink)" strokeWidth="2" />
        <text className={styles.charge} x={L.center.x} y={L.center.y + 6} textAnchor="middle">+{setup.Z}</text>
        {L.dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="5" fill={d.kind === "gain" ? GREEN : BLUE} stroke="var(--surface)" strokeWidth="1.5" />)}
        {L.gone.map((d, i) => <circle key={`g${i}`} cx={d.x} cy={d.y} r="5" fill="none" stroke={CORAL} strokeWidth="1.8" strokeDasharray="3 3" />)}
        <text className={styles.big} x="520" y="62" textAnchor="middle">{now.name}</text>
        <text className={styles.zone} x="520" y="92" textAnchor="middle">各层电子 {now.shells.join("、")}</text>
        {n > 0 && <>
          <path d="M360 190H620" stroke="var(--course-light-line)" strokeWidth="1.6" strokeDasharray="5 6" />
          {L.side.map((d, i) => <circle key={i} cx={d.x + 40} cy="150" r="6" fill={lose ? CORAL : GREEN} stroke="var(--surface)" strokeWidth="1.5" />)}
          <text className={styles.zone} x="440" y="214" textAnchor="middle">{lose ? "失去的电子" : "从别的原子得到的电子"}</text>
        </>}
      </svg>

      <label className={styles.slider}>
        <span className={styles.sliderLabel}>拖动：{label} {n} 个电子</span>
        <input type="range" min="0" max={setup.max} step="1" value={n} onChange={(e) => setN(Number(e.target.value))}
          aria-valuetext={`${label} ${n} 个电子`} />
      </label>

      <p className={styles.readout}>
        质子数 <strong className={styles.keyed} style={{ "--key": "var(--course-yellow)" }}>{now.protons}</strong>，不变
        　电子数 <strong className={styles.keyed} style={{ "--key": BLUE }}>{now.electrons}</strong>
        <br />{n === 0
          ? <>质子数 = 电子数，整个原子不带电。最外层 <strong>{setup.last}</strong> 个电子{lose ? "，少于 4 个，容易失去" : "，多于 4 个，容易得到"}。</>
          : <>质子数{now.protons > now.electrons ? "大于" : "小于"}电子数，带 <strong className={styles.keyed} style={{ "--key": CORAL }}>{Math.abs(now.charge)} 个单位{sign}电荷</strong>，是{lose ? "阳离子" : "阴离子"} <strong>{now.name}</strong>。</>}
      </p>
      <p className={styles.note}>
        得失电子只发生在最外层：{lose ? "最外层电子全部失去后，这一层就没有了，里面一层变成最外层" : "最外层补满 8 个电子，形成稳定结构"}。原子核没有变化，所以是同一种元素。
      </p>
    </div>
  );
}
