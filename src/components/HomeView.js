"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { SearchBox } from "./SearchBox";
import { Card, Progress, Tag } from "./island/Island";
import { getActiveMistakes, loadCourseV3Data, subscribeCourseV3 } from "@/lib/studyData";
import styles from "./HomeView.module.css";

// 读本机的学习记录：学过几个知识点、下一个学哪个、几道错题待复习。
// 服务器渲染时没有记录，先显示“还没开始”，挂载后再换成真实数字。
function useSubjectProgress(subject) {
  const [state, setState] = useState(null);
  useEffect(() => {
    const ids = subject.kps.map((kp) => kp.id);
    const update = () => {
      const visited = new Set(loadCourseV3Data(subject.key).visitedKps);
      const done = ids.filter((id) => visited.has(id)).length;
      const next = subject.kps.find((kp) => !visited.has(kp.id)) ?? null;
      setState({ done, next, pending: getActiveMistakes(null, subject.key).length });
    };
    update();
    return subscribeCourseV3(update, subject.key);
  }, [subject]);
  return state;
}

function SubjectCard({ subject }) {
  const progress = useSubjectProgress(subject);
  const total = subject.kps.length;
  const done = progress?.done ?? 0;
  const next = progress ? progress.next : subject.kps[0];
  const started = done > 0;

  return (
    <Card className={styles.card} tone={subject.tone} variant="pattern">
      <div className={styles.cardHead}>
        <Icon name={subject.icon} size={44} />
        <div>
          <strong className={styles.name}>{subject.title}</strong>
          <span className={styles.count}>{subject.chapterCount} 章 · {total} 个知识点</span>
        </div>
      </div>
      <p className={styles.text}>{subject.text}</p>

      <Progress
        ariaLabel={`${subject.title}已学 ${done} 个知识点`}
        label={`已学 ${done} / ${total}`}
        max={total}
        value={done}
      />

      {next ? (
        <Link className={styles.next} href={`/${subject.key}/kp/${next.id}/`}>
          <span className={styles.nextLabel}>{started ? "接着学" : "从这里开始"}</span>
          <span className={styles.nextTitle}>{next.title}</span>
          <Icon name="arrow-right" size={18} />
        </Link>
      ) : (
        <p className={styles.allDone}>全部知识点都看过一遍了，去错题本巩固一下。</p>
      )}

      <div className={styles.actions}>
        <Link className="island-btn island-btn--primary" href={subject.href}>进入{subject.title}</Link>
        {progress?.pending > 0 && (
          <Link className={styles.pending} href={`/mistakes/#${subject.key}`}>
            <Tag tone="red" variant="solid" size="md">{progress.pending} 道待复习</Tag>
          </Link>
        )}
      </div>

      <ul className={styles.tools}>
        {subject.tools.map((tool) => (
          <li key={tool.href}>
            <Link href={tool.href}>{tool.label}</Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function HomeView({ subjects, hotQueries }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const go = (query) => {
    const q = query.trim();
    router.push(q ? `/search/?q=${encodeURIComponent(q)}` : "/search/");
  };

  return (
    <main className="page-main">
      <div className="page-container">
        <header className={styles.hero}>
          <div aria-hidden="true" className={styles.art} />
          <div className={styles.heroText}>
          <h1 className={styles.wordmark}>
            <img alt="Gotcha 中考复习" height="656" src="/brand/gotcha-wordmark.webp" width="2000" />
          </h1>
          <p className={styles.lead}>数学、物理、化学的讲解、练习和错题本都在这里。</p>
          <div className={styles.search}>
            <SearchBox large onChange={setValue} onSubmit={go} value={value} />
          </div>
          <div className={styles.hot}>
            <span>常搜</span>
            {hotQueries.map((q) => (
              <Link href={`/search/?q=${encodeURIComponent(q)}`} key={q}>{q}</Link>
            ))}
          </div>
          </div>
        </header>

        <div className={styles.grid}>
          {subjects.map((subject) => (
            <SubjectCard key={subject.key} subject={subject} />
          ))}
        </div>

        <Link className={styles.mistakes} href="/mistakes/">
          <Icon name="bookmark" size={28} />
          <span>
            <strong>错题本</strong>
            <span>三科错题放在一起，一道一道重做，改对了就划掉。</span>
          </span>
          <Icon name="arrow-right" size={20} />
        </Link>
      </div>
    </main>
  );
}
