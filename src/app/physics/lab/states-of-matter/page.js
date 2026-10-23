import Link from "next/link";
import { Title } from "@/components/island/Island";
import StatesLab, { SixChanges } from "@/components/physics/StatesLab";
import styles from "@/components/physics/StatesLab.module.css";

export const metadata = {
  title: "物态变化实验室 · 初中物理",
  description: "给一烧杯冰加热、停火、放进冰柜，看温度—时间图像怎样画出来；再认一认六种物态变化。",
};

export default function StatesOfMatterLabPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <header className={styles.pageHeader}>
          <nav className={styles.breadcrumb} aria-label="页面路径">
            <Link href="/physics/">初中物理</Link>
            <span>/</span>
            <Link href="/physics/chapter/PHY-8A-03/">第三章 物态变化</Link>
            <span>/</span>
            <span>实验室</span>
          </nav>
          <Title as="h1" tone="teal">物态变化实验室</Title>
          <p className={styles.lead}>烧杯里是 −20 °C 的碎冰。按“加热”“停止加热”“放进冰柜”，盯住温度计和温度—时间图像：什么时候温度在变，什么时候不变？</p>
        </header>

        <section className={styles.section}>
          <StatesLab />
        </section>

        <section className={styles.section}>
          <Title as="h2" variant="layer" tone="purple">六种物态变化</Title>
          <div className={styles.sixCard}>
            <SixChanges />
          </div>
        </section>
      </div>
    </main>
  );
}
