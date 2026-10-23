"use client";
import { CourseMarkdown } from "../CourseMarkdown";
import extra from "@/lib/bridgeGlyphs.json";
import styles from "./ThinkCard.module.css";

// “破题钥匙”卡片：现象 → 模型（图）→ 关系；化学是 宏观 → 微观（图）→ 符号。白纸面上三段淡色块，三种颜色各管一段。
const TAGS = { model: ["看到", "想成", "写成"], triple: ["看得见", "看不见", "写出来"] };

export function ThinkCard({ config }) {
  const [t1, t2, t3] = TAGS[config.kind] || TAGS.model;
  return (
    <div className={`${styles.wrap} ${config.kind === "triple" ? styles.triple : ""}`}>
      <div className={styles.row}>
        <section className={`${styles.leg} ${styles.see}`}>
          <span className={styles.tag}>{t1}</span>
          <div className={styles.text}><CourseMarkdown content={config.see} /></div>
        </section>
        <span aria-hidden="true" className={styles.arrow}>→</span>
        <section className={`${styles.leg} ${styles.model}`}>
          <span className={styles.tag}>{t2}</span>
          <svg aria-hidden="true" className={styles.glyph} dangerouslySetInnerHTML={{ __html: extra[config.glyph] }} viewBox="0 0 150 90" />
          <div className={styles.text}><CourseMarkdown content={config.model} /></div>
        </section>
        <span aria-hidden="true" className={styles.arrow}>→</span>
        <section className={`${styles.leg} ${styles.relation}`}>
          <span className={styles.tag}>{t3}</span>
          <div className={styles.formula}><CourseMarkdown content={config.relation} inline /></div>
        </section>
      </div>
      {(config.takeaway || config.move) && (
        <p className={styles.takeaway}>
          {config.takeaway && <CourseMarkdown content={config.takeaway} inline />}
          {config.move && <span className={styles.move}>用到的招：{config.move}</span>}
        </p>
      )}
    </div>
  );
}
