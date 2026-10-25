"use client";

import { MATH_BOOKS, useMathBook } from "@/lib/mathBook";
import { MathBookChips } from "./MathBookChips";
import Link from "./CourseLink";
import { CourseText } from "./CourseMarkdown";
import { useCourseStudy } from "./CourseSubject";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getActiveMistakes,
  getKpStatus,
  loadCourseV3Data,
  subscribeCourseV3,
} from "@/lib/studyData";
import { ArrowRight, Check as CheckMark, Close } from "./LineIcons";
import { Title } from "./island/Island";
import { WeightTag } from "./island/KpTags";
import styles from "./PhysicsHome.module.css";

const BOOKS = [
  { key: "9A", title: "九年级上册" },
  { key: "8A", title: "八年级上册" },
  { key: "8B", title: "八年级下册" },
  { key: "9", title: "九年级全一册" },
];

// 考得最多的几章用珊瑚红标出
const TOP_CHAPTERS = 4;

function chapterNumber(chapterId) {
  return Number(chapterId.split("-").pop());
}

function chapterName(title) {
  return title.replace(/^第.+?(章|单元)\s*/, "");
}

function kpCode(kpId) {
  const parts = kpId.split("-");
  return `${Number(parts[parts.length - 2])}-${parts[parts.length - 1]}`;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = target;
    if (from === target) return undefined;
    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

const STATUS_CLASS = {
  已掌握: "mastered",
  已完成: "done",
  未开始: "todo",
};

export function PhysicsHome({ availableKps = [], chapters = [], kpIndex = {}, questionsMap = {} }) {
  const { loadCourseV3Data, subscribeCourseV3, getActiveMistakes, regradeChoiceAttempts, label } = useCourseStudy();
  const [ready, setReady] = useState(false);
  const [statuses, setStatuses] = useState({});
  const [mistakes, setMistakes] = useState([]);
  const [sortMode, setSortMode] = useState("book");
  const [openChapterId, setOpenChapterId] = useState(null);

  const refresh = useCallback(() => {
    try {
      regradeChoiceAttempts(questionsMap);
      const data = loadCourseV3Data();
      const next = {};
      for (const kp of availableKps) next[kp.id] = getKpStatus(kp, questionsMap, data);
      setStatuses(next);
      setMistakes(getActiveMistakes(questionsMap));
    } catch (_) {
      // 本机记录读不到时按“全部未开始”显示
    }
    setReady(true);
  }, [availableKps, questionsMap]);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeCourseV3(refresh);
    window.addEventListener("storage", refresh);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const isDone = (kpId) => statuses[kpId] === "已完成" || statuses[kpId] === "已掌握";

  const nextKp = useMemo(
    () => availableKps.find((kp) => !isDone(kp.id)) || availableKps[0] || null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availableKps, statuses],
  );

  const currentChapter = nextKp ? chapters.find((c) => c.id === nextKp.chapterId) : null;

  const chapterProgress = useMemo(() => {
    const result = {};
    for (const ch of chapters) {
      if (!ch.available) continue;
      const done = ch.kpIds.filter((id) => isDone(id)).length;
      result[ch.id] = { done, total: ch.kpIds.length };
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters, statuses]);

  const totals = useMemo(() => {
    const values = Object.values(statuses);
    return {
      opened: availableKps.length,
      done: values.filter((s) => s === "已完成" || s === "已掌握").length,
      mastered: values.filter((s) => s === "已掌握").length,
    };
  }, [availableKps.length, statuses]);

  const openChapter = chapters.find((c) => c.id === openChapterId) || null;
  const closeDrawer = useCallback(() => setOpenChapterId(null), []);

  return (
    <div className={styles.home} data-ready={ready ? "true" : "false"}>
      <h1 className={styles.visuallyHidden}>初中{label}</h1>

      <div className={styles.top}>
        <ContinueCard
          chapter={currentChapter}
          kpIndex={kpIndex}
          nextKp={nextKp}
          statuses={statuses}
        />
        <div className={styles.side}>
          <MistakesCard kpIndex={kpIndex} mistakes={mistakes} />
          <OverallCard totals={totals} />
        </div>
      </div>

      <ChapterIndex
        chapterProgress={chapterProgress}
        chapters={chapters}
        currentChapterId={currentChapter?.id}
        onOpen={setOpenChapterId}
        openChapterId={openChapterId}
        setSortMode={setSortMode}
        sortMode={sortMode}
      />

      <ChapterDrawer
        chapter={openChapter}
        kpIndex={kpIndex}
        onClose={closeDrawer}
        statuses={statuses}
      />
    </div>
  );
}

/* ---------- 接着学 ---------- */

function ContinueCard({ nextKp, chapter, kpIndex, statuses }) {
  const { subject } = useCourseStudy();
  if (!nextKp || !chapter) {
    return (
      <section className={`${styles.card} ${styles.continue}`} style={{ "--i": 0 }}>
        <h2 className={styles.cardLabel}>接着学</h2>
        <p className={styles.muted}>还没有开放的章节。</p>
      </section>
    );
  }

  const hits = kpIndex[nextKp.id]?.examHits ?? 0;
  const chapterKps = chapter.kpIds;
  const doneCount = chapterKps.filter(
    (id) => statuses[id] === "已完成" || statuses[id] === "已掌握",
  ).length;
  const nextIndex = chapterKps.indexOf(nextKp.id);
  const upcoming = chapterKps
    .slice(nextIndex + 1)
    .filter((id) => statuses[id] !== "已完成" && statuses[id] !== "已掌握")
    .slice(0, 3);

  return (
    <section className={`${styles.card} ${styles.continue}`} style={{ "--i": 0 }}>
      <div className={styles.continueHead}>
        <h2 className={styles.cardLabel}>接着学</h2>
        <span className={styles.chapterLabel}>{chapter.title}</span>
      </div>

      <div className={styles.continueMain}>
        <div className={styles.continueText}>
          <p className={styles.kpLine}>
            <span className={styles.kpCode}>{kpCode(nextKp.id)}</span>
            <span className={styles.kpTitle}><CourseText>{nextKp.title}</CourseText></span>
            {nextKp.weight && <WeightTag weight={nextKp.weight} />}
          </p>
          <p className={styles.kpMeta}>
            {hits > 0 ? `${subject !== "physics" ? "统计的" : "10 套"}中考卷里考了 ${hits} 次` : `${subject !== "physics" ? "统计的" : "10 套"}中考卷里没有直接考到`}
          </p>
        </div>
        <Link className={styles.primaryButton} href={`/physics/kp/${nextKp.id}/`}>
          继续
          <span className={styles.buttonArrow}>
            <ArrowRight />
          </span>
        </Link>
      </div>

      <div className={styles.segmentsBlock}>
        <ol className={styles.segments} aria-label={`${chapter.title}的知识点进度`}>
          {chapterKps.map((id, i) => {
            const status = statuses[id] || "未开始";
            const isCurrent = id === nextKp.id;
            return (
              <li key={id} style={{ "--s": i }}>
                <Link
                  aria-label={`${kpCode(id)} ${kpIndex[id]?.title}：${isCurrent ? "正在学" : status}`}
                  className={`${styles.segment} ${styles[STATUS_CLASS[status]]} ${
                    isCurrent ? styles.current : ""
                  }`}
                  href={`/physics/kp/${id}/`}
                  title={`${kpCode(id)} ${kpIndex[id]?.title}`}
                >
                  <span />
                </Link>
              </li>
            );
          })}
        </ol>
        <p className={styles.segmentsCaption}>
          本章 {doneCount} / {chapterKps.length} 个知识点
          <span className={styles.legend}>
            <i className={styles.legendDone} /> 学完
            <i className={styles.legendCurrent} /> 正在学
            <i className={styles.legendTodo} /> 未开始
          </span>
        </p>
      </div>

      {upcoming.length > 0 && (
        <ul className={`${styles.upcoming} isl-rule-top isl-rows`}>
          {upcoming.map((id) => (
            <li key={id}>
              <Link href={`/physics/kp/${id}/`}>
                <span className={styles.kpCode}>{kpCode(id)}</span>
                <span className={styles.upcomingTitle}><CourseText>{kpIndex[id]?.title}</CourseText></span>
                {kpIndex[id]?.weight === "重点" && <WeightTag weight="重点" />}
                <span className={styles.rowArrow}>
                  <ArrowRight size={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- 错题 ---------- */

function MistakesCard({ mistakes, kpIndex }) {
  const { subject } = useCourseStudy();
  const count = useCountUp(mistakes.length);
  const shown = mistakes.slice(0, 3);

  return (
    <section className={`${styles.card} ${styles.mistakes}`} style={{ "--i": 1 }}>
      <div className={styles.mistakesHead}>
        <h2 className={styles.cardLabel}>错题待复习</h2>
        <strong className={mistakes.length ? styles.mistakeCount : styles.mistakeCountZero}>
          {count}
        </strong>
      </div>

      {shown.length > 0 ? (
        <ul className={styles.mistakeList}>
          {shown.map((m) => (
            <li key={`${m.questionId}:${m.part || ""}`}>
              <span className={styles.kpCode}>{kpCode(m.kpId)}</span>
              <span className={styles.mistakeTitle}><CourseText>{kpIndex[m.kpId]?.title || m.kpId}</CourseText></span>
              <span className={styles.errorTag}>{m.errorTag}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.emptyNote}>
          <span className={styles.emptyCheck}>
            <CheckMark />
          </span>
          没有要复习的错题。做错的题会自动收进来。
        </p>
      )}

      <Link className={styles.textLink} href={`/mistakes/#${subject}`}>
        {mistakes.length > 3 ? `查看全部 ${mistakes.length} 道` : "去错题本"}
        <ArrowRight size={14} />
      </Link>
    </section>
  );
}

function OverallCard({ totals }) {
  const done = useCountUp(totals.done);
  const donePct = totals.opened ? (totals.done / totals.opened) * 100 : 0;
  const masteredPct = totals.opened ? (totals.mastered / totals.opened) * 100 : 0;

  return (
    <section className={`${styles.card} ${styles.overall}`} style={{ "--i": 2 }}>
      <h2 className={styles.cardLabel}>已开放的知识点</h2>
      <p className={styles.overallNumber}>
        <strong>{done}</strong>
        <span>/ {totals.opened} 学完</span>
        <span className={styles.overallMastered}>其中 {totals.mastered} 个已掌握</span>
      </p>
      <div className={styles.stackBar} aria-hidden="true">
        <span className={styles.stackDone} style={{ "--w": `${donePct}%` }} />
        <span className={styles.stackMastered} style={{ "--w": `${masteredPct}%` }} />
      </div>
    </section>
  );
}

/* ---------- 章节目录（按考频） ---------- */

function ChapterIndex({
  chapters,
  chapterProgress,
  currentChapterId,
  sortMode,
  setSortMode,
  onOpen,
  openChapterId,
}) {
  const { subject } = useCourseStudy();
  const mathBook = useMathBook();
  const books = (subject === "math" ? MATH_BOOKS : BOOKS)
    .filter((b) => chapters.some((c) => c.book === b.key))
    .filter((b) => subject !== "math" || mathBook === "all" || mathBook === b.key);
  const sectionRef = useRef(null);
  const rowRefs = useRef(new Map());
  const firstRects = useRef(null);
  const [inView, setInView] = useState(false);

  const maxHits = Math.max(1, ...chapters.map((c) => c.examHits));
  const topIds = useMemo(
    () =>
      new Set(
        [...chapters]
          .sort((a, b) => b.examHits - a.examHits)
          .slice(0, TOP_CHAPTERS)
          .map((c) => c.id),
      ),
    [chapters],
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 切换排序时，行从旧位置平滑移到新位置
  const changeSort = (mode) => {
    if (mode === sortMode) return;
    const rects = new Map();
    rowRefs.current.forEach((el, id) => {
      if (el) rects.set(id, el.getBoundingClientRect());
    });
    firstRects.current = rects;
    setSortMode(mode);
  };

  useLayoutEffect(() => {
    const rects = firstRects.current;
    if (!rects) return;
    firstRects.current = null;
    if (prefersReducedMotion()) return;
    rowRefs.current.forEach((el, id) => {
      const first = rects.get(id);
      if (!el || !first) return;
      const last = el.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (!dx && !dy) return;
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
        { duration: 420, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
      );
    });
  }, [sortMode]);

  return (
    <section
      className={styles.index}
      data-inview={inView ? "true" : "false"}
      ref={sectionRef}
      style={{ "--i": 3 }}
    >
      <div className={styles.indexHead}>
        <div>
          <Title as="h2" className={styles.indexTitle} tone="orange" variant="layer">全部章节</Title>
          <p className={styles.indexNote}>
            条长是 2022–2025 年{subject !== "physics" ? "统计的" : " 10 套"}中考卷里本章被考到的次数（按知识点计），
            <span className={styles.noteKey}>红色</span>是考得最多的 {Math.min(TOP_CHAPTERS, chapters.length)} 章。点一章看它的知识点。
          </p>
          {subject === "math" && (
            <div className={styles.bookChips}>
              <MathBookChips books={MATH_BOOKS.filter((b) => chapters.some((c) => c.book === b.key))} />
            </div>
          )}
        </div>
        <div className={styles.sortSwitch} role="group" aria-label="章节排序">
          {[
            ["book", "课本顺序"],
            ["hits", "按考频"],
          ].map(([mode, label]) => (
            <button
              aria-pressed={sortMode === mode}
              className={sortMode === mode ? styles.sortActive : ""}
              key={mode}
              onClick={() => changeSort(mode)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.books}>
        {books.map((book) => {
          let list = chapters.filter((c) => c.book === book.key);
          if (sortMode === "hits") list = [...list].sort((a, b) => b.examHits - a.examHits);
          return (
            <div className={styles.book} key={book.key}>
              <h3 className={styles.bookTitle}>{book.title}</h3>
              <ol className={styles.rows}>
                {list.map((ch) => {
                  const order = chapters.indexOf(ch);
                  const progress = chapterProgress[ch.id];
                  const classes = [
                    styles.row,
                    ch.available ? styles.rowOpen : styles.rowClosed,
                    ch.id === currentChapterId ? styles.rowCurrent : "",
                    ch.id === openChapterId ? styles.rowSelected : "",
                  ].join(" ");
                  return (
                    <li
                      key={ch.id}
                      ref={(el) => {
                        if (el) rowRefs.current.set(ch.id, el);
                        else rowRefs.current.delete(ch.id);
                      }}
                    >
                      <button
                        aria-haspopup="dialog"
                        className={classes}
                        onClick={() => onOpen(ch.id)}
                        style={{ "--r": order }}
                        title={`${ch.title}，中考卷里考了 ${ch.examHits} 次`}
                        type="button"
                      >
                        <span className={styles.rowNum}>第{chapterNumber(ch.id)}{subject === "chemistry" ? "单元" : "章"}</span>
                        <span className={styles.rowName}>{chapterName(ch.title)}</span>
                        <span className={styles.rowState}>
                          {progress && progress.done > 0 ? (
                            `${progress.done}/${progress.total}`
                          ) : progress ? (
                            <i className={styles.openDot} title="已开放" />
                          ) : null}
                          {progress && <span className={styles.visuallyHidden}>已开放</span>}
                        </span>
                        <span className={styles.bar} aria-hidden="true">
                          <span
                            className={topIds.has(ch.id) ? styles.barTop : styles.barFill}
                            style={{ "--w": ch.examHits / maxHits }}
                          />
                        </span>
                        <span className={styles.rowHits}>
                          {ch.examHits}
                          <span className={styles.visuallyHidden}> 次</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- 章节抽屉 ---------- */

function ChapterDrawer({ chapter, kpIndex, statuses, onClose }) {
  const [shown, setShown] = useState(null);
  const [closing, setClosing] = useState(false);
  const closeRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (chapter) {
      returnFocusRef.current = document.activeElement;
      setShown(chapter);
      setClosing(false);
    } else if (shown) {
      setClosing(true);
      const timer = setTimeout(
        () => {
          setShown(null);
          setClosing(false);
          returnFocusRef.current?.focus?.();
        },
        prefersReducedMotion() ? 0 : 220,
      );
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter]);

  useEffect(() => {
    if (!chapter) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [chapter, onClose]);

  if (!shown) return null;

  const kps = shown.kpIds.map((id) => ({ id, ...kpIndex[id] }));
  const keyCount = kps.filter((k) => k.weight === "重点").length;
  const maxKpHits = Math.max(1, ...kps.map((k) => k.examHits || 0));
  const sections = [];
  for (const kp of kps) {
    const last = sections[sections.length - 1];
    if (last && last.title === kp.sectionTitle) last.kps.push(kp);
    else sections.push({ title: kp.sectionTitle, kps: [kp] });
  }

  return (
    <div className={`${styles.drawerLayer} ${closing ? styles.drawerClosing : ""}`}>
      <div className={styles.backdrop} onClick={onClose} />
      <aside
        aria-labelledby="chapter-drawer-title"
        aria-modal="true"
        className={styles.drawer}
        role="dialog"
      >
        <div className={styles.drawerHead}>
          <div>
            <h2 className={styles.drawerTitle} id="chapter-drawer-title">
              {shown.title}
            </h2>
            <p className={styles.drawerMeta}>
              {kps.length} 个知识点 · {keyCount} 个重点 · 中考卷里考了 {shown.examHits} 次
            </p>
          </div>
          <button
            aria-label="关闭"
            className={styles.closeButton}
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <Close />
          </button>
        </div>

        <div className={styles.drawerBody}>
          {sections.map((sec) => (
            <div className={styles.drawerSection} key={sec.title}>
              <h3 className={styles.drawerSectionTitle}>{sec.title}</h3>
              <ul className={styles.kpRows}>
                {sec.kps.map((kp) => {
                  const status = statuses[kp.id];
                  const done = status === "已完成" || status === "已掌握";
                  const content = (
                    <>
                      <span
                        className={`${styles.weightMark} ${
                          kp.weight === "重点"
                            ? styles.weightKey
                            : kp.weight === "一般"
                              ? styles.weightNormal
                              : styles.weightLight
                        }`}
                        title={kp.weight}
                      />
                      <span className={styles.kpCode}>{kpCode(kp.id)}</span>
                      <span className={styles.kpRowTitle}>
                        <CourseText>{kp.title}</CourseText>
                        <span className={styles.visuallyHidden}>（{kp.weight}）</span>
                      </span>
                      <span className={styles.kpHits} title={`考了 ${kp.examHits} 次`}>
                        <span className={styles.kpHitsBar}>
                          <span style={{ "--w": (kp.examHits || 0) / maxKpHits }} />
                        </span>
                        {kp.examHits || 0}
                      </span>
                      <span className={styles.kpStatus}>
                        {done && (
                          <span
                            className={status === "已掌握" ? styles.statusMastered : styles.statusDone}
                            title={status}
                          >
                            <CheckMark size={13} />
                          </span>
                        )}
                      </span>
                    </>
                  );
                  return (
                    <li key={kp.id}>
                      {kp.available ? (
                        <Link className={styles.kpRow} href={`/physics/kp/${kp.id}/`}>
                          {content}
                        </Link>
                      ) : (
                        <div className={`${styles.kpRow} ${styles.kpRowClosed}`}>{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <p className={styles.drawerLegend}>
            <i className={styles.weightKey} /> 重点
            <i className={styles.weightNormal} /> 一般
            <i className={styles.weightLight} /> 了解
            <span>右侧数字是中考卷里考到的次数</span>
          </p>
        </div>

        <div className={styles.drawerFoot}>
          {shown.available ? (
            <Link className={styles.primaryButton} href={`/physics/chapter/${shown.id}/`}>
              进入本章
              <span className={styles.buttonArrow}>
                <ArrowRight />
              </span>
            </Link>
          ) : (
            <p className={styles.drawerPending}>本章讲义还在编写，可以先按课本预习。</p>
          )}
        </div>
      </aside>
    </div>
  );
}
