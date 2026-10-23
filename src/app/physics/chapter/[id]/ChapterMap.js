"use client";

import Link from "@/components/CourseLink";
import { CourseText } from "@/components/CourseMarkdown";
import { useCourseStudy } from "@/components/CourseSubject";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { resolvePhysicsTarget } from "@/lib/courseV3Client";
import {
  createEmptyCourseV3,
  getKpStatus,
  loadCourseV3Data,
  subscribeCourseV3,
} from "@/lib/studyData";
import { WeightTag } from "@/components/island/KpTags";
import styles from "./chapter.module.css";

function shortCode(kpId) {
  const parts = kpId.split("-");
  return `${Number(parts[parts.length - 2])}-${parts[parts.length - 1]}`;
}

const STATUS_TONE = { 已掌握: "mastered", 已完成: "done", 未开始: "todo" };

// 按“前置”分层：没有本章前置的放第一列，依赖谁就排在谁后面
function layer(kps) {
  const ids = new Set(kps.map((k) => k.id));
  const depth = {};
  const visit = (kp, seen = new Set()) => {
    if (depth[kp.id] !== undefined) return depth[kp.id];
    if (seen.has(kp.id)) return 0;
    seen.add(kp.id);
    let d = 0;
    for (const p of kp.prerequisites || []) {
      if (!ids.has(p.id)) continue;
      const parent = kps.find((k) => k.id === p.id);
      d = Math.max(d, visit(parent, seen) + 1);
    }
    depth[kp.id] = d;
    return d;
  };
  kps.forEach((kp) => visit(kp));
  const columns = [];
  kps.forEach((kp) => {
    (columns[depth[kp.id]] ||= []).push(kp);
  });
  const edges = [];
  kps.forEach((kp) =>
    (kp.prerequisites || []).forEach((p) => {
      if (ids.has(p.id)) edges.push({ from: p.id, to: kp.id, soft: p.strength !== "hard" });
    }),
  );
  return { columns, edges };
}

export function ChapterMap({ kps = [], questionsMap = {} }) {
  const { loadCourseV3Data, subscribeCourseV3, resolvePhysicsTarget } = useCourseStudy();
  const [studyData, setStudyData] = useState(() => createEmptyCourseV3());
  const [paths, setPaths] = useState([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [focus, setFocus] = useState(null);
  const [drawn, setDrawn] = useState(false);
  const wrapRef = useRef(null);
  const nodeRefs = useRef(new Map());

  useEffect(() => {
    setStudyData(loadCourseV3Data());
    return subscribeCourseV3((next) => setStudyData(next));
  }, []);

  const { columns, edges } = useMemo(() => layer(kps), [kps]);

  const external = useMemo(() => {
    const ids = new Set(kps.map((k) => k.id));
    const seen = new Map();
    kps.forEach((kp) =>
      (kp.prerequisites || []).forEach((p) => {
        if (!ids.has(p.id) && !seen.has(p.id)) seen.set(p.id, resolvePhysicsTarget(p.id));
      }),
    );
    return [...seen.values()];
  }, [kps]);

  // 节点排好以后，按实际位置画连线；尺寸变了重新画
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const base = wrap.getBoundingClientRect();
    const next = edges
      .map((e) => {
        const a = nodeRefs.current.get(e.from)?.getBoundingClientRect();
        const b = nodeRefs.current.get(e.to)?.getBoundingClientRect();
        if (!a || !b) return null;
        const vertical = b.left < a.right - 1;
        let d;
        if (vertical) {
          const x1 = a.left + a.width / 2 - base.left;
          const y1 = a.bottom - base.top;
          const x2 = b.left + b.width / 2 - base.left;
          const y2 = b.top - base.top;
          const dy = Math.max(16, (y2 - y1) / 2);
          d = `M${x1} ${y1} C${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2}`;
        } else {
          const x1 = a.right - base.left;
          const y1 = a.top + a.height / 2 - base.top;
          const x2 = b.left - base.left;
          const y2 = b.top + b.height / 2 - base.top;
          const dx = Math.max(16, (x2 - x1) / 2);
          d = `M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
        }
        return { ...e, d };
      })
      .filter(Boolean);
    setPaths(next);
    setSize({ w: base.width, h: base.height });
  }, [edges]);

  useLayoutEffect(() => {
    measure();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [measure]);

  const related = useMemo(() => {
    if (!focus) return null;
    const set = new Set([focus]);
    edges.forEach((e) => {
      if (e.from === focus) set.add(e.to);
      if (e.to === focus) set.add(e.from);
    });
    return set;
  }, [focus, edges]);

  return (
    <div className={styles.map} data-drawn={drawn ? "true" : "false"}>
      <div className={styles.mapScroll}>
        <div
          className={`${styles.mapGrid} ${columns.length > 5 ? styles.mapDeep : ""}`}
          onPointerLeave={() => setFocus(null)}
          ref={wrapRef}
          style={{ "--cols": columns.length }}
        >
          <svg aria-hidden="true" className={styles.mapLines} height={size.h} width={size.w}>
            {paths.map((p, i) => {
              const on = focus && (p.from === focus || p.to === focus);
              return (
                <path
                  className={`${p.soft ? styles.edgeSoft : styles.edge} ${on ? styles.edgeOn : ""} ${
                    focus && !on ? styles.edgeDim : ""
                  }`}
                  d={p.d}
                  key={`${p.from}-${p.to}`}
                  pathLength="1"
                  style={{ "--e": i }}
                />
              );
            })}
          </svg>

          {columns.map((col, c) => (
            <div className={styles.mapCol} key={c}>
              {col.map((kp, r) => {
                const status = getKpStatus(kp, questionsMap, studyData);
                const dim = related && !related.has(kp.id);
                return (
                  <Link
                    className={`${styles.node} ${styles[STATUS_TONE[status]]} ${
                      dim ? styles.nodeDim : ""
                    } ${focus === kp.id ? styles.nodeFocus : ""}`}
                    href={`/physics/kp/${kp.id}/`}
                    key={kp.id}
                    onBlur={() => setFocus(null)}
                    onFocus={() => setFocus(kp.id)}
                    onPointerEnter={() => setFocus(kp.id)}
                    ref={(el) => {
                      if (el) nodeRefs.current.set(kp.id, el);
                      else nodeRefs.current.delete(kp.id);
                    }}
                    style={{ "--n": c * 3 + r }}
                  >
                    <span className={styles.nodeTop}>
                      <span className={styles.nodeCode}>{shortCode(kp.id)}</span>
                      {kp.weight === "重点" && <WeightTag weight="重点" />}
                      {kp.weight === "了解" && <WeightTag weight="了解" />}
                    </span>
                    <span className={styles.nodeTitle}><CourseText>{kp.title}</CourseText></span>
                    <span className={styles.nodeBar} title={status} />
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.mapLegend}>
        <span>
          <i className={styles.legendHard} /> 必须先会
        </span>
        <span>
          <i className={styles.legendSoft} /> 会了更容易
        </span>
        <span>从左往右按学习顺序排；指着一个知识点，会亮出和它相连的线。</span>
      </div>

      {external.length > 0 && (
        <div className={styles.mapExternal}>
          <span className={styles.mapExternalTitle}>本章还要用到前面学过的</span>
          <ul>
            {external.map((t, i) => (
              <li key={i}>
                {t.type === "kp" ? <Link href={t.href}><CourseText>{t.text}</CourseText></Link> : <span><CourseText>{t.text}</CourseText></span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
