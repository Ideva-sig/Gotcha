"use client";

import { useState } from "react";
import { mirrorSetup, mirrorAt, MIRROR, MIRROR_VIEW } from "@/lib/mirrorImage";
import styles from "./MirrorImage.module.css";

// 题目解析后的互动图：拖滑杆改变物体到镜面（水面）的距离，看像到镜面的距离始终和物距相等，像是反射光线反向延长线的交点（虚像）。
export default function MirrorImage({ config }) {
  const setup = mirrorSetup(config);
  const [d, setD] = useState(setup.d);
  const s = mirrorAt(setup, d);
  const { surfaceY, objX, eye } = MIRROR;
  const dim = (x, y1, y2, color) => <path d={`M${x} ${y1}V${y2}`} stroke={color} strokeWidth="2.5" markerStart="none" />;

  return (
    <div className={styles.widget} data-widget="mirror-image">
      <svg className={styles.stage} viewBox={`0 0 ${MIRROR_VIEW.w} ${MIRROR_VIEW.h}`} aria-label={`平面镜成像：物到镜面 ${d} m，像到镜面也是 ${d} m`}>
        <rect x="20" y={surfaceY} width="520" height={MIRROR_VIEW.h - surfaceY - 10} fill="color-mix(in srgb, var(--course-blue) 14%, transparent)" />
        <path d={`M20 ${surfaceY}H540`} stroke="var(--course-ink)" strokeWidth="3" />
        <path d={`M${objX} ${s.obj.y}V${s.img.y}`} stroke="var(--course-light-line)" strokeWidth="2" strokeDasharray="5 5" />
        <path d={`M${s.obj.x} ${s.obj.y}L${s.O.x} ${s.O.y}L${eye.x} ${eye.y}`} fill="none" stroke="var(--course-coral)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d={`M${s.O.x} ${s.O.y}L${s.img.x} ${s.img.y}`} stroke="var(--course-coral)" strokeWidth="2" strokeDasharray="6 5" />
        {dim(objX - 28, s.obj.y, surfaceY, "var(--course-blue)")}
        {dim(objX - 28, surfaceY, s.img.y, "var(--course-blue)")}
        <circle cx={s.obj.x} cy={s.obj.y} r="8" fill="var(--course-yellow)" stroke="var(--course-ink)" strokeWidth="2" />
        <circle cx={s.img.x} cy={s.img.y} r="8" fill="none" stroke="var(--course-ink)" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx={eye.x} cy={eye.y} r="8" fill="var(--course-ink)" />
        <text className={styles.label} x={s.obj.x} y={s.obj.y - 16} textAnchor="middle">物</text>
        <text className={styles.label} x={s.img.x} y={s.img.y + 30} textAnchor="middle">像（虚像）</text>
        <text className={styles.label} x={eye.x} y={eye.y - 18} textAnchor="middle">眼睛</text>
        <text className={styles.small} x={objX - 40} y={(s.obj.y + surfaceY) / 2 + 5} textAnchor="end">{d} m</text>
        <text className={styles.small} x={objX - 40} y={(surfaceY + s.img.y) / 2 + 5} textAnchor="end">{d} m</text>
        <text className={styles.small} x="530" y={surfaceY + 24} textAnchor="end">水面（相当于平面镜）</text>
      </svg>

      <label className={styles.slider}>
        <span className={styles.sliderLabel}>拖动：物体离水面 <strong className={styles.keyed}>{d} m</strong></span>
        <input type="range" min={setup.min} max={setup.max} step={setup.step} value={d} onChange={(e) => setD(Number(e.target.value))} aria-valuetext={`${d}米`} />
      </label>
      <p className={styles.readout}>
        物到水面 <strong className={styles.keyed}>{d} m</strong>，像到水面 <strong className={styles.keyed} style={{ "--key": "var(--course-coral)" }}>{d} m</strong>：两边一样远
      </p>
      <p className={styles.note}>平面镜成的像是虚像：反射光线并没有真的从像那里发出，是反射光线的反向延长线（虚线）在水面下相交。像和物到镜面的距离相等，像和物大小相等。</p>
    </div>
  );
}
