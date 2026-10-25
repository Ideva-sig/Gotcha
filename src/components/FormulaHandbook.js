import fs from "node:fs";
import { packPath } from "@/lib/contentPack.mjs";
import { CourseMarkdown } from "@/components/CourseMarkdown";
import { PrintButton } from "./PrintButton";
import { BackTop, Divider, Title } from "@/components/island/Island";
import styles from "./handbook.module.css";

function splitHeading(block) {
  const end = block.indexOf("\n");
  return end === -1
    ? { title: block.trim(), body: "" }
    : { title: block.slice(0, end).trim(), body: block.slice(end + 1) };
}

// “01. 速度与平均速度” → formula-01，搜索结果靠它跳到这一条
function formulaAnchor(title) {
  const num = title.match(/^(\d+)\./)?.[1];
  return num ? `formula-${num}` : undefined;
}

function MarkdownBody({ content }) {
  // 分隔线由页面章节间距表达；结尾换行让末尾表格完整进入现有解析器。
  const body = content.replace(/^---[ \t]*$/gm, "").trim();
  return body ? <CourseMarkdown content={`${body}\n`} nestedLists /> : null;
}

export function FormulaHandbook({ subject, sectionLinks: SECTION_LINKS }) {
  // 仅在静态构建时读内容包里的公式速查（内容包由 export-course-json.py 从 course/<科目>/formulas.md 复制而来）。
  const source = fs.readFileSync(packPath(subject, "formulas.md"), "utf8");
  const [opening, ...sections] = source.split(/^## /m);
  const { title, body: intro } = splitHeading(opening.replace(/^# /, ""));
  if (sections.length !== SECTION_LINKS.length) {
    throw new Error(`公式手册应包含 ${SECTION_LINKS.length} 个大部分，请同步检查目录。`);
  }

  return (
    <main className="page-main">
      <div className={`page-container ${styles.handbook}`}>
        <header className={styles.header}>
          <Title as="h1" tone="green">{title}</Title>
          <MarkdownBody content={intro} />
        </header>

        <div className={styles.printBar}><PrintButton /></div>

        <nav className={styles.toc} aria-label="公式速查目录">
          {SECTION_LINKS.map(({ id, label, tone }) => (
            <a className={`island-btn island-btn--tone tone-${tone}`} href={`#${id}`} key={id}>
              {label}
            </a>
          ))}
        </nav>

        {sections.map((section, index) => {
          const { title: sectionTitle, body } = splitHeading(section);
          const [lead, ...entries] = body.split(/^### /m);
          const { id, tone } = SECTION_LINKS[index];
          return (
            <section className={styles.section} id={id} key={id} aria-labelledby={`${id}-title`}>
              {index > 0 && <div className={styles.sectionDivider}><Divider /></div>}
              <Title as="h2" id={`${id}-title`} tone={tone} variant="layer">{sectionTitle}</Title>
              <MarkdownBody content={lead} />
              {entries.map((entry) => {
                const { title: entryTitle, body: entryBody } = splitHeading(entry);
                return (
                  <div className={styles.entry} id={formulaAnchor(entryTitle)} key={entryTitle}>
                    <h3>{entryTitle}</h3>
                    <MarkdownBody content={entryBody} />
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
      <BackTop />
    </main>
  );
}
