"use client";

import Link from "@/components/CourseLink";
import { useMemo, useState } from "react";
import { CourseText } from "@/components/CourseMarkdown";
import { ArrowRight } from "@/components/LineIcons";
import { QuestionCard, questionForPart } from "@/components/PhysicsExercisePanel";
import { Tag } from "@/components/island/Island";
import { mathQuestionParts } from "@/lib/mathWidgets";
import { answerKp, canExtend, extendTrace, nextKp, pickCheck, startTrace, traceResult } from "@/lib/prereqTrace";
import styles from "./PrereqTrace.module.css";

const kpHref = (id) => `/physics/kp/${id}/`;

// 错题下面的“往前找找哪一步没跟上”：一个点一个点往前查，查完给一条补课路线
// 结果只是提示，自评的题没有标准答案，不要当成打分
export function PrereqTrace({ graph, startKp, reviewTarget, questionsMap }) {
  const [state, setState] = useState(() => startTrace(graph, startKp, { reviewTarget }));
  // 刚答完、还没点“下一个”的那一步：先让孩子看清对错和答案
  const [pending, setPending] = useState(null); // { kp, verdict }
  // 没有题的知识点：自查条目，不写进自查记录，只在这里用
  const kp = pending ? pending.kp : nextKp(state);

  const check = useMemo(
    () => (kp ? pickCheck(graph, kp, questionsMap, mathQuestionParts) : null),
    [graph, kp, questionsMap],
  );

  const advance = (verdict) => {
    setState((s) => answerKp(s, kp, verdict));
    setPending(null);
  };

  const result = traceResult(state);
  const title = (id) => graph[id]?.title || id;

  return (
    <div className={styles.trace}>
      {state.asked.length + (kp ? 1 : 0) > 0 && (
        <ol aria-label="查过的知识点" className={styles.marks}>
          {state.asked.map((a) => (
            <li key={a.kp}>
              <Tag tone={a.verdict === "right" ? "green" : "pink"}>
                <CourseText>{title(a.kp)}</CourseText>
              </Tag>
            </li>
          ))}
          {kp && (
            <li aria-current="step" className={styles.current} key={`cur-${kp}`}>
              <Tag tone="yellow" variant="outlined">
                <CourseText>{title(kp)}</CourseText>
              </Tag>
            </li>
          )}
        </ol>
      )}

      {kp ? (
        <section className={styles.step}>
          <p className={styles.ask}>
            先看看这个会不会：
            <Link href={kpHref(kp)}>
              <CourseText>{title(kp)}</CourseText> <ArrowRight size={12} />
            </Link>
          </p>

          {check.kind === "question" ? (
            <QuestionStep
              check={check}
              graph={graph}
              key={kp}
              kp={kp}
              onDunno={() => advance("dunno")}
              onNext={() => advance(pending.verdict)}
              onResult={(ok) => setPending({ kp, verdict: ok ? "right" : "wrong" })}
              pending={pending}
              questionsMap={questionsMap}
            />
          ) : (
            <div className={styles.selfCheck}>
              <p className={styles.selfLead}>这个点没有现成的题，对照下面几条想一想：</p>
              <ul>
                {check.items.map((text, i) => (
                  <li key={i}>
                    <CourseText>{text}</CourseText>
                  </li>
                ))}
              </ul>
              <div className={styles.actions}>
                <button className="island-btn island-btn--primary" onClick={() => advance("right")} type="button">
                  都能做到
                </button>
                <button className="island-btn" onClick={() => advance("wrong")} type="button">
                  有做不到的
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className={styles.result}>
          {result.weak.length === 0 ? (
            <p className={styles.verdict}>
              {result.checked === 0
                ? "这个知识点前面没有别的要查了，回到这道题再试一次。"
                : canExtend(state)
                  ? "查过的这几个都没问题，还可以再往前看看。"
                  : "前面的都没问题，回到这道题再试一次。"}
            </p>
          ) : (
            <>
              <p className={styles.verdict}>找到了！照着这条路线，从上往下补一补，再回来做这道题。</p>
              <ol className={styles.route}>
                {result.path.map((id, i) => (
                  <li data-last={i === result.path.length - 1 ? "true" : "false"} key={id}>
                    <Link href={kpHref(id)}>
                      <CourseText>{title(id)}</CourseText> <ArrowRight size={12} />
                    </Link>
                    {i === result.path.length - 1 && <span className={styles.routeNote}>这道错题的知识点</span>}
                  </li>
                ))}
              </ol>
              {result.beyondJuniorHigh && (
                <p className={styles.parent}>再往前是小学内容，可以请家长帮忙看看。</p>
              )}
            </>
          )}
          {canExtend(state) && (
            <div className={styles.actions}>
              <button className="island-btn" onClick={() => setState((s) => extendTrace(s))} type="button">
                接着往前查
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function QuestionStep({ check, graph, kp, questionsMap, pending, onResult, onNext, onDunno }) {
  const { qRef, part } = check;
  const question = useMemo(() => {
    const q = questionsMap[qRef.id];
    if (!part) return q;
    const found = mathQuestionParts(q, qRef).find((p) => String(p.part) === part);
    return questionForPart(q, found || { part });
  }, [questionsMap, qRef, part]);

  return (
    <>
      <QuestionCard
        chapterId={graph[kp].chapter}
        fresh
        hideSource
        kpId={kp}
        onResult={onResult}
        part={part}
        qRef={qRef}
        question={question}
      />
      <div className={styles.actions}>
        {pending ? (
          <>
            <p className={styles.after}>
              {pending.verdict === "right" ? "这一步没问题，这条路到这里为止。" : "这里还没跟上，接着往更前面看。"}
            </p>
            <button className="island-btn island-btn--primary" onClick={onNext} type="button">
              下一个 <ArrowRight size={14} />
            </button>
          </>
        ) : (
          <button className="island-btn" onClick={onDunno} type="button">
            这题不会
          </button>
        )}
      </div>
    </>
  );
}
