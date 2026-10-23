import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseMarkdown } from "@/components/CourseMarkdown";
import { Title } from "@/components/island/Island";
import {
  BOOK_NAMES,
  getAvailablePhysicsChapters,
  getPhysicsChapter,
  getPhysicsChapters,
} from "@/lib/courseV3";
import { ChapterKpList } from "./ChapterKpList";
import { ChapterMap } from "./ChapterMap";
import { PHYSICS_LABS } from "@/lib/labs";
import styles from "./chapter.module.css";

export const dynamicParams = false;

// 有互动实验室的章节（这个页面三科共用，按章节 id 判断）
const LABS = Object.fromEntries(PHYSICS_LABS.map((lab) => [lab.chapter, lab]));

export function generateStaticParams() {
  const chapters = getAvailablePhysicsChapters();
  return chapters.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const chapter = getPhysicsChapter(id);
  if (!chapter) return { title: "章节未找到" };
  return {
    title: `${chapter.title} · 初中物理`,
    description: `初中物理 ${chapter.title} 知识点、讲义、练习与考点自测。`,
  };
}

export default async function PhysicsChapterPage({ params, subject = "physics" }) {
  const { id } = await params;
  const chapter = getPhysicsChapter(id, subject);
  if (!chapter) notFound();
  const chapterBook = getPhysicsChapters(subject).find((c) => c.id === id)?.book;


  return (
    <main className="page-main">
      <div className="page-container">
        {/* Header & Breadcrumb */}
        <header className={styles.header}>
          <nav className={styles.breadcrumb} aria-label="页面路径">
            <Link href={`/${subject}/`}>初中{{ math: "数学", chemistry: "化学" }[subject] || "物理"}</Link>
            <span>/</span>
            <span>{BOOK_NAMES[chapterBook] || ""}</span>
            <span>/</span>
            <span>{chapter.title}</span>
          </nav>
          <div className={styles.titleRow}>
            <Title as="h1" tone="green">{chapter.title}</Title>
          </div>
        </header>

        {LABS[chapter.id] && (
          <section className={styles.cardSection}>
            <Title as="h2" tone="purple" variant="layer">动手实验室</Title>
            <div className={styles.labRow}>
              <p>{LABS[chapter.id].text}</p>
              <Link className="island-btn island-btn--primary" href={LABS[chapter.id].href}>进入实验室</Link>
            </div>
          </section>
        )}

        {/* Chapter Introduction */}
        {chapter.intro && (
          <section className={styles.cardSection}>
            <Title as="h2" tone="yellow" variant="layer">本章导语</Title>
            <CourseMarkdown content={chapter.intro} />
          </section>
        )}

        {/* Prerequisite Check */}
        {chapter.prereq_check && (
          <section className={styles.cardSection}>
            <Title as="h2" tone="pink" variant="layer">本章前置自查</Title>
            <div className={styles.prereqBox}>
              <CourseMarkdown content={chapter.prereq_check} />
            </div>
          </section>
        )}

        {/* Knowledge map */}
        <section className={styles.cardSection}>
          <Title as="h2" tone="blue" variant="layer">本章知识关系</Title>
          <ChapterMap kps={chapter.kps || []} questionsMap={chapter.questions || {}} />
        </section>

        {/* Knowledge Points */}
        <section className={styles.cardSection}>
          <Title as="h2" tone="teal" variant="layer">
              知识点列表（{chapter.kps?.length || 0} 个）
            </Title>
          <ChapterKpList
            chapterId={chapter.id}
            kps={chapter.kps || []}
            questionsMap={chapter.questions || {}}
          />
        </section>
      </div>
    </main>
  );
}
