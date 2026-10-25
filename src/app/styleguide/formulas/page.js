import fs from "node:fs";
import { packPath } from "@/lib/contentPack.mjs";
import { CourseMarkdown } from "@/components/CourseMarkdown";
import { FormulaEntry, FormulaOverview, parseFormulaFields } from "@/components/FormulaEntry";
import { Title } from "@/components/island/Island";
import handbook from "@/components/handbook.module.css";
import styles from "./formulas.module.css";

export const metadata = {
  title: "公式速查样板",
  robots: { index: false },
};

// 样板：物理公式速查“力学与运动学”的前 3 条，新排法和现在的排法上下对照。
function sampleEntries() {
  const source = fs.readFileSync(packPath("physics", "formulas.md"), "utf8");
  const [, mechanics] = source.split(/^## /m);
  const [, ...entries] = mechanics.split(/^### /m);
  return entries.slice(0, 3).map((entry) => {
    const nl = entry.indexOf("\n");
    const title = entry.slice(0, nl).trim();
    const body = entry.slice(nl + 1);
    return { id: `sample-${title.match(/^(\d+)\./)[1]}`, title, body, fields: parseFormulaFields(body) };
  });
}

export default function FormulaSample() {
  const items = sampleEntries();
  return (
    <main className="page-main">
      <div className={`page-container ${handbook.handbook}`}>
        <Title as="h1" tone="green">公式速查样板</Title>
        <p className={styles.intro}>物理“力学与运动学”前 3 条。上面是新排法，下面是现在的样子。</p>

        <section className={styles.part}>
          <Title as="h2" tone="blue" variant="layer">核心公式一览</Title>
          <FormulaOverview items={items} tone="blue" />
        </section>

        <section className={styles.part}>
          <Title as="h2" tone="blue" variant="layer">新排法</Title>
          {items.map((item) => (
            <div className={styles.entryGap} key={item.id}>
              <FormulaEntry id={item.id} title={item.title} fields={item.fields} tone="blue" />
            </div>
          ))}
        </section>

        <section className={styles.part}>
          <Title as="h2" tone="brown" variant="layer">现在的样子</Title>
          {items.map((item) => (
            <div className={handbook.entry} key={item.id}>
              <h3>{item.title}</h3>
              <CourseMarkdown content={`${item.body.replace(/^---[ \t]*$/gm, "").trim()}\n`} nestedLists />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
