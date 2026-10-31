"use client";

import { useEffect, useRef, useState } from "react";
import { fourStrokeSetup, fourStrokeAt, STROKES, ENGINE, ENGINE_VIEW } from "@/lib/fourStroke";
import styles from "./FourStroke.module.css";

// 题目解析后的互动图：拖滑杆（或点冲程名、按播放）让曲轴转动，看气门、活塞和气体怎么变。
const GAS = { intake: ["var(--course-blue)", 0.14], compress: ["var(--course-blue)", 0.32], power: ["var(--course-coral)", 0.34], exhaust: ["var(--course-line)", 0.26] };

export default function FourStroke({ config }) {
  const setup = fourStrokeSetup(config);
  const [deg, setDeg] = useState(setup.start);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return undefined;
    let last = performance.now();
    const tick = (now) => {
      setDeg((d) => (d + (now - last) * 0.12) % 720);
      last = now;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const now = fourStrokeAt(deg), { stroke } = now;
  const { cx, cy, R, headY, wallL, wallR, wallBottom, pistonH } = ENGINE;
  const [gasFill, gasOpacity] = GAS[stroke.key];
  const lift = 9;
  const valve = (x, open) => <path d={`M${x} ${headY - 18}V${headY + (open ? lift : 0) + 4}h0M${x - 14} ${headY + (open ? lift : 0) + 4}h28`} stroke="var(--course-ink)" strokeWidth="4" strokeLinecap="round" fill="none" />;

  return (
    <div className={styles.widget} data-widget="four-stroke">
      <svg className={styles.stage} viewBox={`0 0 ${ENGINE_VIEW.w} ${ENGINE_VIEW.h}`} aria-label={`四冲程汽油机：现在是${stroke.name}，${stroke.valve}，${stroke.move}`}>
        <rect x={wallL + 2} y={headY} width={wallR - wallL - 4} height={Math.max(0, now.gasBottom - headY)} fill={gasFill} fillOpacity={gasOpacity} />
        <path d={`M${wallL} ${wallBottom}V${headY}H${wallR}V${wallBottom}`} fill="none" stroke="var(--course-ink)" strokeWidth="4" strokeLinejoin="round" />
        {valve(250, now.intakeOpen)}{valve(310, now.exhaustOpen)}
        <path d={`M280 ${headY - 26}V${headY}`} stroke="var(--course-ink)" strokeWidth="6" strokeLinecap="round" />
        {now.spark && <path d={`M272 ${headY + 6}l8 8l-8 8l8 8`} fill="none" stroke="var(--course-yellow)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--course-light-line)" strokeWidth="2" strokeDasharray="5 5" />
        <path d={`M${cx} ${now.pinY}L${now.crank.x} ${now.crank.y}`} stroke="var(--course-muted)" strokeWidth="6" strokeLinecap="round" />
        <path d={`M${cx} ${cy}L${now.crank.x} ${now.crank.y}`} stroke="var(--course-ink)" strokeWidth="5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill="var(--course-ink)" />
        <circle cx={now.crank.x} cy={now.crank.y} r="6" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="3" />
        <rect x={wallL + 2} y={now.pistonTop} width={wallR - wallL - 4} height={pistonH} rx="3" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="3" />
        <text className={styles.small} x="236" y="44" textAnchor="end">进气门{now.intakeOpen ? "（开）" : ""}</text>
        <text className={styles.small} x="324" y="44">排气门{now.exhaustOpen ? "（开）" : ""}</text>
        <text className={styles.small} x="280" y="14" textAnchor="middle">火花塞</text>
        <text className={styles.small} x="352" y={now.pistonTop + pistonH / 2 + 5}>活塞</text>
      </svg>

      <div className={styles.tabs} role="group" aria-label="选冲程">
        {STROKES.map((s) => (
          <button type="button" key={s.key} className={styles.tab} aria-pressed={s.key === stroke.key} onClick={() => { setPlaying(false); setDeg(s.mid); }}>{s.name}</button>
        ))}
      </div>
      <label className={styles.slider}>
        <span className={styles.sliderLabel}>拖动：曲轴转了 <strong className={styles.keyed}>{Math.round(deg)}°</strong>（转两圈完成一个工作循环）</span>
        <input type="range" min="0" max="719" step="1" value={Math.round(deg)} onChange={(e) => { setPlaying(false); setDeg(Number(e.target.value)); }} aria-valuetext={`${Math.round(deg)}度，${stroke.name}`} />
      </label>
      <p className={styles.playRow}><button type="button" className={styles.play} onClick={() => setPlaying((p) => !p)}>{playing ? "暂停" : "播放"}</button></p>
      <p className={styles.readout}><strong className={styles.keyed}>{stroke.name}</strong>：{stroke.valve}，{stroke.move}</p>
      <p className={styles.note}>{stroke.note}。</p>
    </div>
  );
}
