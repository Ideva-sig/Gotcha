"use client";

import { useMemo, useRef, useState } from "react";
import styles from "./PeriodicTable.module.css";

// 类别：颜色按含义取，和图示版元素周期表的分区一致
const CATS = [
  { key: "alkali", label: "碱金属", tone: "purple" },
  { key: "alkaline", label: "碱土金属", tone: "blue" },
  { key: "transition", label: "过渡金属", tone: "leaf" },
  { key: "metal", label: "主族金属", tone: "lime" },
  { key: "metalloid", label: "类金属", tone: "lemon" },
  { key: "nonmetal", label: "非金属", tone: "yellow" },
  { key: "halogen", label: "卤素", tone: "orange" },
  { key: "noble", label: "稀有气体", tone: "pink" },
  { key: "lanact", label: "镧系·锕系", tone: "teal" },
  { key: "super", label: "超重元素", tone: "" },
  { key: "h", label: "氢", tone: "brown" },
];
const CAT = Object.fromEntries(CATS.map((c) => [c.key, c]));

const MODES = [
  { key: "normal", label: "正常看" },
  { key: "guessName", label: "看符号猜名称" },
  { key: "guessSymbol", label: "看名称猜符号" },
];

function shells(z) {
  if (z > 20) return "";
  if (z <= 2) return String(z);
  if (z <= 10) return `2,${z - 2}`;
  if (z <= 18) return `2,8,${z - 10}`;
  return `2,8,8,${z - 18}`;
}

function massText(m) {
  if (m.startsWith("[")) return `${m}（放射性元素，括号内是寿命最长的同位素的质量数）`;
  if (m.includes("–")) return `介于 ${m.replace("–", " 和 ")} 之间（随同位素丰度变化）`;
  return m;
}

// elements / junior 来自内容包 chemistry/periodic.json（源文件 course/chemistry/periodic.yml），由页面在构建时传入
export function PeriodicTable({ elements, junior }) {
  const byCell = useMemo(() => new Map(elements.map((e) => [`${e.row}-${e.col}`, e])), [elements]);
  const juniorSet = useMemo(() => new Set(junior), [junior]);
  const [filter, setFilter] = useState("all");
  const [mode, setMode] = useState("normal");
  const [selected, setSelected] = useState(8);
  const detailRef = useRef(null);
  const [revealed, setRevealed] = useState(() => new Set());

  const reveal = (z) => setRevealed((prev) => new Set(prev).add(z));
  const changeMode = (key) => {
    setMode(key);
    setRevealed(new Set());
  };

  const matches = (e) =>
    filter === "all" ||
    (filter === "junior" ? juniorSet.has(e.z) : e.category === filter);

  const sel = elements[selected - 1];
  const { z, symbol: sym, name, mass, calc, category: cat } = sel;
  const cat0 = CAT[cat];
  const toneClass = cat0.tone ? `tone-${cat0.tone}` : styles.toneNeutral;

  const cells = [];
  for (let r = 1; r <= 9; r += 1) {
    for (let c = 1; c <= 18; c += 1) {
      const e = byCell.get(`${r}-${c}`);
      if (!e) continue;
      const { z: ez, symbol: esym, name: ename, category: ecat } = e;
      const tone = CAT[ecat].tone;
      const hideSym = mode === "guessSymbol" && !revealed.has(ez);
      const hideName = mode === "guessName" && !revealed.has(ez);
      cells.push(
        <button
          type="button"
          key={ez}
          className={[
            styles.cell,
            tone ? `tone-${tone}` : styles.toneNeutral,
            ez === selected ? styles.selected : "",
            matches(e) ? "" : styles.dim,
          ].join(" ")}
          style={{ gridRow: r <= 7 ? r : r + 1, gridColumn: c }}
          aria-pressed={ez === selected}
          aria-label={`${ez}号 ${ename || esym}`}
          onClick={() => {
            setSelected(ez);
            reveal(ez);
            // 点下方的元素时，详情在上面，滚回来让它露出（自测模式不打断）
            if (mode === "normal") detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }}
        >
          <span className={styles.num}>{ez}</span>
          <span className={styles.sym}>{hideSym ? "?" : esym}</span>
          <span className={styles.name}>{hideName ? "?" : ename || ""}</span>
        </button>,
      );
    }
  }

  return (
    <div>
      <div className={styles.controls}>
        <div className={styles.chips} role="group" aria-label="按类别筛选">
          {[{ key: "all", label: "全部", tone: "green" }, { key: "junior", label: "初中常用（前 20 号和常见金属）", tone: "green" }, ...CATS].map((c) => (
            <button
              type="button"
              key={c.key}
              className={`${styles.chip} ${c.tone ? `tone-${c.tone}` : styles.toneNeutral}`}
              aria-pressed={filter === c.key}
              onClick={() => setFilter(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className={styles.chips} role="group" aria-label="自测方式">
          <span className={styles.groupLabel}>自测</span>
          {MODES.map((m) => (
            <button
              type="button"
              key={m.key}
              className={`${styles.chip} tone-blue`}
              aria-pressed={mode === m.key}
              onClick={() => changeMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroller}>
        <div className={styles.grid}>
          <section ref={detailRef} className={`${styles.detail} ${toneClass}`} aria-live="polite" aria-label="元素详情">
            {z >= 99 ? (
              <div className={styles.tile} role="img" aria-label={`${name || sym} 的图示卡片`}>
                <span className={styles.tileNum}>{z}</span>
                <span className={styles.tileSym}>{sym}</span>
                <span className={styles.tileName}>{name}</span>
                <span className={styles.tileNote}>自然界中没有，人工合成。具有放射性，只用于原子研究。</span>
              </div>
            ) : (
              <img
                className={styles.tile}
                src={`/periodic/tiles/${String(z).padStart(3, "0")}.webp`}
                alt={`${name || sym} 的图示卡片`}
                width={144}
                height={193}
              />
            )}
            <div className={styles.info}>
              <h2 className={styles.title}>
                <span className={styles.bigSym}>{sym}</span>
                {name ? ` ${name}` : " 超重元素"}
              </h2>
              <dl className={styles.facts}>
                <dt>原子序数</dt>
                <dd>{z}（质子数 = 核电荷数 = 原子的核外电子数）</dd>
                <dt>类别</dt>
                <dd>{cat0.label}</dd>
                <dt>周期</dt>
                <dd>第 {sel.row >= 8 ? (sel.row === 8 ? 6 : 7) : sel.row} 周期</dd>
                {shells(z) && (
                  <>
                    <dt>电子层排布</dt>
                    <dd>{shells(z)}（最外层 {shells(z).split(",").pop()} 个电子）</dd>
                  </>
                )}
                <dt>相对原子质量</dt>
                <dd>
                  {massText(mass)}
                  {calc && <strong className={styles.calc}>初中计算取 {calc}</strong>}
                </dd>
              </dl>
            </div>
          </section>
          {cells}
          <p className={styles.noteLan} style={{ gridRow: 6, gridColumn: 3 }} aria-hidden="true">57–71</p>
          <p className={styles.noteAct} style={{ gridRow: 7, gridColumn: 3 }} aria-hidden="true">89–103</p>
        </div>
      </div>
    </div>
  );
}
