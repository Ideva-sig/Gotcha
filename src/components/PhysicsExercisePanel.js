"use client";

import Link from "./CourseLink";
import { useCourseStudy } from "./CourseSubject";
import { useEffect, useRef, useState } from "react";
import { CourseMarkdown, CourseText } from "./CourseMarkdown";
import { CourseFigure } from "./CourseFigure";
import { mathQuestionParts } from "@/lib/mathWidgets";
import { ArrowRight, Check, Chevron, Cross } from "./LineIcons";
import { ERROR_TONE } from "./island/KpTags";
import { ERROR_TAGS, resolvePhysicsTarget } from "@/lib/courseV3Client";
import { getLatestAttempt, recordAttempt } from "@/lib/studyData";
import styles from "./PhysicsExercisePanel.module.css";

// 展开 / 收起：高度从 0 平滑过渡（grid 行高 0fr → 1fr）
export function Reveal({ open, children, className = "", animate = true }) {
  return (
    <div
      className={`${styles.reveal} ${className}`}
      data-animate={animate ? "true" : "false"}
      data-open={open ? "true" : "false"}
    >
      <div className={styles.revealInner} inert={!open}>
        {children}
      </div>
    </div>
  );
}

function StemBlocks({ stem }) {
  if (!Array.isArray(stem)) return <CourseMarkdown content={String(stem || "")} />;
  return stem.map((block, idx) => {
    if (block.type === "md") return <CourseMarkdown content={block.text} key={idx} />;
    if (block.type === "figure") return <CourseFigure figure={block} key={idx} />;
    return null;
  });
}

// fresh：从头重做（错题本里用），不显示上一次的作答；onResult(isCorrect) 每次作答后回调
export function QuestionCard({
  question,
  qRef,
  kpId,
  chapterId,
  onAttempt,
  onResult,
  index = 0,
  total = 1,
  fresh = false,
  hideSource = false,
  part = null,
}) {
  const { getLatestAttempt, recordAttempt, resolvePhysicsTarget } = useCourseStudy();
  const qId = question.id || qRef.id;
  const isChoice = question.type === "选择" && question.grading === "自动";
  const [latestAttempt, setLatestAttempt] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [errorTag, setErrorTag] = useState(null);
  const [selfGradeState, setSelfGradeState] = useState(null); // 'correct' | 'incorrect'
  const [shakeKey, setShakeKey] = useState(null);
  // 先只给答案；解析要再点一下才展开，留出自己找错的时间
  const [showSteps, setShowSteps] = useState(false);
  // 读取已有记录时不播动画，只有当场作答才播
  const [live, setLive] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const att = fresh ? null : getLatestAttempt(qId, part);
    if (att) {
      setLatestAttempt(att);
      setRevealed(true);
      if (att.errorTag) setErrorTag(att.errorTag);
      if (isChoice) setSelectedOption(att.userAnswer);
      else setSelfGradeState(att.isCorrect ? "correct" : "incorrect");
    }
    const frame = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(frame);
  }, [qId, part, isChoice, fresh]);

  const defaultTag = () => question.review?.[0]?.tag || ERROR_TAGS[0];

  const record = (userAnswer, isCorrect, tag) => {
    const res = recordAttempt({
      questionId: qId,
      part,
      kpId,
      chapterId,
      userAnswer,
      isCorrect,
      errorTag: isCorrect ? null : tag,
    });
    setLatestAttempt(res.attempt);
    onAttempt?.();
    onResult?.(isCorrect, tag);
  };

  const handleSelectOption = (key) => {
    if (latestAttempt && selectedOption === key) return;
    const isCorrect = key === (question.answer?.key || "");
    setSelectedOption(key);
    setRevealed(true);
    if (isCorrect) {
      setErrorTag(null);
      record(key, true, null);
    } else {
      const tag = errorTag || defaultTag();
      setErrorTag(tag);
      setShakeKey(`${key}-${Date.now()}`);
      record(key, false, tag);
    }
  };

  const handleChangeErrorTag = (tag) => {
    setErrorTag(tag);
    record(isChoice ? selectedOption || "" : "自评做错", false, tag);
  };

  const handleSelfGrade = (isCorrect) => {
    setSelfGradeState(isCorrect ? "correct" : "incorrect");
    if (isCorrect) {
      setErrorTag(null);
      record("自评做对", true, null);
    } else {
      const tag = errorTag || defaultTag();
      setErrorTag(tag);
      record("自评做错", false, tag);
    }
  };

  const handleRetry = () => {
    setLatestAttempt(null);
    setSelectedOption(null);
    setRevealed(false);
    setErrorTag(null);
    setSelfGradeState(null);
    setShowSteps(false);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const isWrong = Boolean(latestAttempt && !latestAttempt.isCorrect);
  const activeReviewItem =
    question.review?.find((r) => r.tag === errorTag) || question.review?.[0];
  const reviewTarget = activeReviewItem?.target
    ? resolvePhysicsTarget(activeReviewItem.target)
    : null;
  const pointsToSelf = reviewTarget?.id === kpId;

  const hasImageOptions = question.options?.some((o) => o.text.includes("!["));
  const answerText = question.answer?.text || question.answer?.key || "";

  let status = { label: "未作答", tone: styles.toneIdle };
  if (latestAttempt) {
    status = latestAttempt.isCorrect
      ? { label: "做对了", tone: styles.toneCorrect }
      : { label: "要再练", tone: styles.toneWrong };
  }

  return (
    <article
      className={styles.question}
      data-live={live ? "true" : "false"}
      id={part ? `${qId}-${part}` : qId}
      ref={cardRef}
    >
      {!hideSource && (
        <header className={styles.qHead}>
          <p className={styles.qSource}>
            {total > 1 && (
              <span className={styles.qIndex}>
                第 {index + 1} 题
              </span>
            )}
            <span>{question.category || "习题"}</span>
            {question.source && <span className={styles.qSourceText}>{question.source}</span>}
            {qRef.note && !question.source?.includes(qRef.note) && (
              <span className={styles.qNote}>只做{qRef.note}</span>
            )}
          </p>
          <span className={`${styles.qStatus} ${status.tone}`} key={status.label}>
            <i />
            {status.label}
          </span>
        </header>
      )}

      <div className={styles.stem}>
        <StemBlocks stem={question.stem} />
      </div>

      {isChoice && Array.isArray(question.options) && (
        <div
          className={`${styles.options} ${hasImageOptions ? styles.optionsGrid : ""}`}
          role="group"
          aria-label="选项"
        >
          {question.options.map((opt) => {
            const isAnswer = opt.key === question.answer?.key;
            const isPicked = opt.key === selectedOption;
            let state = "idle";
            if (revealed) {
              if (isAnswer) state = isPicked ? "right" : "answer";
              else if (isPicked && isWrong) state = "wrong";
              else state = "dim";
            }
            return (
              <button
                aria-pressed={isPicked}
                className={styles.option}
                data-shake={state === "wrong" && shakeKey ? shakeKey : undefined}
                data-state={state}
                key={opt.key}
                onClick={() => handleSelectOption(opt.key)}
                type="button"
              >
                <span className={styles.optionKey}>{opt.key}</span>
                <span className={styles.optionText}>
                  <CourseMarkdown content={opt.text} inline />
                </span>
                <span className={styles.optionMark} aria-hidden="true">
                  {(state === "right" || state === "answer") && <Check size={16} />}
                  {state === "wrong" && <Cross size={16} />}
                </span>
                {state === "answer" && <span className={styles.visuallyHidden}>（正确答案）</span>}
              </button>
            );
          })}
        </div>
      )}

      {!isChoice && (
        <div className={styles.selfGrade}>
          {!revealed ? (
            <button className={styles.secondaryButton} onClick={() => setRevealed(true)} type="button">
              写好了，对答案
            </button>
          ) : (
            <div className={styles.selfGradeRow}>
              <span className={styles.selfGradePrompt}>对照答案，你做对了吗？</span>
              <div className={styles.segmented} role="group" aria-label="自己判对错">
                <button
                  aria-pressed={selfGradeState === "correct"}
                  data-tone="correct"
                  onClick={() => handleSelfGrade(true)}
                  type="button"
                >
                  <Check size={14} /> 做对了
                </button>
                <button
                  aria-pressed={selfGradeState === "incorrect"}
                  data-tone="wrong"
                  onClick={() => handleSelfGrade(false)}
                  type="button"
                >
                  <Cross size={14} /> 做错了
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Reveal open={revealed && isWrong}>
        <div className={styles.diagnose}>
          <p className={styles.diagnosePrompt}>主要错在哪？选一个，错题本按它归类。</p>
          <div className={styles.tags} role="group" aria-label="错因">
            {ERROR_TAGS.map((tag) => (
              <button
                aria-pressed={errorTag === tag}
                className={`${styles.tag} tone-${ERROR_TONE[tag] || "brown"}`}
                key={tag}
                onClick={() => handleChangeErrorTag(tag)}
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
          {reviewTarget && !pointsToSelf && (
            <p className={styles.review}>
              建议回看
              {reviewTarget.type === "kp" ? (
                <Link className={styles.reviewLink} href={reviewTarget.href}>
                  <CourseText>{reviewTarget.text}</CourseText>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <strong><CourseText>{reviewTarget.text}</CourseText></strong>
              )}
            </p>
          )}
          {pointsToSelf && (
            <p className={styles.review}>建议回到上面，把“本关要点”再看一遍。</p>
          )}
        </div>
      </Reveal>

      <Reveal open={revealed}>
        <div className={styles.solution}>
          <div className={styles.answerRow}>
            <span className={styles.answerLabel}>答案</span>
            <div className={styles.answerText}>
              <CourseMarkdown content={answerText} />
            </div>
            {question.needs_review && <span className={styles.needsReview}>答案待家长复核</span>}
          </div>

          {Array.isArray(question.steps) && question.steps.length > 0 && (
            <>
              {!showSteps && isWrong && (
                <p className={styles.thinkFirst}>先对着答案自己想想错在哪，想不通再看解析。</p>
              )}
              <button
                aria-expanded={showSteps}
                className={styles.stepsToggle}
                onClick={() => setShowSteps((v) => !v)}
                type="button"
              >
                {showSteps ? "收起解析" : `看解析（${question.steps.length} 步）`}
                <Chevron className={styles.stepsChevron} size={14} />
              </button>
              <Reveal className={styles.stepsReveal} open={showSteps}>
                <ol className={styles.steps}>
                  {question.steps.map((step, sIdx) => (
                    <li key={sIdx} style={{ "--k": sIdx }}>
                      <span aria-hidden="true" className={styles.stepNum}>
                        {sIdx + 1}
                      </span>
                      <div className={styles.stepText}>
                        <CourseMarkdown content={step} />
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </>
          )}

          <button className={styles.retry} onClick={handleRetry} type="button">
            重做这题
          </button>
        </div>
      </Reveal>
    </article>
  );
}

export function questionForPart(question, part) {
  if (!part) return question;
  const answer = part.answer ?? question.answer;
  return {
    ...question, ...part, id: question.id,
    stem: [...(Array.isArray(question.stem) ? question.stem : [{ type: "md", text: question.stem || "" }]),
      { type: "md", text: `**第（${part.part}）问**` }],
    type: part.type || question.type,
    grading: part.grading || question.grading,
    answer: typeof answer === "string" ? { text: answer } : answer,
    review: part.review ? (Array.isArray(part.review) ? part.review : Object.entries(part.review).map(([tag, target]) => ({ tag, target }))) : (question.review || []).filter((r) => !r.part || String(r.part) === String(part.part)),
  };
}

export function PhysicsExercisePanel({
  questions = [],
  questionsMap = {},
  kpId,
  chapterId,
  onAttemptRecorded,
  flat = false,
}) {
  const { subject } = useCourseStudy();
  const list = questions.filter((qRef) => questionsMap[qRef.id]).flatMap((ref) => {
    const question = questionsMap[ref.id];
    // 数学按题干小问号自动拆；物理、化学只拆各小问写了答案的题
    const parts = subject === "math" || question.parts?.some((p) => p.answer) ? mathQuestionParts(question, ref) : [];
    return parts.length
      ? parts.map((part) => ({ qRef: ref, question: questionForPart(question, part), part: String(part.part) }))
      : [{ qRef: ref, question, part: null }];
  });
  if (list.length === 0) return null;

  return (
    <div className={styles.panel} data-flat={flat ? "true" : undefined}>
      {list.map(({ qRef, question, part }, i) => (
        <QuestionCard
          part={part}
          chapterId={chapterId}
          index={i}
          key={`${qRef.id}:${part || ""}`}
          kpId={part ? question.kp || kpId : kpId}
          onAttempt={onAttemptRecorded}
          qRef={qRef}
          question={question}
          total={list.length}
        />
      ))}
    </div>
  );
}
