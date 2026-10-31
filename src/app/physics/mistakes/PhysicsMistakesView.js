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
import { REVIEW_GAPS } from "@/lib/reviewSchedule";
import { Collapse, Title } from "@/components/island/Island";
import { ERROR_TONE, ErrorTag } from "@/components/island/KpTags";
import { PrereqTrace } from "./PrereqTrace";
import styles from "./mistakes.module.css";

const MISTAKES_V1_KEY = "study-mistakes-v1";

function shortCode(kpId) {
  const parts = kpId.split("-");
  return `${Number(parts[parts.length - 2])}-${parts[parts.length - 1]}`;
}

const keyOf = (m) => `${m.questionId}:${m.part || ""}`;

const EMPTY_QUEUE = { wrong: [], due: [], waiting: [], mastered: [] };

// 复习日期：明天、后天直接说，再远写几月几日
function dayLabel(dayMs) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((dayMs - today.getTime()) / 86_400_000);
  if (diff <= 0) return "今天";
  if (diff === 1) return "明天";
  if (diff === 2) return "后天";
  const d = new Date(dayMs);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// 这次做对之后怎样：改对了明天再考；按时复习做对了排下一次，第三次就掌握了
function nextStepText(item) {
  if (item.status !== "due") return `改对了 · 明天再考`;
  const streak = (item.streak || 0) + 1;
  return streak >= REVIEW_GAPS.length ? "又做对了 · 掌握了" : `又做对了 · ${REVIEW_GAPS[streak]} 天后再考`;
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
  const { subscribeCourseV3, getReviewQueue, regradeChoiceAttempts, getOrphanMistakes, subject, label } = useCourseStudy();
  const [ready, setReady] = useState(false);
  const [queue, setQueue] = useState(EMPTY_QUEUE);
  const [orphans, setOrphans] = useState([]);
  const [v1Mistakes, setV1Mistakes] = useState([]);
  const [tag, setTag] = useState("all");
  const [mode, setMode] = useState("review");
  const [session, setSession] = useState(null); // { items, start, round }
  const [notice, setNotice] = useState("");
  const [topLine, setTopLine] = useState(null);

  const loadAll = useCallback(() => {
    regradeChoiceAttempts(questionsMap);
    const q = getReviewQueue(questionsMap);
    const has = (m) => m.question;
    setQueue({ wrong: q.wrong.filter(has), due: q.due.filter(has), waiting: q.waiting.filter(has), mastered: q.mastered });
    setOrphans(getOrphanMistakes(questionsMap));
    try {
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

  // 今天要做的：要再练的错题 + 到了复习日的题
  const active = useMemo(() => [...queue.wrong, ...queue.due], [queue]);
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
                <span className={queue.wrong.length ? styles.statWrong : styles.statZero}>
                  <strong>{queue.wrong.length}</strong> 道要再练
                </span>
                <span className={queue.due.length ? styles.statDue : styles.statZero}>
                  今天复习 <strong>{queue.due.length}</strong> 道
                </span>
                {queue.waiting.length > 0 && (
                  <span>
                    <strong>{queue.waiting.length}</strong> 道过几天再考
                  </span>
                )}
                <span className={styles.statFixed}>
                  已掌握 <strong>{queue.mastered.length}</strong> 道
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
                {queue.waiting.length > 0 ? (
                  <p>
                    今天的题都做完了。下一次复习在{dayLabel(queue.waiting[0].dueDay)}，
                    {queue.waiting.filter((m) => m.dueDay === queue.waiting[0].dueDay).length} 道。
                  </p>
                ) : (
                  <p>做错的题会自动收进这里，按错因分好类，还能直接重做。改对以后隔几天再考，连对三次才算掌握。</p>
                )}
                <Link className={styles.primary} href="/physics/">
                  回首页接着学
                  <ArrowRight size={14} />
                </Link>
              </div>
            )
          )}

          {queue.waiting.length > 0 && (
            <Collapse className={styles.archive} title={`过几天再考的 ${queue.waiting.length} 道`}>
              <p className={styles.orphanNote}>
                改对的题隔 1 天、3 天、7 天各考一次，三次都对就算掌握。没到日子提前做对不算数。
              </p>
              <ul className={`${styles.archiveList} isl-rows`}>
                {queue.waiting.map((m) => (
                  <li key={keyOf(m)}>
                    <p className={styles.archiveTitle}>
                      <strong>{dayLabel(m.dueDay)}</strong>
                      <span>
                        {shortCode(m.kpId)} <CourseText>{kpTitles[m.kpId]}</CourseText>
                      </span>
                      <span>已按时做对 {m.streak} / {REVIEW_GAPS.length} 次</span>
                    </p>
                  </li>
                ))}
              </ul>
            </Collapse>
          )}

          {v1Mistakes.length > 0 && (
            <Collapse
              className={styles.archive}
              title={`暑假旧版物理错题（${v1Mistakes.length} 条，单独保留，不混进新版）`}
            >
              <ul className={`${styles.archiveList} isl-rows`}>
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
            </Collapse>
          )}

          {orphans.length > 0 && (
            <Collapse
              className={styles.archive}
              title={`还有 ${orphans.length} 道错题暂时打不开（题目改过或删掉了）`}
            >
              <p className={styles.orphanNote}>
                做错的记录还在，没有丢。等题目找回来，它们会自动回到上面的列表。
              </p>
              <ul className={`${styles.archiveList} isl-rows`}>
                {orphans.map((m) => (
                  <li key={m.questionId}>
                    <p className={styles.archiveTitle}>
                      <strong>{kpTitles[m.kpId] || m.kpId}</strong>
                      <span>题目编号 {m.questionId}</span>
                      {m.count > 1 && <span>{m.count} 个小问</span>}
                    </p>
                  </li>
                ))}
              </ul>
            </Collapse>
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
                  aria-label={`第 ${i + 1} 道${r === "fixed" ? "，做对了" : r === "wrong" ? "，还没对" : ""}`}
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
          {fixedCount > 0 && <em>做对 {fixedCount}</em>}
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
  const last = item.lastWrong || item.latestAttempt;
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
        {item.status === "due" && (
          <span className={styles.errCount}>第 {(item.streak || 0) + 1} 次复习</span>
        )}
        {item.errorCount > 1 && <span className={styles.errCount}>错过 {item.errorCount} 次</span>}
        {result === "fixed" && (
          <span className={styles.fixedBadge}>
            <Icon name="thumbs-up" size={18} /> {nextStepText(item)}
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
          ? "这一轮全部做对了！"
          : `这一轮做对了 ${fixed} 道，还有 ${remaining} 道要再练。`}
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
    <ul className={`${styles.list} isl-rows`}>
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
                {m.status === "due" ? "复习" : "重做"} <ArrowRight size={12} />
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
