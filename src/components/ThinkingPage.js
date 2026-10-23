import Link from "next/link";
import { getAllPhysicsKps, getAvailablePhysicsChapters, getPhysicsIndex } from "@/lib/courseV3";
import { parseThink, findThink } from "@/lib/thinkCards";
import { parseBridge } from "@/lib/bridgeCards";
import BridgeCards from "@/components/math/BridgeCards";
import { Title } from "@/components/island/Island";
import { CourseMarkdown } from "@/components/CourseMarkdown";
import { ThinkCard } from "@/components/physics/ThinkCard";
import styles from "@/app/physics/thinking/thinking.module.css";

// “思维提升”页：由各知识点的“破题钥匙”卡片按章汇总，卡片是唯一来源。
function collect(subject) {
  const kps = getAllPhysicsKps(subject);
  return getAvailablePhysicsChapters(subject)
    .map((ch) => ({
      id: ch.id,
      title: ch.title,
      items: kps
        .filter((kp) => kp.chapterId === ch.id)
        .map((kp) => {
          if (subject === "math") {
            const block = (kp.blocks || []).find((b) => b.heading === "数形结合");
            const text = (block?.body || []).filter((x) => x.type === "md").map((x) => x.text).join("\n");
            const m = text.match(/```bridge\s*\n([\s\S]*?)```/);
            if (!m) return null;
            try { return { kp, bridge: parseBridge(m[1]) }; } catch { return null; }
          }
          const block = (kp.blocks || []).find((b) => b.heading === "破题钥匙");
          const text = (block?.body || []).filter((x) => x.type === "md").map((x) => x.text).join("\n");
          const found = findThink(text);
          return found ? { kp, config: parseThink(found.source) } : null;
        })
        .filter(Boolean),
    }))
    .filter((ch) => ch.items.length);
}

export function ThinkingPage({ subject }) {
  const chapters = collect(subject);
  // 开场说明来自内容包 index.json 的 thinking_intro（源文件 course/<科目>/thinking-intro.yml）
  const intro = getPhysicsIndex(subject).thinking_intro;
  return (
    <main className="page-main">
      <div className={`page-container ${styles.page}`}>
        <header className={styles.header}>
          <Title as="h1" tone="peach">思维提升</Title>
          <p className={styles.lead}>{intro.lead}</p>
          <ol className={styles.steps}>
            {intro.steps.map(({ head, text }) => <li key={head}><b>{head}</b>{text}</li>)}
          </ol>
          {intro.note && <p className={styles.note}>{intro.note}</p>}
          {intro.source && <p className={styles.source}>{intro.source}</p>}
        </header>
        {chapters.map((ch) => (
          <section className={styles.group} key={ch.id}>
            <Title as="h2" size="sm" tone="peach" variant="tab">{ch.title}</Title>
            {ch.items.map(({ kp, config, bridge }) => (
              <div className={styles.item} key={kp.id}>
                <h3 className={styles.kpTitle}><Link href={`/${subject}/kp/${kp.id}/`}><CourseMarkdown content={kp.title} inline /></Link></h3>
                {bridge ? <BridgeCards config={bridge} /> : <ThinkCard config={config} />}
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
