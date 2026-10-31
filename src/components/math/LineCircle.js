"use client";

import { useState } from "react";
import { lineCircleSetup, lineCircleAt, lineCircleProject, RELATION, LC_VIEW } from "@/lib/lineCircle";
import styles from "./LineCircle.module.css";

// 题目解析后的互动图：拖半径 r，看圆 C 和直线 AB 的位置：r < d 相离，r = d 相切，r > d 相交。
const num = (v) => String(Math.round(v * 100) / 100);
const HOOK = { apart: "圆在直线的一侧，和 AB 没有公共点", tangent: "圆和 AB 只有一个公共点：切点 H，CH 就是半径", cross: "圆和 AB 有两个公共点" };

export default function LineCircle({ config }) {
  const setup = lineCircleSetup(config);
  const [r, setR] = useState(setup.r);
  const s = lineCircleAt(setup, r);
  const { S, p } = lineCircleProject(setup);
  const A = p(s.A), B = p(s.B), C = p(s.C), H = p(s.H);
  const u = { x: (B.x - A.x) / Math.hypot(B.x - A.x, B.y - A.y), y: (B.y - A.y) / Math.hypot(B.x - A.x, B.y - A.y) };
  const ext = 0.7 * S;
  const sq = (o, a, b, k = 9) => `M${o.x + a.x * k} ${o.y + a.y * k}L${o.x + (a.x + b.x) * k} ${o.y + (a.y + b.y) * k}L${o.x + b.x * k} ${o.y + b.y * k}`;
  const toA = { x: 1, y: 0 }, toB = { x: 0, y: -1 };
  const toC = { x: -(C.x - H.x) / Math.hypot(C.x - H.x, C.y - H.y), y: -(C.y - H.y) / Math.hypot(C.x - H.x, C.y - H.y) };
  const along = { x: u.x, y: u.y };
  const rad = 250 * Math.PI / 180, R = r * S;
  const rEnd = { x: C.x + R * Math.cos(rad), y: C.y - R * Math.sin(rad) };

  return (
    <div className={styles.widget} data-widget="line-circle">
      <svg className={styles.stage} viewBox={`0 0 ${LC_VIEW.w} ${LC_VIEW.h}`} aria-label={`⊙C 半径 ${num(r)}，圆心到 AB 的距离 ${num(setup.d)}，${RELATION[s.rel]}`}>
        <circle cx={C.x} cy={C.y} r={R} className={`${styles.circle} ${s.rel === "tangent" ? styles.circleOn : ""}`} />
        <path d={`M${A.x - u.x * ext} ${A.y - u.y * ext}L${B.x + u.x * ext} ${B.y + u.y * ext}`} className={styles.line} />
        <path d={`M${C.x} ${C.y}L${A.x} ${A.y}M${C.x} ${C.y}L${B.x} ${B.y}`} className={styles.leg} />
        <path d={`M${C.x} ${C.y}L${H.x} ${H.y}`} className={styles.dist} />
        <path d={sq(C, toA, toB)} className={styles.mark} />
        <path d={sq(H, toC, along, 8)} className={styles.mark} />
        <path d={`M${C.x} ${C.y}L${rEnd.x} ${rEnd.y}`} className={styles.radius} />
        {s.hits.map((q, i) => { const t = p(q); return <circle key={i} cx={t.x} cy={t.y} r="5.5" className={styles.hit} />; })}
        <text className={styles.letter} x={A.x + 18} y={A.y - 8} textAnchor="middle">A</text>
        <text className={styles.letter} x={B.x + 18} y={B.y - 2} textAnchor="middle">B</text>
        <text className={styles.letter} x={C.x + 18} y={C.y + 24} textAnchor="middle">C</text>
        <text className={styles.letter} x={H.x + 16} y={H.y - 10} textAnchor="middle">H</text>
        <text className={styles.small} x={(C.x + H.x) / 2 - 20} y={(C.y + H.y) / 2 - 8} textAnchor="middle">d</text>
        <text className={styles.small} x={(C.x + rEnd.x) / 2 - 14} y={(C.y + rEnd.y) / 2 + 4} textAnchor="middle">r</text>
      </svg>
      <label className={styles.slider}>
        <span className={styles.sliderLabel}>拖动：半径 r = <strong className={styles.keyed}>{num(r)}</strong></span>
        <input type="range" min={setup.min} max={setup.max} step={setup.step} value={r} onChange={(e) => setR(Math.round(Number(e.target.value) * 100) / 100)} aria-valuetext={`半径${num(r)}`} />
      </label>
      <p className={styles.readout}>
        圆心 C 到 AB 的距离 d = CH = <strong className={styles.keyed}>{num(setup.d)}</strong>（面积法：{setup.ac}×{setup.bc}÷{num(setup.hyp)}）<br />
        r = {num(r)}，{r < setup.d ? "r < d" : s.rel === "tangent" ? "r = d" : "r > d"}：<strong className={styles.keyed} style={{ "--key": "var(--course-coral)" }}>{RELATION[s.rel]}</strong>，{s.hits.length} 个公共点
      </p>
      <p className={styles.note}>{HOOK[s.rel]}。比较圆心到直线的距离 d 和半径 r：d &gt; r 相离，d = r 相切，d &lt; r 相交。</p>
    </div>
  );
}
