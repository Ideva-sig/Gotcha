"use client";

import { useState } from "react";
import { leverSetup, leverAt, leverX, LEVER, LEVER_VIEW } from "@/lib/lever";
import styles from "./Lever.module.css";

// 题目解析后的互动图：拖滑杆改变拉力的作用点（动力臂），看杠杆保持水平平衡所需的拉力怎么变。
const fmt = (v) => Number(v.toFixed(2)).toString();

export default function Lever({ config }) {
  const setup = leverSetup(config);
  const [l2, setL2] = useState(setup.l2);
  const now = leverAt(setup, l2);
  const { fx, beamY, cell, thick, arrowPerN } = LEVER;
  const hooks = Math.round(setup.f1 / setup.hook);
  const ax = leverX(setup.l1, "left"), bx = leverX(l2, "right");
  const len = Math.min(120, now.F * arrowPerN);

  return (
    <div className={styles.widget} data-widget="lever">
      <svg className={styles.stage} viewBox={`0 0 ${LEVER_VIEW.w} ${LEVER_VIEW.h}`} aria-label={`杠杆：左边 ${setup.l1} 格处挂 ${fmt(setup.f1)} N，右边 ${l2} 格处竖直向下拉 ${fmt(now.F)} N 才平衡`}>
        <rect x={fx - 4 * cell - 20} y={beamY - thick / 2} width={8 * cell + 40} height={thick} rx="3" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2" />
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${fx + (i - 4) * cell} ${beamY - thick / 2}v${thick}`} stroke="var(--course-light-line)" strokeWidth="2" />)}
        <path d={`M${fx} ${beamY + thick / 2}l-24 46h48z`} fill="var(--course-muted)" />
        {/* 左边：钩码 */}
        <path d={`M${ax} ${beamY + thick / 2}v${20}`} stroke="var(--course-ink)" strokeWidth="2" />
        {Array.from({ length: hooks }, (_, i) => <rect key={i} x={ax - 17} y={beamY + thick / 2 + 20 + i * 24} width="34" height="22" rx="4" fill="var(--course-yellow)" stroke="var(--course-ink)" strokeWidth="2" />)}
        {/* 右边：竖直向下的拉力 */}
        <path d={`M${bx} ${beamY - thick / 2 - len}V${beamY - thick / 2 - 4}`} stroke="var(--course-coral)" strokeWidth="4" strokeLinecap="round" />
        <path d={`M${bx - 9} ${beamY - thick / 2 - 16}L${bx} ${beamY - thick / 2 - 3}L${bx + 9} ${beamY - thick / 2 - 16}`} fill="none" stroke="var(--course-coral)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <text className={styles.label} x={bx + 14} y={beamY - thick / 2 - len + 4}>F = {fmt(now.F)} N</text>
        <text className={styles.label} x={ax} y={beamY + thick / 2 + 38 + hooks * 24 + 6} textAnchor="middle">{fmt(setup.f1)} N</text>
        {/* 力臂标注 */}
        <path d={`M${ax} ${beamY + 98}H${fx}`} stroke="var(--course-blue)" strokeWidth="2.5" />
        <path d={`M${fx} ${beamY + 98}H${bx}`} stroke="var(--course-coral)" strokeWidth="2.5" />
        <text className={styles.small} x={(ax + fx) / 2} y={beamY + 120} textAnchor="middle">{setup.l1} 格</text>
        <text className={styles.small} x={(fx + bx) / 2} y={beamY + 120} textAnchor="middle">{l2} 格</text>
        <text className={styles.sym} x={fx} y={beamY + 76} textAnchor="middle">O</text>
      </svg>

      <label className={styles.slider}>
        <span className={styles.sliderLabel}>拖动：拉力的作用点离支点 <strong className={styles.keyed}>{l2} 格</strong></span>
        <input type="range" min="1" max={setup.max} step="1" value={l2} onChange={(e) => setL2(Number(e.target.value))} aria-valuetext={`${l2}格`} />
      </label>
      <p className={styles.readout}>
        左边：{fmt(setup.f1)} N × {setup.l1} 格 = <strong className={styles.keyed}>{fmt(now.left)}</strong>
        　右边：<strong className={styles.keyed} style={{ "--key": "var(--course-coral)" }}>{fmt(now.F)} N</strong> × {l2} 格 = <strong className={styles.keyed}>{fmt(now.right)}</strong>
      </p>
      <p className={styles.note}>杠杆平衡时，动力 × 动力臂 = 阻力 × 阻力臂。拉力方向竖直向下时，作用点越靠外，动力臂越长，需要的拉力越小。</p>
    </div>
  );
}
