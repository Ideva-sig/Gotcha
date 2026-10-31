"use client";

import { useState } from "react";
import { rotationSetup, rotationAt, rotProject, rotationArc, ROT_VIEW } from "@/lib/rotationExplorer";
import styles from "./RotationExplorer.module.css";

// 题目解析后的互动图：拖动旋转角，看 △ABC 绕点 B 逆时针转到 △A′BC′；BA 始终等于 BA′，∠ABA′ 就是转了多少度。
const num = (v) => String(Math.round(v * 100) / 100);

export default function RotationExplorer({ config }) {
  const setup = rotationSetup(config);
  const [deg, setDeg] = useState(setup.start);
  const s = rotationAt(setup, deg);
  const P = { A: rotProject(s.A), B: rotProject(s.B), C: rotProject(s.C), A2: rotProject(s.A2), C2: rotProject(s.C2) };
  const tri = (a, b, c) => `M${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}Z`;
  const away = (p, q, d) => { const l = Math.hypot(p.x - q.x, p.y - q.y) || 1; return { x: p.x + (p.x - q.x) / l * d, y: p.y + (p.y - q.y) / l * d }; };
  const centroid = (a, b, c) => ({ x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 });
  const tag = (name, p, a, b, c, dx = 0) => {
    const g = centroid(a, b, c), q = away(p, g, 17);
    return <text className={styles.letter} x={q.x + dx} y={q.y + 6} textAnchor="middle">{name}</text>;
  };
  const turned = deg > 0;

  return (
    <div className={styles.widget} data-widget="rotation-explorer">
      <svg className={styles.stage} viewBox={`0 0 ${ROT_VIEW.w} ${ROT_VIEW.h}`} aria-label={`△ABC 绕点 B 逆时针旋转 ${deg}°，AA′ 约 ${num(s.AA2)}`}>
        {turned && <path d={tri(P.A2, P.B, P.C2)} className={styles.after} />}
        <path d={tri(P.A, P.B, P.C)} className={styles.before} />
        {turned && <path d={`M${P.B.x} ${P.B.y}L${P.A2.x} ${P.A2.y}`} className={styles.edgeAfter} />}
        {turned && <path d={`M${P.A.x} ${P.A.y}L${P.A2.x} ${P.A2.y}`} className={styles.chord} />}
        {turned && <path d={rotationArc(s)} className={styles.arc} />}
        {tag("A", P.A, P.A, P.B, P.C)}
        {tag("B", P.B, P.A, P.B, P.C)}
        {tag("C", P.C, P.A, P.B, P.C)}
        {turned && tag("A′", P.A2, P.A2, P.B, P.C2)}
        {turned && tag("C′", P.C2, P.A2, P.B, P.C2, -14)}
      </svg>
      <label className={styles.slider}>
        <span className={styles.sliderLabel}>拖动：绕点 B 逆时针转 <strong className={styles.keyed}>{deg}°</strong></span>
        <input type="range" min={setup.min} max={setup.max} step={setup.step} value={deg} onChange={(e) => setDeg(Number(e.target.value))} aria-valuetext={`${deg}度`} />
      </label>
      <p className={styles.readout}>
        BA = <strong className={styles.keyed}>{num(s.BA)}</strong>，BA′ = <strong className={styles.keyed}>{num(s.BA2)}</strong>（始终相等）；∠ABA′ = <strong className={styles.keyed}>{deg}°</strong><br />
        AA′ = <strong className={styles.keyed}>{num(s.AA2)}</strong>
        {deg === 90 && <>（= 5√2，就是题目要求的长度）</>}
      </p>
      <p className={styles.note}>旋转时，对应点到旋转中心的距离相等，转角就是每一对对应点与中心连线的夹角。</p>
    </div>
  );
}
