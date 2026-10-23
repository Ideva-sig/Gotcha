import Link from "next/link";
import { Title } from "@/components/island/Island";
import OhmLab from "@/components/physics/OhmLab";
import styles from "@/components/physics/StatesLab.module.css";

export const metadata = {
  title: "欧姆定律实验室 · 初中物理",
  description: "改变电压、更换电阻，读电流表和电压表，探究电流与电压、电阻的关系，练习伏安法测电阻和判断电路故障。",
};

export default function OhmLabPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <header className={styles.pageHeader}>
          <nav className={styles.breadcrumb} aria-label="页面路径">
            <Link href="/physics/">初中物理</Link>
            <span>/</span>
            <Link href="/physics/chapter/PHY-9-17/">第十七章 欧姆定律</Link>
            <span>/</span>
            <Link href="/physics/lab/">实验室</Link>
            <span>/</span>
            <span>欧姆定律</span>
          </nav>
          <Title as="h1" tone="teal">欧姆定律实验室</Title>
          <p className={styles.lead}>闭合开关，读电流表和电压表的示数。先探究电阻一定时电流与电压的关系，再探究电压一定时电流与电阻的关系，然后用伏安法测电阻，最后根据两个电表的示数判断电路出了什么故障。</p>
        </header>

        <section className={styles.section}>
          <OhmLab />
        </section>
      </div>
    </main>
  );
}
