import Link from "next/link";
import { Title } from "@/components/island/Island";
import DensityLab from "@/components/physics/DensityLab";
import styles from "@/components/physics/StatesLab.module.css";

export const metadata = {
  title: "测密度实验室 · 初中物理",
  description: "先调平托盘天平，再用天平称质量、用量筒量体积，测出小石块和盐水的密度。",
};

export default function DensityLabPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <header className={styles.pageHeader}>
          <nav className={styles.breadcrumb} aria-label="页面路径">
            <Link href="/physics/">初中物理</Link>
            <span>/</span>
            <Link href="/physics/chapter/PHY-8A-06/">第六章 质量与密度</Link>
            <span>/</span>
            <Link href="/physics/lab/">实验室</Link>
            <span>/</span>
            <span>测密度</span>
          </nav>
          <Title as="h1" tone="teal">测密度实验室</Title>
          <p className={styles.lead}>先把游码拨到零刻度线、调平衡螺母，再左物右码称质量，用量筒测体积。小石块和盐水的密度各是多少？</p>
        </header>

        <section className={styles.section}>
          <DensityLab />
        </section>
      </div>
    </main>
  );
}
