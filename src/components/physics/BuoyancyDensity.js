"use client";

import { useState } from "react";
import { buoyancySetup, buoyancyAt, subY, BUOY_VIEW } from "@/lib/buoyancyDensity";
import styles from "./BuoyancyDensity.module.css";

// 题目解析后的互动图：拖滑杆改变海水密度，看潜水艇体积不变时浮力和排开液体重力怎么变，浮力小于重力就下沉。
const fmt = (v) => Math.round(v).toLocaleString("en-US");

export default function BuoyancyDensity({ config }) {
  const setup = buoyancySetup(config);
  const [rho, setRho] = useState(setup.rho);
  const now = buoyancyAt(setup, rho);
  const y = subY(now.deficit);
  const barH = (n) => 150 * (n / setup.weight);

  return (
    <div className={styles.widget} data-widget="buoyancy-density">
      <svg className={styles.stage} viewBox={`0 0 ${BUOY_VIEW.w} ${BUOY_VIEW.h}`} aria-label={`潜水艇：海水密度 ${rho}，浮力 ${fmt(now.F)} N，重力 ${fmt(now.weight)} N，${now.sinking ? "浮力小于重力，下沉" : "浮力等于重力，悬浮"}`}>
        <rect x="20" y="30" width="300" height="270" fill="color-mix(in srgb, var(--course-blue) 18%, transparent)" stroke="var(--course-blue)" strokeWidth="2" />
        <ellipse cx="170" cy={y} rx="78" ry="28" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2.5" />
        <rect x="150" y={y - 46} width="34" height="22" rx="4" fill="var(--surface)" stroke="var(--course-ink)" strokeWidth="2.5" />
        <circle cx="140" cy={y} r="7" fill="none" stroke="var(--course-ink)" strokeWidth="2" />
        <circle cx="170" cy={y} r="7" fill="none" stroke="var(--course-ink)" strokeWidth="2" />
        <text className={styles.small} x="34" y="54">海水　ρ = {rho.toFixed(2)} g/cm³</text>
        {/* 右边：浮力与重力的对比柱 */}
        <path d="M400 300H540" stroke="var(--course-ink)" strokeWidth="2" />
        <rect x="415" y={300 - barH(now.weight)} width="44" height={barH(now.weight)} fill="color-mix(in srgb, var(--course-yellow) 35%, transparent)" stroke="var(--course-yellow)" strokeWidth="2" />
        <rect x="480" y={300 - barH(now.F)} width="44" height={barH(now.F)} fill="color-mix(in srgb, var(--course-coral) 30%, transparent)" stroke="var(--course-coral)" strokeWidth="2" />
        <text className={styles.label} x="437" y="324" textAnchor="middle">重力</text>
        <text className={styles.label} x="502" y="324" textAnchor="middle">浮力</text>
        <text className={styles.small} x="400" y="62">浮力 = 排开海水的重力</text>
      </svg>

      <label className={styles.slider}>
        <span className={styles.sliderLabel}>拖动：海水密度 <strong className={styles.keyed}>{rho.toFixed(2)} g/cm³</strong></span>
        <input type="range" min={setup.min} max={setup.max} step={setup.step} value={rho} onChange={(e) => setRho(Number(e.target.value))} aria-valuetext={`海水密度 ${rho.toFixed(2)}`} />
      </label>
      <p className={styles.readout}>
        浮力 = 排开海水的重力 = <strong className={styles.keyed} style={{ "--key": "var(--course-coral)" }}>{fmt(now.F)} N</strong>　重力 {fmt(now.weight)} N
        <br />{now.sinking ? "浮力小于重力，潜水艇往下沉（“掉深”）" : "浮力等于重力，潜水艇悬浮"}
      </p>
      <p className={styles.note}>潜水艇完全浸没，排开海水的体积 V 不变，F浮 = ρ液gV排：海水密度变小，浮力和排开海水的重力一起变小。图中数值只是示意。</p>
    </div>
  );
}
