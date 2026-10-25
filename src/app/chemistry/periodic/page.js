import fs from "node:fs";
import { packPath } from "@/lib/contentPack.mjs";
import { PeriodicTable } from "@/components/PeriodicTable";
import { Title } from "@/components/island/Island";
import styles from "./periodic.module.css";

export const metadata = {
  title: "元素周期表",
  description: "118 种元素的图示周期表：点一个元素看它的原子序数、相对原子质量和生活里的用处，还能自测元素符号。",
};

export default function PeriodicPage() {
  // 仅在静态构建时读内容包里的周期表数据（由 export-course-json.py 从 course/chemistry/periodic.yml 导出）
  const { elements, junior } = JSON.parse(fs.readFileSync(packPath("chemistry", "periodic.json"), "utf8"));
  return (
    <main className="page-main">
      <div className={`page-container ${styles.page}`}>
        <header className={styles.header}>
          <Title as="h1" tone="green">元素周期表</Title>
          <p>
            点一个元素，看它的原子序数、相对原子质量，以及它在生活里的用处。相对原子质量用的是课本附录Ⅱ里的数值；
            “初中计算取”是做题时常用的整数（或 35.5）。前 20 号可以先背：氢氦锂铍硼，碳氮氧氟氖，钠镁铝硅磷，硫氯氩钾钙。
          </p>
        </header>

        <PeriodicTable elements={elements} junior={junior} />

        <section className={styles.section}>
          <Title as="h2" tone="blue" variant="layer">图上的小标记怎么读</Title>
          <img className={styles.legend} src="/periodic/legend.webp" alt="图示版周期表的读图说明：卡片各部分含义、状态图标、颜色分区" />
        </section>

        <section className={styles.section}>
          <Title as="h2" tone="teal" variant="layer">文字版（可放大看）</Title>
          <p className={styles.hint}>
            文字版列出了每个元素的性质和用途。<a href="/periodic/text-version.webp" target="_blank" rel="noreferrer">单独打开大图</a>，
            用两指放大阅读。
          </p>
        </section>

        <footer className={`${styles.credit} isl-rule-top`}>
          元素周期表图示版 © 2005–2016 Keith Enevoldsen（elements.wlonk.com）。中文翻译：邹超、张凯博士；校对：余珊珊；平面：周娇娇。
          本页的元素图片由原图裁切而来，依据
          <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans" target="_blank" rel="noreferrer">知识共享 署名-相同方式共享 4.0 国际许可协议（CC BY-SA 4.0）</a>
          使用，同样按此协议共享。
        </footer>
      </div>
    </main>
  );
}
