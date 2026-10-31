"use client";

import { useState } from "react";
import { lensSetup, lensGeometry, LENS_VIEW, LENS_AX } from "@/lib/lensImaging";
import styles from "./LensImaging.module.css";

// 题目解析后的互动图：拖焦距（或物距），看凸透镜成的像怎么变。
const fmt = (v) => Number(v.toFixed(1)).toString();
const line = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("");
const Arrow = ({ x, y, color }) => {
  const up = y < LENS_AX.y, tip = y, base = LENS_AX.y, d = up ? 9 : -9;
  return <>
    <path d={`M${x} ${base}V${tip + d * 0.4}`} stroke={color} strokeWidth="4" strokeLinecap="round" />
    <path d={`M${x - 7} ${tip + d}L${x} ${tip}L${x + 7} ${tip + d}`} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </>;
};

export default function LensImaging({ config }) {
  const setup = lensSetup(config);
  const [value, setValue] = useState(setup[setup.vary]);
  const u = setup.vary === "u" ? value : setup.u, f = setup.vary === "f" ? value : setup.f;
  const g = lensGeometry(u, f), info = g.info;
  const { x: X, y: Y } = LENS_AX;
  const name = setup.vary === "f" ? "焦距 f" : "物距 u";
  const desc = info.kind === "none" ? "u = f：光线经透镜后平行射出，不成像"
    : `${info.rule}：${info.upright ? "正立" : "倒立"}、${info.size}的${info.real ? "实" : "虚"}像${info.use ? `（${info.use}）` : ""}`;

  return (
    <div className={styles.widget} data-widget="lens-imaging">
      <svg className={styles.stage} viewBox={`0 0 ${LENS_VIEW.w} ${LENS_VIEW.h}`} aria-label={`凸透镜成像：物距 ${fmt(u)} cm，焦距 ${fmt(f)} cm，${desc}`}>
        <path d={`M20 ${Y}H${LENS_VIEW.w - 20}`} stroke="var(--course-line)" strokeWidth="1.6" />
        {g.screenX !== null && <path d={`M${g.screenX} ${Y - 110}V${Y + 110}`} stroke="var(--course-muted)" strokeWidth="6" strokeLinecap="round" opacity="0.45" />}
        <path d={`M${X} ${Y - 78}Q${X + 20} ${Y} ${X} ${Y + 78}Q${X - 20} ${Y} ${X} ${Y - 78}Z`} fill="color-mix(in srgb, var(--course-blue) 12%, var(--surface))" stroke="var(--course-blue)" strokeWidth="2.4" />
        {g.rays.map((r, i) => <path key={`r${i}`} d={line(r.pts)} fill="none" stroke="var(--course-blue)" strokeWidth="2" strokeLinejoin="round" />)}
        {g.back.map((r, i) => <path key={`b${i}`} d={line(r.pts)} fill="none" stroke="var(--course-blue)" strokeWidth="1.8" strokeDasharray="6 5" />)}
        <Arrow x={g.T.x} y={g.T.y} color="var(--course-coral)" />
        {g.I && <Arrow x={g.I.x} y={g.I.y} color="var(--course-green)" />}
        {g.marks.map((m, i) => <g key={`m${i}`}><circle cx={m.x} cy={Y} r="4" fill="var(--course-ink)" /><text className={styles.mark} x={m.x > X && m.label === "F" ? m.x - 4 : m.x} y={m.x > X ? Y - 22 : Y + 24} textAnchor="middle">{m.label}</text></g>)}
        <text className={styles.tag} x={g.T.x} y={Y + 24} textAnchor="middle">物</text>
        {g.I && <text className={styles.tag} x={g.I.x + 14} y={g.I.y + 6}>像</text>}
        {g.screenX !== null && <text className={styles.tag} x={g.screenX} y={Y - 118} textAnchor="middle">光屏</text>}
      </svg>

      <label className={styles.slider}>
        <span className={styles.sliderLabel}>拖动{name}：{fmt(value)} cm</span>
        <input type="range" min={setup.min} max={setup.max} step={setup.step} value={value} onChange={(e) => setValue(Number(e.target.value))} aria-valuetext={`${name} ${fmt(value)} 厘米`} />
      </label>

      <p className={styles.readout}>
        物距 <strong className={styles.keyed}>u = {fmt(u)} cm</strong>，焦距 <strong className={styles.keyed}>f = {fmt(f)} cm</strong><br />
        <strong>{desc}</strong>
        {Number.isFinite(info.v) && <><br />像距 v ≈ {fmt(Math.abs(info.v))} cm，像是物的 {fmt(info.m)} 倍{g.offscreen ? "（像太远，图里画不下）" : ""}</>}
      </p>
      <p className={styles.note}>
        物体在二倍焦距以外，成倒立缩小的实像；在一到二倍焦距之间，成倒立放大的实像；在一倍焦距以内，成正立放大的虚像（虚线是光线反向延长）。
      </p>
    </div>
  );
}
