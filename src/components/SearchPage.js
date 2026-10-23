"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Tabs, Tag, Title } from "./island/Island";
import { WeightTag } from "./island/KpTags";
import { SearchBox } from "./SearchBox";
import { prepareDocs, searchDocs, splitHighlight } from "@/lib/search";
import styles from "./SearchPage.module.css";

export const SUBJECT_META = {
  math: { label: "数学", tone: "teal" },
  physics: { label: "物理", tone: "blue" },
  chemistry: { label: "化学", tone: "brown" },
};
const FILTERS = [{ key: "all", label: "全部" }, ...Object.entries(SUBJECT_META).map(([key, m]) => ({ key, label: m.label }))];
const DEBOUNCE_MS = 120;

function Highlight({ text, terms }) {
  return splitHighlight(text, terms).map((part, i) =>
    part.hit ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>,
  );
}

export function SearchPage() {
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [docs, setDocs] = useState(null);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  // 进来时从地址栏读 ?q=
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") ?? "";
    setValue(q);
    setQuery(q);
  }, []);

  // 索引只在进入搜索页时下载一次
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch("/search-index.json")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((list) => setDocs(prepareDocs(list)))
      .catch(() => setFailed(true));
  }, []);

  // 输入停顿一下再搜，同时把关键词写进地址栏，方便返回和分享
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(value);
      const url = value.trim() ? `/search/?q=${encodeURIComponent(value.trim())}` : "/search/";
      window.history.replaceState(null, "", url);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const result = useMemo(
    () => (docs && query.trim() ? searchDocs(docs, query, { subject }) : null),
    [docs, query, subject],
  );

  return (
    <main className="page-main">
      <div className={`page-container ${styles.page}`}>
        <Title as="h1" tone="teal">搜索</Title>
        <div className={styles.searchRow}>
          <SearchBox autoFocus onChange={setValue} onSubmit={(v) => setQuery(v)} value={value} />
        </div>

        {failed && (
          <Card className={styles.state} variant="dashed">
            <p>搜索数据没有加载出来，刷新一下页面再试。</p>
          </Card>
        )}

        {!failed && !query.trim() && (
          <Card className={styles.state} variant="dashed">
            <strong>想找什么？</strong>
            <p>输入一个词就行，多个词用空格隔开，比如“二次函数 顶点”。能搜到知识点、公式速查和历年题目。</p>
          </Card>
        )}

        {query.trim() && !docs && !failed && <p className={styles.more}>正在翻找…</p>}

        {result && (
          <>
            <div className={styles.filters}>
              <Tabs
                bare
                defaultKey={subject}
                items={FILTERS.map((f) => ({ key: f.key, label: `${f.label} ${result.counts[f.key] ?? 0}` }))}
                onChange={setSubject}
              />
            </div>
            {result.hits.length === 0 ? (
              <Card className={styles.state} variant="dashed">
                <strong>没有找到“{query.trim()}”</strong>
                <p>换个说法试试，或者少写几个字。{subject !== "all" && "也可以切到“全部”看看。"}</p>
              </Card>
            ) : (
              <ul className={styles.list} aria-live="polite">
                {result.hits.map((hit, i) => (
                  <li key={`${hit.url}-${i}`}>
                    <Link className={styles.hit} href={hit.url}>
                      <span className={styles.meta}>
                        <Tag tone={SUBJECT_META[hit.subject].tone}>{SUBJECT_META[hit.subject].label}</Tag>
                        <Tag variant="outlined">{hit.kind}</Tag>
                        {hit.weight && <WeightTag weight={hit.weight} />}
                      </span>
                      <strong className={styles.title}><Highlight terms={result.terms} text={hit.title} /></strong>
                      {hit.crumb && <span className={styles.crumb}>{hit.crumb}</span>}
                      {hit.snippet && (
                        <span className={styles.snippet}><Highlight terms={result.terms} text={hit.snippet} /></span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {result.total > result.hits.length && (
              <p className={styles.more}>只显示前 {result.hits.length} 条，加一个词可以缩小范围。</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
