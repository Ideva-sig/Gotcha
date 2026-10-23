"use client";

import Link from "@/components/CourseLink";
import { useCourseStudy } from "@/components/CourseSubject";
import { mathQuestionParts } from "@/lib/mathWidgets";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheerToast, pickLine, SpeechBubble } from "@/components/Character";
import { CourseMarkdown, CourseText } from "@/components/CourseMarkdown";
import { ArrowLeft, ArrowRight, Check, Chevron } from "@/components/LineIcons";
import { Icon } from "@/components/Icon";
import { QuestionCard, questionForPart, Reveal } from "@/components/PhysicsExercisePanel";
import { ERROR_TAGS, resolvePhysicsTarget } from "@/lib/courseV3Client";
import { Title } from "@/components/island/Island";
import { ERROR_TONE, ErrorTag } from "@/components/island/KpTags";
import { PrereqTrace } from "./PrereqTrace";
import styles from "./mistakes.module.css";

const MISTAKES_V1_KEY = "study-mistakes-v1";

function shortCode(kpId) {
  const parts = kpId.split("-");
  return `${Number(parts[parts.length - 2])}-${parts[parts.length - 1]}`;
}

const keyOf = (m) => `${m.questionId}:${m.part || ""}`;

// 做错过、但最近一次已经做对的题：错题本里“已经改对”的数量
function countFixed(data) {
  const latest = new Map();
  const everWrong = new Set();
  for (const a of data.attempts) {
    const key = `${a.questionId}:${a.part || ""}`;
    latest.set(key, a);
    if (!a.isCorrect) everWrong.add(key);
  }
  let n = 0;
  for (const key of everWrong) if (latest.get(key)?.isCorrect) n += 1;
  return n;
}

// embedded：放在统一错题本的标签页里，外层的 <main> 和备份面板由统一页面提供
export function PhysicsMistakesView({
  questionsMap = {},
  kpTitles = {},
  lines = {},
  avatars = {},
  embedded = false,
  backupOpen = false,
  onToggleBackup,
  backupSlot = null,
  prereqGraph = null,
}) {
  const { loadCourseV3Data, subscribeCourseV3, getActiveMistakes, subject, label } = useCourseStudy();
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState([]);
  const [fixedTotal, setFixedTotal] = useState(0);
  const [v1Mistakes, setV1Mistakes] = useState([]);
  const [tag, setTag] = useState("all");
  const [mode, setMode] = useState("review");
  const [session, setSession] = useState(null); // { items, start, round }
  const [notice, setNotice] = useState("");
  const [topLine, setTopLine] = useState(null);

  const loadAll = useCallback(() => {
    setActive(getActiveMistakes(questionsMap).filter((m) => m.question));
    try {
      setFixedTotal(countFixed(loadCourseV3Data()));
      const rawV1 = subject !== "physics" ? [] : JSON.parse(localStorage.getItem(MISTAKES_V1_KEY) || "[]");
      setV1Mistakes(
        (rawV1 || []).filter(
          (m) =>
            m.subject === "physics" ||
            m.topicBasePath?.startsWith("/physics") ||
            m.topicId?.startsWith("physics-"),
        ),
      );
    } catch (_) {
      setV1Mistakes([]);
    }
  }, [questionsMap]);

  useEffect(() => {
    loadAll();
    const frame = requestAnimationFrame(() => setReady(true));
    const unsubscribe = subscribeCourseV3(loadAll);
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, [loadAll]);

  const filtered = useMemo(
    () => (tag === "all" ? active : active.filter((m) => m.errorTag === tag)),
    [active, tag],
  );

  // 页顶台词：有错题和没错题各一套，进页面时抽一句
  const hasMistakes = active.length > 0;
  useEffect(() => {
    if (!ready) return;
    setTopLine(pickLine(hasMistakes ? lines.review : lines.empty));
  }, [ready, hasMistakes, lines]);

  // 一轮复习的题目在开始时定下来，做对了也不会从眼前消失
  const startSession = (items, start = 0) => {
    setSession({ items, start, round: (session?.round || 0) + 1 });
    setMode("review");
  };

  useEffect(() => {
    if (!ready) return;
    if (!session && filtered.length > 0) setSession({ items: filtered, start: 0, round: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, filtered.length]);

  const changeTag = (next) => {
    setTag(next);
    const items = next === "all" ? active : active.filter((m) => m.errorTag === next);
    setSession(items.length ? { items, start: 0, round: (session?.round || 0) + 1 } : null);
  };

  const page = (
        <div className={styles.page} data-ready={ready ? "true" : "false"}>
          <header className={styles.head}>
            <div>
              <Title as="h1" className={styles.title} tone="red">错题本</Title>
              <p className={styles.stats}>
                <span className={hasMistakes ? styles.statWrong : styles.statZero}>
                  <strong>{active.length}</strong> 道要再练
                </span>
                <span className={styles.statFixed}>
                  已经改对 <strong>{fixedTotal}</strong> 道
                </span>
              </p>
            </div>
            <div className={styles.tools}>
              <button
                className={styles.tool}
                onClick={() => setNotice("拍照记纸上错题还在准备中。")}
                type="button"
              >
                拍照记纸上错题
              </button>
              <button
                aria-expanded={backupOpen}
                className={styles.tool}
                onClick={onToggleBackup}
                type="button"
              >
                备份与恢复
                <Chevron className={styles.toolChevron} size={14} />
              </button>
            </div>
          </header>

          <Reveal open={backupOpen}>{backupSlot}</Reveal>

          {notice && (
            <p className={styles.notice} role="status">
              {notice}
            </p>
          )}

          {topLine && (
            <SpeechBubble
              avatars={avatars}
              className={styles.topLine}
              line={topLine}
              onNext={
                (hasMistakes ? lines.review : lines.empty)?.length > 1
                  ? () => {
                      const pool = (hasMistakes ? lines.review : lines.empty).filter(
                        (l) => l !== topLine,
                      );
                      setTopLine(pickLine(pool));
                    }
                  : undefined
              }
            />
          )}

          {hasMistakes ? (
            <>
              <div className={styles.controls}>
                <div aria-label="显示方式" className={styles.segmented} role="group">
                  <button aria-pressed={mode === "review"} onClick={() => setMode("review")} type="button">
                    一道一道练
                  </button>
                  <button aria-pressed={mode === "list"} onClick={() => setMode("list")} type="button">
                    全部列表
                  </button>
                </div>
                <div aria-label="按错因筛选" className={styles.tags} role="group">
                  <button aria-pressed={tag === "all"} onClick={() => changeTag("all")} type="button">
                    全部 <span>{active.length}</span>
                  </button>
                  {ERROR_TAGS.map((t) => {
                    const n = active.filter((m) => m.errorTag === t).length;
                    return (
                      <button
                        aria-pressed={tag === t}
                        className={`tone-${ERROR_TONE[t]}`}
                        disabled={n === 0}
                        key={t}
                        onClick={() => changeTag(t)}
                        type="button"
                      >
                        {t} <span>{n}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {mode === "review" && session ? (
                <ReviewSession
                  avatars={avatars}
                  key={session.round}
                  kpTitles={kpTitles}
                  lines={lines}
                  onList={() => setMode("list")}
                  onRestart={(items) => startSession(items)}
                  prereqGraph={prereqGraph}
                  questionsMap={questionsMap}
                  session={session}
                  stillActive={active}
                />
              ) : (
                <MistakeList
                  items={filtered}
                  kpTitles={kpTitles}
                  onReview={(i) => startSession(filtered, i)}
                />
              )}
            </>
          ) : (
            ready && (
              <div className={styles.empty}>
                <Icon name="smile" size={40} />
                <p>做错的题会自动收进这里，按错因分好类，还能直接重做。</p>
                <Link className={styles.primary} href="/physics/">
                  回首页接着学
                  <ArrowRight size={14} />
                </Link>
              </div>
            )
          )}

          {v1Mistakes.length > 0 && (
            <details className={styles.archive}>
              <summary>
                暑假旧版物理错题（{v1Mistakes.length} 条，单独保留，不混进新版）
                <Chevron className={styles.archiveChevron} size={14} />
              </summary>
              <ul className={styles.archiveList}>
                {v1Mistakes.map((m, i) => (
                  <li key={i}>
                    <p className={styles.archiveTitle}>
                      <strong>{m.topicTitle}</strong>
                      {m.chapter && <span>{m.chapter}</span>}
                      {m.errorCount > 1 && <span>错过 {m.errorCount} 次</span>}
                    </p>
                    {m.prompt && <CourseMarkdown content={m.prompt} />}
                    {m.formula && <CourseMarkdown content={`$$${m.formula}$$`} />}
                    {m.answer && (
                      <p className={styles.archiveAnswer}>
                        参考答案：<CourseMarkdown content={m.answer} inline />
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
  );
  if (embedded) return page;
  return (
    <main className="page-main">
      <div className="page-container">{page}</div>
    </main>
  );
}

/* ---------- 一道一道练 ---------- */

function ReviewSession({ session, kpTitles, lines, avatars, stillActive, onRestart, onList, prereqGraph, questionsMap }) {
  const { items } = session;
  const [index, setIndex] = useState(Math.min(session.start, items.length - 1));
  const [dir, setDir] = useState(0);
  const [results, setResults] = useState({});
  const [cheer, setCheer] = useState(null);
  const [traceOpen, setTraceOpen] = useState(false); // 回溯区展开时，滑动和方向键不切题
  const touch = useRef(null);

  const done = index >= items.length;
  const item = items[index];

  const go = useCallback(
    (next) => {
      if (next < 0 || next > items.length) return;
      setDir(next > index ? 1 : -1);
      setTraceOpen(false);
      setIndex(next);
    },
    [index, items.length],
  );

  // 键盘左右键切题（在输入框里时不切）
  useEffect(() => {
    const onKey = (e) => {
      if (traceOpen || e.target.closest?.("input, textarea, select")) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, traceOpen]);

  // iPad 上左右滑动切题
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse") return;
    touch.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    const start = touch.current;
    touch.current = null;
    if (!start || traceOpen) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
  };

  const onResult = (key) => (isCorrect) => {
    setResults((r) => ({ ...r, [key]: isCorrect ? "fixed" : "wrong" }));
    if (isCorrect) setCheer({ line: pickLine(lines.fixed), at: Date.now() });
  };

  const fixedCount = Object.values(results).filter((v) => v === "fixed").length;
  const remaining = items.filter((m) => stillActive.some((a) => keyOf(a) === keyOf(m)));
  const clearCheer = useCallback(() => setCheer(null), []);

  return (
    <section aria-label="一道一道练" className={styles.review}>
      <div className={styles.progress}>
        <ol className={styles.progressBar}>
          {items.map((m, i) => {
            const r = results[keyOf(m)];
            return (
              <li key={keyOf(m)}>
                <button
                  aria-current={i === index ? "step" : undefined}
                  aria-label={`第 ${i + 1} 道${r === "fixed" ? "，已改对" : r === "wrong" ? "，还没对" : ""}`}
                  data-result={r || "todo"}
                  onClick={() => go(i)}
                  type="button"
                >
                  <span />
                </button>
              </li>
            );
          })}
        </ol>
        <span className={styles.progressText}>
          {done ? "这一轮做完了" : `第 ${index + 1} / ${items.length} 道`}
          {fixedCount > 0 && <em>改对 {fixedCount}</em>}
        </span>
      </div>

      <div className={styles.stage} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        {done ? (
          <RoundSummary
            avatars={avatars}
            fixed={fixedCount}
            line={pickLine(lines.done)}
            onList={onList}
            onRestart={() => onRestart(remaining)}
            remaining={remaining.length}
            total={items.length}
          />
        ) : (
          <MistakeCard
            dir={dir}
            item={item}
            key={`${keyOf(item)}-${index}`}
            kpTitles={kpTitles}
            onResult={onResult(keyOf(item))}
            onTraceOpenChange={setTraceOpen}
            prereqGraph={prereqGraph}
            questionsMap={questionsMap}
            result={results[keyOf(item)]}
          />
        )}
      </div>

      {!done && (
        <nav aria-label="切换题目" className={styles.pager}>
          <button disabled={index === 0} onClick={() => go(index - 1)} type="button">
            <ArrowLeft size={14} /> 上一道
          </button>
          <span className={styles.swipeHint}>左右滑动也能切换</span>
          <button
            className={results[keyOf(item)] ? styles.primary : undefined}
            onClick={() => go(index + 1)}
            type="button"
          >
            {index === items.length - 1 ? "做完这一轮" : "下一道"} <ArrowRight size={14} />
          </button>
        </nav>
      )}

      {cheer?.line && (
        <CheerToast avatars={avatars} duration={3500} key={cheer.at} line={cheer.line} onClose={clearCheer} />
      )}
    </section>
  );
}

function MistakeCard({ item, kpTitles, onResult, result, dir, prereqGraph, questionsMap, onTraceOpenChange }) {
  const { resolvePhysicsTarget, subject } = useCourseStudy();
  const [traceOpen, setTraceOpen] = useState(false);
  const [traceStarted, setTraceStarted] = useState(false);
  const q = item.part ? questionForPart(item.question, mathQuestionParts(item.question).find((p) => String(p.part) === item.part) || { part: item.part }) : item.question;
  const review = q.review?.find((r) => r.tag === item.errorTag) || q.review?.[0];
  const target = review?.target ? resolvePhysicsTarget(review.target) : null;
  const last = item.latestAttempt;
  // 只有数学、错因是“前置”、知识点在图里时，才给“往前找找”
  const canTrace = subject === "math" && !!prereqGraph?.[item.kpId] && item.errorTag === "前置";
  const reviewTarget = q.review?.find((r) => r.tag === "前置")?.target || null;
  const toggleTrace = () => {
    const next = !traceOpen;
    setTraceOpen(next);
    if (next) setTraceStarted(true);
    onTraceOpenChange?.(next);
  };

  return (
    <article className={styles.card} data-dir={dir} data-result={result || "todo"}>
      <header className={styles.cardHead}>
        <Link className={styles.kpTag} href={`/physics/kp/${item.kpId}/`}>
          {shortCode(item.kpId)} <CourseText>{kpTitles[item.kpId]}</CourseText>
        </Link>
        <ErrorTag tag={item.errorTag}>错因：{item.errorTag}</ErrorTag>
        {item.errorCount > 1 && <span className={styles.errCount}>错过 {item.errorCount} 次</span>}
        {result === "fixed" && (
          <span className={styles.fixedBadge}>
            <Icon name="thumbs-up" size={18} /> 改对了
          </span>
        )}
      </header>
      <p className={styles.cardMeta}>
        {q.source}
        {last?.dateString && <span>上次做错：{last.dateString.slice(5)}</span>}
      </p>

      <QuestionCard
        chapterId={item.chapterId}
        part={item.part}
        fresh
        hideSource
        kpId={item.kpId}
        onResult={onResult}
        qRef={{ id: item.questionId }}
        question={q}
      />

      {target && (
        <p className={styles.hint}>
          没把握？先回看
          {target.type === "kp" ? (
            <Link href={target.href}>
              <CourseText>{target.text}</CourseText> <ArrowRight size={12} />
            </Link>
          ) : (
            <strong><CourseText>{target.text}</CourseText></strong>
          )}
        </p>
      )}

      {canTrace && (
        <div className={styles.traceBlock}>
          <button
            aria-expanded={traceOpen}
            className="island-btn"
            onClick={toggleTrace}
            type="button"
          >
            {traceOpen ? "收起" : "往前找找哪一步没跟上"}
          </button>
          <Reveal open={traceOpen}>
            {traceStarted && (
              <PrereqTrace
                graph={prereqGraph}
                questionsMap={questionsMap}
                reviewTarget={reviewTarget}
                startKp={item.kpId}
              />
            )}
          </Reveal>
        </div>
      )}
    </article>
  );
}

function RoundSummary({ total, fixed, remaining, line, avatars, onRestart, onList }) {
  const [shownLine] = useState(line);
  return (
    <div className={styles.summary}>
      <p className={styles.summaryNumber}>
        <strong>{fixed}</strong>
        <span>/ {total}</span>
      </p>
      <p className={styles.summaryText}>
        {fixed === total
          ? "这一轮全部改对了！"
          : `这一轮改对了 ${fixed} 道，还有 ${remaining} 道要再练。`}
      </p>
      {shownLine && <SpeechBubble avatars={avatars} cheer={fixed > 0} line={shownLine} />}
      <div className={styles.summaryActions}>
        {remaining > 0 && (
          <button className={styles.primary} onClick={onRestart} type="button">
            再来一轮（{remaining} 道）
          </button>
        )}
        <button className={styles.tool} onClick={onList} type="button">
          看全部列表
        </button>
      </div>
    </div>
  );
}

/* ---------- 全部列表 ---------- */

function MistakeList({ items, kpTitles, onReview }) {
  if (items.length === 0) {
    return <p className={styles.listEmpty}>这个错因下没有错题。</p>;
  }
  return (
    <ul className={styles.list}>
      {items.map((m, i) => (
        <li key={keyOf(m)} style={{ "--i": i }}>
          <button className={styles.row} onClick={() => onReview(i)} type="button">
            <span className={styles.rowKp}>
              <span className={styles.rowCode}>{shortCode(m.kpId)}</span>
              <CourseText>{kpTitles[m.kpId]}</CourseText>
            </span>
            <span className={styles.rowStem}>
              <CourseMarkdown
                content={
                  (Array.isArray(m.question.stem)
                    ? m.question.stem.find((b) => b.type === "md")?.text
                    : String(m.question.stem || "")) || ""
                }
                inline
              />
            </span>
            <span className={styles.rowMeta}>
              <ErrorTag tag={m.errorTag} />
              {m.errorCount > 1 && <span>错 {m.errorCount} 次</span>}
              <span className={styles.rowGo}>
                重做 <ArrowRight size={12} />
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
