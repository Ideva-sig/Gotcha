"use client";

import { useEffect, useRef, useState } from "react";
import { reactionSetup, reactionLayout, atomAt, atomStyle, subscript, MICRO_VIEW } from "@/lib/reactionMicro";
import styles from "./ReactionMicro.module.css";

// 题目解析后的互动图：拖动或播放，看分子拆成原子、原子重新组合成新分子；原子种类和个数始终不变。
const STAGES = [
  { key: "before", label: "反应前", t: 0 },
  { key: "split", label: "拆成原子", t: 0.5 },
  { key: "after", label: "重新组合", t: 1 },
];
const stageOf = (t) => (t < 0.2 ? "before" : t > 0.8 ? "after" : "split");
const list = (side) => side.map((s) => `${s.count} 个 ${subscript(s.formula)}`).join("、");

export default function ReactionMicro({ config }) {
  const setup = reactionSetup(config);
  const L = reactionLayout(setup);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frame = useRef(0);
  const stage = stageOf(t);

  useEffect(() => {
    if (!playing) return undefined;
    const start = performance.now(), from = t >= 1 ? 0 : t;
    const tick = (now) => {
      const next = Math.min(1, from + (now - start) / 4000);
      setT(next);
      if (next < 1) frame.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const jump = (v) => { setPlaying(false); setT(v); };
  const atoms = L.atoms.map((a) => ({ ...a, p: atomAt(a, t) })).sort((p, q) => (p.el === "H") - (q.el === "H"));
  const equation = `${setup.reactants.map((s) => `${s.count > 1 ? s.count : ""}${subscript(s.formula)}`).join(" + ")} → ${setup.products.map((s) => `${s.count > 1 ? s.count : ""}${subscript(s.formula)}`).join(" + ")}`;
  const atomLine = setup.elements.map((el) => `${el} ${setup.atoms[el]} 个`).join("、");

  return (
    <div className={styles.widget} data-widget="reaction-micro">
      <svg className={styles.stage} viewBox={`0 0 ${MICRO_VIEW.w} ${MICRO_VIEW.h}`} aria-label={`微观示意图：${equation}，分子拆成原子再重新组合`}>
        <text className={stage === "before" ? styles.zoneOn : styles.zone} x={L.zones.before} y="28" textAnchor="middle">反应前</text>
        <text className={stage === "after" ? styles.zoneOn : styles.zone} x={L.zones.after} y="28" textAnchor="middle">反应后</text>
        {config.condition && <text className={styles.zone} x={(L.zones.before + L.zones.after) / 2} y="28" textAnchor="middle">{config.condition}</text>}
        <path d={`M${(L.zones.before + L.zones.after) / 2 - 44} 44H${(L.zones.before + L.zones.after) / 2 + 40}`} stroke="var(--course-line)" strokeWidth="2" />
        <path d={`M${(L.zones.before + L.zones.after) / 2 + 32} 38L${(L.zones.before + L.zones.after) / 2 + 44} 44L${(L.zones.before + L.zones.after) / 2 + 32} 50`} fill="none" stroke="var(--course-line)" strokeWidth="2" strokeLinejoin="round" />
        {atoms.map((a, i) => {
          const s = atomStyle(a.el);
          return <circle key={`c${i}`} cx={a.p.x} cy={a.p.y} r={s.r} fill={s.fill} stroke="var(--course-ink)" strokeWidth="1.8" />;
        })}
        {atoms.map((a, i) => (
          <text key={`t${i}`} className={styles.atom} x={a.p.x} y={a.p.y + (a.el === "H" ? 5 : 6)} textAnchor="middle"
            fontSize={a.el === "H" ? 14 : 16} fill={atomStyle(a.el).text}>{a.el}</text>
        ))}
      </svg>

      <div className={styles.controls}>
        <div className={`isl-tabs isl-tabs--bare ${styles.picker}`}>
          <div className="isl-tabList" role="tablist" aria-label="反应进行到哪一步">
            {STAGES.map((s) => (
              <button key={s.key} type="button" role="tab" className="isl-tabItem" aria-selected={s.key === stage} onClick={() => jump(s.t)}>{s.label}</button>
            ))}
          </div>
        </div>
        <button type="button" className="island-btn island-btn--primary" onClick={() => { if (t >= 1) setT(0); setPlaying(true); }} disabled={playing}>
          {playing ? "播放中…" : "播放一遍"}
        </button>
      </div>
      <label className={styles.slider}>
        <span className={styles.sr}>反应进度</span>
        <input type="range" min="0" max="100" value={Math.round(t * 100)} onChange={(e) => jump(Number(e.target.value) / 100)} aria-valuetext={STAGES.find((s) => s.key === stage).label} />
      </label>

      <p className={styles.readout}>
        {stage === "before" && <>分子 <strong className={styles.keyed}>{setup.moleculesBefore} 个</strong>：{list(setup.reactants)}</>}
        {stage === "split" && <>分子拆开了，只剩一个个原子：<strong className={styles.keyed}>{atomLine}</strong></>}
        {stage === "after" && <>分子 <strong className={styles.keyed}>{setup.moleculesAfter} 个</strong>：{list(setup.products)}</>}
        <br />原子从头到尾都是 {atomLine}：种类、个数都不变
      </p>
      <p className={styles.note}>
        化学变化里，分子分成原子，原子重新组合成新分子。图中各分子的个数按方程式 {equation} 画；分子个数 {setup.moleculesBefore} → {setup.moleculesAfter}，变了。
      </p>
    </div>
  );
}
