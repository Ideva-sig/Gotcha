"use client";

import Link from "@/components/CourseLink";
import { useCourseStudy } from "@/components/CourseSubject";
import { WeightTag } from "@/components/island/KpTags";
import { Title } from "@/components/island/Island";
import { MATH_BOOKS, setMathBook, useMathBook } from "@/lib/mathBook";
import { MathBookChips } from "./MathBookChips";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./KnowledgeMap.module.css";

const COL_W = 132;
const ROW_H = 44;
const TOP = 78;
const PAD_X = 40;
const R = 9;
const WEIGHT_TONE = { 重点: "tone-red", 一般: "tone-blue", 了解: "tone-brown" };

function shortCode(id) {
  return id.replace(/^MATH-[^-]+-/, "").replace(/^PHY-9-/, "").replace(/^PHY-/, "");
}

/** 把章节排成一列一列，知识点在列内从上往下排；前置线从左边的点连到右边的点 */
function buildLayout(chapters, kps, bookFilter) {
  const shown = chapters.filter((c) => bookFilter === "all" || c.book === bookFilter);
  const nodes = [];
  const byId = new Map();
  shown.forEach((ch, col) => {
    (ch.kpIds || []).forEach((id, row) => {
      const kp = kps[id];
      if (!kp) return;
      const node = {
        id,
        col,
        row,
        x: PAD_X + col * COL_W + COL_W / 2,
        y: TOP + row * ROW_H,
        title: kp.title,
        weight: kp.weight,
        available: kp.available,
        chapterId: ch.id,
        chapterTitle: ch.title,
        order: nodes.length,
      };
      nodes.push(node);
      byId.set(id, node);
    });
  });
  const edges = [];
  for (const n of nodes) {
    for (const p of kps[n.id].prerequisites || []) {
      const from = byId.get(p.id);
      if (!from || from.id === n.id) continue;
      edges.push({ key: `${from.id}>${n.id}`, from, to: n, hard: p.strength === "hard", reason: p.reason });
    }
  }
  const maxRows = Math.max(1, ...shown.map((c) => (c.kpIds || []).length));
  return {
    shown,
    nodes,
    byId,
    edges,
    width: PAD_X * 2 + shown.length * COL_W,
    height: TOP + maxRows * ROW_H + 24,
  };
}

function edgePath(e) {
  const { from, to } = e;
  if (from.x === to.x) {
    const bend = 46;
    return `M${from.x} ${from.y} C${from.x + bend} ${from.y}, ${to.x + bend} ${to.y}, ${to.x} ${to.y}`;
  }
  const dx = (to.x - from.x) * 0.5;
  return `M${from.x} ${from.y} C${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
}

function walk(startId, edges, dir) {
  const seen = new Set();
  const edgeKeys = new Set();
  const stack = [startId];
  while (stack.length) {
    const cur = stack.pop();
    for (const e of edges) {
      const [near, far] = dir === "up" ? [e.to.id, e.from.id] : [e.from.id, e.to.id];
      if (near !== cur) continue;
      edgeKeys.add(e.key);
      if (!seen.has(far)) {
        seen.add(far);
        stack.push(far);
      }
    }
  }
  return { ids: seen, edges: edgeKeys };
}

export function KnowledgeMap({ chapters, kps }) {
  const { subject, base, loadCourseV3Data, subscribeCourseV3 } = useCourseStudy();
  const mathBook = useMathBook();
  const bookFilter = subject === "math" ? mathBook : "all";
  const layout = useMemo(() => buildLayout(chapters, kps, bookFilter), [chapters, kps, bookFilter]);
  const { nodes, edges, shown } = layout;

  const [selected, setSelected] = useState(null);
  const [visited, setVisited] = useState(() => new Set());
  const [progress, setProgress] = useState(null); // null = 完整显示；数字 = 演示中已出现的点数
  const scrollRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const read = (d) => setVisited(new Set(d.visitedKps || []));
    read(loadCourseV3Data());
    return subscribeCourseV3(read);
  }, [loadCourseV3Data, subscribeCourseV3]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);
  // 从知识点页跳来时（?kp=编号），自动选中它，并把课本切到它所在的那一册
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("kp");
    const kp = id && kps[id];
    if (!kp) return;
    const chapter = chapters.find((c) => c.id === kp.chapter);
    if (subject === "math" && chapter) setMathBook(chapter.book);
    setSelected(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focus = useMemo(() => {
    if (!selected) return null;
    return { up: walk(selected, edges, "up"), down: walk(selected, edges, "down") };
  }, [selected, edges]);

  const play = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    setSelected(null);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !nodes.length) {
      setProgress(null);
      return;
    }
    setProgress(0);
    const total = nodes.length;
    const duration = Math.min(14000, Math.max(5000, total * 70));
    const start = performance.now();
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollLeft = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const count = Math.floor(t * total);
      setProgress(t >= 1 ? null : count);
      if (scroller && t < 1) {
        const lead = nodes[Math.min(total - 1, count)];
        const target = lead.x - scroller.clientWidth * 0.6;
        scroller.scrollLeft += (Math.max(0, target) - scroller.scrollLeft) * 0.12;
      }
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [nodes]);

  const playing = progress !== null;
  const selNode = selected ? layout.byId.get(selected) : null;
  const upCount = focus ? focus.up.ids.size : 0;
  const downCount = focus ? focus.down.ids.size : 0;
  const near = new Set();
  if (selNode) {
    edges.forEach((e) => {
      if (e.to.id === selNode.id) near.add(e.from.id);
      if (e.from.id === selNode.id) near.add(e.to.id);
    });
  }

  const nodeState = (n) => {
    if (playing) return n.order < progress ? "on" : "off";
    if (!focus) return "on";
    if (n.id === selected) return "self";
    if (focus.up.ids.has(n.id)) return "up";
    if (focus.down.ids.has(n.id)) return "down";
    return "dim";
  };

  return (
    <div className={styles.wrap}>
      {subject === "math" && (
        <div className={styles.toolbar}>
          <MathBookChips books={MATH_BOOKS.filter((b) => chapters.some((c) => c.book === b.key))} />
        </div>
      )}
      <div className={styles.toolbar}>
        <button className="island-btn" onClick={play} type="button">
          {playing ? "重新演示" : "演示学习顺序"}
        </button>
        <ul className={styles.legend} aria-label="图例">
          <li><i className={`${styles.dot} tone-red`} />重点</li>
          <li><i className={`${styles.dot} tone-blue`} />一般</li>
          <li><i className={`${styles.dot} tone-brown`} />了解</li>
          <li><i className={`${styles.dot} ${styles.dotDone}`} />已学过</li>
          <li><i className={`${styles.line} ${styles.lineHard}`} />必须先会</li>
          <li><i className={`${styles.line} ${styles.lineSoft}`} />会了更容易</li>
        </ul>
      </div>
      <p className={styles.hint}>
        每个圆点是一个知识点，线从“要先会的”连到“后面要用的”。点一个圆点，看它前面要会什么、后面通向哪里。
      </p>

      <div className={styles.scroller} ref={scrollRef}>
        <svg
          className={styles.svg}
          height={layout.height}
          onClick={() => setSelected(null)}
          role="img"
          aria-label="知识点前置关系图"
          width={layout.width}
        >
          {shown.map((ch, col) => {
            const m = ch.title.match(/^(第.+?(?:章|单元))\s*(.*)$/);
            const head = m ? m[1] : shortCode(ch.id);
            const rest = m ? m[2] : ch.title;
            const cx = PAD_X + col * COL_W + COL_W / 2;
            return (
              <text className={styles.colHead} key={ch.id} x={cx} y={24}>
                <tspan x={cx}>{head}</tspan>
                <tspan dy="18" x={cx}>{rest.length > 8 ? `${rest.slice(0, 8)}…` : rest}</tspan>
              </text>
            );
          })}

          <g className={styles.edges}>
            {edges.map((e) => {
              let state = "on";
              if (playing) state = e.to.order < progress ? "on" : "off";
              else if (focus) {
                state = focus.up.edges.has(e.key) ? "up" : focus.down.edges.has(e.key) ? "down" : "dim";
              }
              return (
                <path
                  className={`${styles.edge} ${e.hard ? styles.edgeHard : styles.edgeSoft} ${styles[`e_${state}`]}`}
                  d={edgePath(e)}
                  key={e.key}
                  pathLength="1"
                />
              );
            })}
          </g>

          {nodes.map((n) => {
            const state = nodeState(n);
            const label = state === "self" || (focus && near.has(n.id));
            return (
              <g
                className={`${styles.node} ${WEIGHT_TONE[n.weight] || "tone-blue"} ${styles[`n_${state}`]} ${
                  n.available ? "" : styles.nodeLocked
                }`}
                key={n.id}
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (playing) {
                    cancelAnimationFrame(frameRef.current);
                    setProgress(null);
                  }
                  setSelected((cur) => (cur === n.id ? null : n.id));
                }}
                role="button"
                tabIndex={0}
                aria-label={`${shortCode(n.id)} ${n.title}`}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    setSelected((cur) => (cur === n.id ? null : n.id));
                  }
                }}
              >
                <circle className={styles.hit} cx={n.x} cy={n.y} r={22} />
                <circle className={styles.body} cx={n.x} cy={n.y} r={n.id === selected ? R + 3 : R} />
                {visited.has(n.id) && <circle className={styles.done} cx={n.x} cy={n.y} r={3.5} />}
                {label && (
                  <text className={styles.label} x={n.x} y={n.y - R - 8}>
                    {n.title.length > 10 ? `${n.title.slice(0, 10)}…` : n.title}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <section className={styles.card} aria-live="polite">
        {selNode ? (
          <>
            <div className={styles.cardHead}>
              <Title as="h2" size="sm" tone="green" variant="tab">{shortCode(selNode.id)}</Title>
              <h2>{selNode.title}</h2>
              <WeightTag weight={selNode.weight || "一般"} />
            </div>
            <p className={styles.cardMeta}>
              {selNode.chapterTitle}。
              {upCount ? `往前要先会 ${upCount} 个知识点` : "这是起点，不需要先会别的"}
              {downCount ? `，往后会通向 ${downCount} 个。` : "，后面没有再依赖它的。"}
            </p>
            {selNode.available ? (
              <Link className="island-btn" href={`${base}/kp/${selNode.id}/`}>去学这个知识点</Link>
            ) : (
              <p className={styles.cardMeta}>这一章还没开放。</p>
            )}
          </>
        ) : (
          <p className={styles.cardMeta}>
            {subject === "math" && bookFilter !== "all"
              ? `现在只看${MATH_BOOKS.find((b) => b.key === bookFilter)?.title || ""}，要看别的册，在上面换。`
              : "点任意一个圆点开始。"}
          </p>
        )}
      </section>
    </div>
  );
}
