"use client";

import { blockLabel } from "@/lib/blockLabels";
import Link from "@/components/CourseLink";
import { useCourseStudy } from "@/components/CourseSubject";
import { CourseBody } from "@/components/CourseBody";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CourseFigure } from "@/components/CourseFigure";
import { CourseMarkdown, CourseText } from "@/components/CourseMarkdown";
import { mathQuestionParts } from "@/lib/mathWidgets";
import { CheerToast, SpeechBubble } from "@/components/Character";
import { ArrowLeft, ArrowRight, Chevron } from "@/components/LineIcons";
import { Icon } from "@/components/Icon";
import { Check as RoundCheck, Title } from "@/components/island/Island";
import { StatusTag, WeightTag } from "@/components/island/KpTags";
import { PhysicsExercisePanel, Reveal } from "@/components/PhysicsExercisePanel";
import { resolvePhysicsTarget } from "@/lib/courseV3Client";
import {
  createEmptyCourseV3,
  getKpStatus,
  loadCourseV3Data,
  markKpVisited,
  setEvidenceCheck,
  subscribeCourseV3,
} from "@/lib/studyData";
import styles from "./kp.module.css";

function shortCode(kpId) {
  const parts = kpId.split("-");
  return `${Number(parts[parts.length - 2])}-${parts[parts.length - 1]}`;
}

function bodyText(block) {
  return (block?.body || [])
    .filter((item) => item.type === "md")
    .map((item) => item.text)
    .join("\n\n");
}

// 练一练里每一个要作答的目标（多小问的题按小问算），和 getKpStatus 的算法一致
function practiceTargets(kp, questionsMap) {
  const targets = [];
  for (const block of kp.blocks || []) {
    if (block.heading !== "练一练") continue;
    for (const ref of block.questions || []) {
      const q = questionsMap[ref.id];
      const parts = kp.id.startsWith('MATH-') && q ? mathQuestionParts(q, ref) : q?.parts || [];
      if (parts.length > 0) {
        parts.forEach((p) => targets.push({ questionId: ref.id, part: String(p.part) }));
      } else {
        targets.push({ questionId: ref.id, part: null });
      }
    }
  }
  return targets;
}

function latestFor(data, target) {
  let latest = null;
  for (const a of data.attempts) {
    if (a.questionId === target.questionId && (a.part || null) === (target.part || null)) {
      latest = a;
    }
  }
  return latest;
}

// 讲解块标题的颜色：每种块固定一色
const BLOCK_TONE = { 先认住: "yellow", 数形结合: "lime", 破题钥匙: "peach", 容易错: "pink", 走一遍: "teal", 练一练: "purple" };

const STATUS_TONE = { 已掌握: "mastered", 已完成: "done", 未开始: "todo" };

export function KpView({
  kp,
  chapter,
  prevKp,
  nextKp,
  examHits = 0,
  formula = null,
  lines = [],
  masteredLines = [],
  avatars = {},
  usedBy = [],
  questionsMap = {},
}) {
  const { loadCourseV3Data, markKpVisited, subscribeCourseV3, subject, label } = useCourseStudy();
  const [studyData, setStudyData] = useState(() => createEmptyCourseV3());
  const [ready, setReady] = useState(false);
  const [justMastered, setJustMastered] = useState(false);
  const [cheer, setCheer] = useState(null);
  const prevStatus = useRef(null);

  useEffect(() => {
    markKpVisited(kp.id);
    setStudyData(loadCourseV3Data());
    const frame = requestAnimationFrame(() => setReady(true));
    const unsubscribe = subscribeCourseV3((next) => setStudyData(next));
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, [kp.id]);

  const status = getKpStatus(kp, questionsMap, studyData);

  // 只有当场做到“已掌握”时才庆祝一次；打开页面时已经掌握的不算
  useEffect(() => {
    if (!ready) return;
    if (prevStatus.current && prevStatus.current !== "已掌握" && status === "已掌握") {
      setJustMastered(true);
      if (masteredLines.length) {
        setCheer(masteredLines[Math.floor(Math.random() * masteredLines.length)]);
      }
    }
    prevStatus.current = status;
  }, [status, ready, masteredLines]);
  const blocks = Array.isArray(kp.blocks) ? kp.blocks : [];
  const lead = blocks.find((b) => b.heading === "本次只学");
  const lessonBlocks = blocks.filter((b) => b.heading !== "本次只学" && b.heading !== "练一练");
  const practiceBlock = blocks.find((b) => b.heading === "练一练");
  const prerequisites = Array.isArray(kp.prerequisites) ? kp.prerequisites : [];
  const evidence = Array.isArray(kp.evidence) ? kp.evidence : [];
  const hasRelations = prerequisites.length > 0 || usedBy.length > 0;

  const targets = useMemo(() => practiceTargets(kp, questionsMap), [kp, questionsMap]);
  const results = targets.map((t) => latestFor(studyData, t));
  const checks = evidence.map((_, i) => Boolean(studyData.evidenceChecks?.[`${kp.id}:${i}`]));

  // 整页一栏往下读：讲解块 → 闯一关 → 通关自检 → 过关进度 → 知识关系。横屏左边的目录按这个顺序编号
  const sections = [
    ...lessonBlocks.map((block, i) => ({ id: `part-${i + 1}`, label: blockLabel(block.heading, subject) })),
    practiceBlock && {
      id: "practice",
      label: blockLabel("练一练"),
      done: results.length > 0 && results.every((r) => r?.isCorrect),
    },
    evidence.length > 0 && { id: "self-check", label: blockLabel("学完我能做到"), done: checks.every(Boolean) },
    { id: "mastery", label: blockLabel("怎样算掌握"), done: status === "已掌握" },
    hasRelations && { id: "relations", label: "知识关系" },
  ].filter(Boolean);
  const order = (id) => sections.findIndex((item) => item.id === id) + 1;

  return (
    <div className={styles.page} data-ready={ready ? "true" : "false"}>
      <div className={`${styles.container} ${styles.layout}`}>
        <header className={`${styles.head} ${formula ? styles.headWithFormula : ""}`}>
          {formula && (
            <div aria-hidden="true" className={styles.headFormula}>
              <CourseMarkdown content={`$$${formula}$$`} />
            </div>
          )}
          <nav aria-label="页面路径" className={styles.crumbs}>
            <Link href="/physics/">初中{label}</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/physics/chapter/${chapter.id}/`}>{chapter.title}</Link>
          </nav>

          <div className={styles.titleRow}>
            <h1 className={styles.title}>
              <span className={styles.titleCode}>{subject !== "physics" ? shortCode(kp.id) : kp.code}</span>
              <CourseText>{kp.title}</CourseText>
            </h1>
            <div className={styles.titleTags}>
              <WeightTag size="md" weight={kp.weight || "一般"} />
              <StatusTag key={status} size="md" status={status} />
            </div>
          </div>

          {lead && (
            <div className={styles.lead}>
              <CourseMarkdown content={bodyText(lead)} />
            </div>
          )}

          <p className={styles.meta}>
            {kp.textbook && <span>课本 {kp.textbook}</span>}
            <span>
              {examHits > 0 ? `${subject !== "physics" ? "统计的" : "10 套"}中考卷里考了 ${examHits} 次` : `${subject !== "physics" ? "统计的" : "10 套"}中考卷里没有直接考到`}
            </span>
          </p>

          <ChapterRail
            chapter={chapter}
            currentId={kp.id}
            questionsMap={questionsMap}
            studyData={studyData}
          />
        </header>

        <SectionToc sections={sections} />

        <div className={styles.main}>
          {(lines.length > 0 || cheer) && (
            <CharacterLine avatars={avatars} cheer={cheer} lines={lines} />
          )}

          <article className={styles.paper}>
            {lessonBlocks.map((block, i) =>
              block.heading === "走一遍" ? (
                <Walkthrough block={block} id={`part-${i + 1}`} index={i + 1} key={i} />
              ) : (
                <section
                  className={`${styles.block} ${block.heading === "容易错" ? styles.pitfall : ""} ${block.heading === "数形结合" ? styles.bridge : ""}`}
                  id={`part-${i + 1}`}
                  key={i}
                  style={{ "--i": i + 1 }}
                >
                  <Title as="h2" className={styles.tabTitle} size="sm" tone={BLOCK_TONE[block.heading] || "blue"} variant="tab">{blockLabel(block.heading, subject)}</Title>
                  <BlockBody block={block} />
                </section>
              ),
            )}

            {practiceBlock && (
              <section className={styles.practiceSection} id="practice" style={{ "--i": order("practice") }}>
                <Title as="h2" className={styles.tabTitle} size="sm" tone="purple" variant="tab">{blockLabel("练一练")}</Title>
                <PhysicsExercisePanel
                  chapterId={chapter.id}
                  flat
                  kpId={kp.id}
                  questions={practiceBlock.questions || []}
                  questionsMap={questionsMap}
                />
              </section>
            )}

            {evidence.length > 0 && (
              <SelfCheck checks={checks} evidence={evidence} index={order("self-check")} kpId={kp.id} />
            )}

            <Mastery
              checks={checks}
              index={order("mastery")}
              justMastered={justMastered}
              nextKp={nextKp}
              results={results}
              status={status}
              weight={kp.weight}
            />

            {hasRelations && (
              <Relations index={order("relations")} kpId={kp.id} prerequisites={prerequisites} usedBy={usedBy} />
            )}
          </article>

          <Pager chapter={chapter} nextKp={nextKp} prevKp={prevKp} status={status} />
        </div>
      </div>
      {cheer && (
        <CheerToast
          actionHref={nextKp ? `/physics/kp/${nextKp.id}/` : null}
          actionLabel="去下一个"
          avatars={avatars}
          line={cheer}
        />
      )}
    </div>
  );
}

/* ---------- 横屏左侧目录：按顺序编号，读到哪一段就亮哪一段 ---------- */

function SectionToc({ sections }) {
  const [current, setCurrent] = useState(sections[0]?.id);
  const ids = sections.map((item) => item.id).join(" ");

  useEffect(() => {
    const list = ids.split(" ");
    const update = () => {
      // 段落开头越过页头下方一点的那一段，就是正在读的；翻到底时，最后一段也算读到了
      const line = Math.min(window.innerHeight * 0.33, 200);
      let next = list[0];
      for (const id of list) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= line) next = id;
      }
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
      if (atEnd) {
        const last = document.getElementById(list[list.length - 1]);
        if (last && last.getBoundingClientRect().top < window.innerHeight) next = list[list.length - 1];
      }
      setCurrent(next);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);

  const jump = (event, id) => {
    event.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setCurrent(id);
  };

  return (
    <nav aria-label="这一页的内容" className={styles.toc}>
      <p className={styles.tocTitle}>这一关</p>
      <ol>
        {sections.map((item, i) => (
          <li key={item.id}>
            <a
              aria-current={item.id === current ? "true" : undefined}
              className={styles.tocLink}
              data-done={item.done ? "true" : undefined}
              href={`#${item.id}`}
              onClick={(event) => jump(event, item.id)}
            >
              <span aria-hidden="true" className={styles.tocNum}>{i + 1}</span>
              <span className={styles.tocLabel}>{item.label}</span>
              {item.done && <Icon className={styles.tocDone} name="check" size={18} />}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function BlockBody({ block }) {
  return <CourseBody body={block.body || []} />;
}

/* ---------- 本章知识点进度条 ---------- */

function ChapterRail({ chapter, currentId, questionsMap, studyData }) {
  const kps = chapter.kps || [];
  return (
    <nav aria-label={`${chapter.title}的知识点`} className={styles.rail}>
      <ol>
        {kps.map((item, i) => {
          const itemStatus = getKpStatus(item, questionsMap, studyData);
          const isCurrent = item.id === currentId;
          return (
            <li key={item.id} style={{ "--s": i }}>
              <Link
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`${shortCode(item.id)} ${item.title}，${itemStatus}`}
                className={`${styles.railItem} ${styles[STATUS_TONE[itemStatus]]} ${
                  isCurrent ? styles.railCurrent : ""
                }`}
                href={`/physics/kp/${item.id}/`}
              >
                <span className={styles.railCode}>{shortCode(item.id)}</span>
                <span className={styles.railBar} />
                <span aria-hidden="true" className={styles.railTip}>
                  <CourseText>{item.title}</CourseText>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------- 角色台词 ---------- */

function CharacterLine({ lines, cheer, avatars }) {
  const [index, setIndex] = useState(0);
  const current = cheer || lines[index % Math.max(lines.length, 1)];
  if (!current) return null;
  return (
    <SpeechBubble
      avatars={avatars}
      cheer={Boolean(cheer)}
      className={styles.quote}
      line={current}
      onNext={!cheer && lines.length > 1 ? () => setIndex((i) => i + 1) : undefined}
    />
  );
}

/* ---------- 知识关系：先学过 / 学会后会用到 ---------- */

function RelationItem({ target, reason, href, muted }) {
  return (
    <li>
      {href ? (
        <Link className={styles.relLink} href={href}>
          <CourseText>{target}</CourseText>
        </Link>
      ) : (
        <strong className={muted ? styles.relMuted : undefined}><CourseText>{target}</CourseText></strong>
      )}
      {reason && <span className={styles.relReason}><CourseText>{reason}</CourseText></span>}
    </li>
  );
}

function Relations({ kpId, prerequisites, usedBy, index }) {
  const { resolvePhysicsTarget, base } = useCourseStudy();
  const [open, setOpen] = useState(false);

  const hard = prerequisites.filter((p) => p.strength === "hard");
  const soft = prerequisites.filter((p) => p.strength !== "hard");
  const summary = [
    hard.length && `必须先会 ${hard.length}`,
    soft.length && `会了更容易 ${soft.length}`,
    usedBy.length && `后面会用到 ${usedBy.length}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const prereqItem = (p, i) => {
    const target = resolvePhysicsTarget(p.id);
    return (
      <RelationItem
        href={target.type === "kp" ? target.href : null}
        key={i}
        reason={p.reason}
        target={target.text}
      />
    );
  };

  return (
    <section className={styles.prereq} id="relations" style={{ "--i": index }}>
      <button
        aria-expanded={open}
        className={styles.prereqToggle}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className={styles.blockTitle}>知识关系</span>
        <span className={styles.prereqSummary}>{summary}</span>
        <Chevron className={styles.chevron} />
      </button>
      <Reveal animate open={open}>
        <div className={styles.relGroups}>
          {hard.length > 0 && (
            <div className={styles.relGroup}>
              <h3 className={`${styles.relTitle} ${styles.relMust}`}>必须先会</h3>
              <ul>{hard.map(prereqItem)}</ul>
            </div>
          )}
          {soft.length > 0 && (
            <div className={styles.relGroup}>
              <h3 className={styles.relTitle}>会了更容易</h3>
              <ul>{soft.map(prereqItem)}</ul>
            </div>
          )}
          {usedBy.length > 0 && (
            <div className={styles.relGroup}>
              <h3 className={`${styles.relTitle} ${styles.relLater}`}>学会后会用到</h3>
              <ul>
                {usedBy.map((u) => (
                  <RelationItem
                    href={u.available ? `/physics/kp/${u.id}/` : null}
                    key={u.id}
                    muted={!u.available}
                    reason={u.available ? u.reason : `${u.reason ? `${u.reason}（` : "（"}这一章还没开放）`}
                    target={`${u.code} ${u.title}`}
                  />
                ))}
              </ul>
            </div>
          )}
          <Link className={styles.relMapLink} href={`${base}/map/?kp=${kpId}`}>在知识地图里看这个点</Link>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 走一遍：可以一步一步看 ---------- */

function Walkthrough({ block, id, index }) {
  const bodyRef = useRef(null);
  const [stepCount, setStepCount] = useState(0);
  const [mode, setMode] = useState("all");
  const [step, setStep] = useState(1);

  useEffect(() => {
    const items = bodyRef.current?.querySelectorAll("ol > li");
    setStepCount(items ? items.length : 0);
  }, [block]);

  // 讲义正文是一段 HTML，这里直接给列表项加显示 / 隐藏标记
  useEffect(() => {
    const root = bodyRef.current;
    const ol = root?.querySelector("ol");
    if (!ol) return;
    const items = [...ol.children];
    const stepping = mode === "step";
    items.forEach((li, i) => {
      li.toggleAttribute("data-hidden", stepping && i >= step);
      li.toggleAttribute("data-fresh", stepping && i === step - 1 && step > 1);
    });
    // 列表后面的内容（比如“计算四步”的总结），最后一步出来以后再显示
    const tail = [];
    for (let el = ol.nextElementSibling; el; el = el.nextElementSibling) tail.push(el);
    for (let box = ol.parentElement; box && box !== root; box = box.parentElement) {
      for (let el = box.nextElementSibling; el; el = el.nextElementSibling) tail.push(el);
    }
    tail.forEach((el) => {
      el.toggleAttribute("data-hidden", stepping && step < items.length);
      el.toggleAttribute("data-fresh", stepping && step === items.length);
    });
  }, [mode, step, stepCount]);

  const stepping = mode === "step";
  const finished = step >= stepCount;

  return (
    <section className={styles.block} id={id} style={{ "--i": index }}>
      <div className={styles.blockHead}>
        <Title as="h2" className={styles.tabTitle} size="sm" tone="teal" variant="tab">{blockLabel("走一遍")}</Title>
        {stepCount > 1 && (
          <div aria-label="显示方式" className={styles.modeSwitch} role="group">
            <button aria-pressed={!stepping} onClick={() => setMode("all")} type="button">
              全部
            </button>
            <button
              aria-pressed={stepping}
              onClick={() => {
                setMode("step");
                setStep(1);
              }}
              type="button"
            >
              一步一步
            </button>
          </div>
        )}
      </div>
      <div className={styles.walkBody} ref={bodyRef}>
        <BlockBody block={block} />
      </div>
      {stepping && stepCount > 1 && (
        <div className={styles.stepBar}>
          <span className={styles.stepCount}>
            第 {Math.min(step, stepCount)} / {stepCount} 步
          </span>
          {finished ? (
            <button className={styles.stepButton} onClick={() => setStep(1)} type="button">
              从头再看
            </button>
          ) : (
            <button
              className={`${styles.stepButton} ${styles.stepButtonPrimary}`}
              onClick={() => setStep((s) => s + 1)}
              type="button"
            >
              下一步
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------- 过关进度 ---------- */

function Mastery({ results, checks, status, weight, nextKp, justMastered, index }) {
  const answered = results.filter(Boolean).length;
  const correct = results.filter((r) => r?.isCorrect).length;
  const checked = checks.filter(Boolean).length;
  const noPractice = results.length === 0 || weight === "了解";
  const mastered = status === "已掌握";

  const missing = [];
  if (!noPractice && correct < results.length) {
    missing.push(
      answered < results.length
        ? `做完“${blockLabel("练一练")}”里的题（还有 ${results.length - answered} 题）`
        : `把做错的 ${results.length - correct} 题再做对`,
    );
  }
  if (checked < checks.length) missing.push(`自查还有 ${checks.length - checked} 条`);

  return (
    <section
      className={`${styles.mastery} ${mastered ? styles.masteryDone : ""} ${
        justMastered ? styles.masteryJust : ""
      }`}
      id="mastery"
      style={{ "--i": index }}
    >
      <div className={styles.masteryHead}>
        <Title as="h2" className={styles.tabTitle} size="sm" tone="leaf" variant="tab">{blockLabel("怎样算掌握")}</Title>
        {mastered && (
          <span className={styles.masteryBadge}>
            <Icon name="star" size={20} /> 已掌握
          </span>
        )}
      </div>

      <div className={styles.meters}>
        {noPractice ? (
          <Meter label="读过这一页" segments={[{ tone: "ok" }]} value="1/1" />
        ) : (
          <Meter
            label="闯关题最近一次都做对"
            segments={results.map((r) => ({ tone: r ? (r.isCorrect ? "ok" : "bad") : "none" }))}
            value={`${correct}/${results.length}`}
          />
        )}
        {checks.length > 0 && (
          <Meter
            label="自查每一条都能做到"
            segments={checks.map((c) => ({ tone: c ? "ok" : "none" }))}
            value={`${checked}/${checks.length}`}
          />
        )}
      </div>

      <p className={styles.masteryNote}>
        {mastered ? (
          nextKp ? (
            <>
              这一个过关了。
              <Link className={styles.inlineLink} href={`/physics/kp/${nextKp.id}/`}>
                去下一个：<CourseText>{nextKp.title}</CourseText>
                <ArrowRight size={13} />
              </Link>
            </>
          ) : (
            "这一个过关了，这也是本章最后一个知识点。"
          )
        ) : missing.length ? (
          `还差：${missing.join("；")}。`
        ) : (
          "条件都满足了。"
        )}
      </p>
    </section>
  );
}

function Meter({ label, segments, value }) {
  return (
    <div className={styles.meter}>
      <div className={styles.meterTop}>
        <span>{label}</span>
        <span className={styles.meterValue}>{value}</span>
      </div>
      <div aria-hidden="true" className={styles.meterBar}>
        {segments.map((s, i) => (
          <span data-tone={s.tone} key={i} style={{ "--s": i }} />
        ))}
      </div>
    </div>
  );
}

function SelfCheck({ evidence, checks, kpId, index }) {
  const { setEvidenceCheck } = useCourseStudy();
  const toggle = useCallback((i, value) => setEvidenceCheck(kpId, i, !value), [kpId]);
  return (
    <section className={styles.selfCheck} id="self-check" style={{ "--i": index }}>
      <Title as="h2" className={styles.tabTitle} size="sm" tone="orange" variant="tab">{blockLabel("学完我能做到")}</Title>
      <p className={styles.selfCheckNote}>对照每一条，真能做到再勾上。</p>
      <ul className={styles.checkList}>
        {evidence.map((item, i) => (
          <li key={i}>
            <RoundCheck checked={checks[i]} onChange={() => toggle(i, checks[i])}>
              <CourseMarkdown content={item} inline />
            </RoundCheck>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- 前后翻页 ---------- */

function Pager({ prevKp, nextKp, chapter, status }) {
  const done = status === "已掌握" || status === "已完成";
  return (
    <nav aria-label="前后知识点" className={styles.pager}>
      {prevKp ? (
        <Link className={styles.pagerLink} href={`/physics/kp/${prevKp.id}/`}>
          <span className={styles.pagerLabel}>
            <ArrowLeft size={14} /> 上一个
          </span>
          <span className={styles.pagerTitle}>
            <CourseText>{prevKp.title}</CourseText>
          </span>
        </Link>
      ) : (
        <Link className={styles.pagerLink} href={`/physics/chapter/${chapter.id}/`}>
          <span className={styles.pagerLabel}>
            <ArrowLeft size={14} /> 回到本章
          </span>
          <span className={styles.pagerTitle}>{chapter.title}</span>
        </Link>
      )}
      <Link
        className={`${styles.pagerLink} ${styles.pagerNext} ${done ? styles.pagerReady : ""}`}
        href={nextKp ? `/physics/kp/${nextKp.id}/` : `/physics/chapter/${chapter.id}/`}
      >
        <span className={styles.pagerLabel}>
          {nextKp ? "下一个" : "本章完"} <ArrowRight size={14} />
        </span>
        <span className={styles.pagerTitle}>
          <CourseText>{nextKp ? nextKp.title : `回到${chapter.title}`}</CourseText>
        </span>
      </Link>
    </nav>
  );
}
