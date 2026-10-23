import Link from "next/link";
import { Title } from "@/components/island/Island";
import LeverLab from "@/components/physics/LeverLab";
import styles from "@/components/physics/StatesLab.module.css";

export const metadata = {
  title: "杠杆实验室 · 初中物理",
  description: "先调平衡螺母，再在杠杆两侧挂钩码、用弹簧测力计拉，自己探究杠杆的平衡条件。",
};

export default function LeverLabPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <header className={styles.pageHeader}>
          <nav className={styles.breadcrumb} aria-label="页面路径">
            <Link href="/physics/">初中物理</Link>
            <span>/</span>
            <Link href="/physics/chapter/PHY-8B-12/">第十二章 简单机械</Link>
            <span>/</span>
            <Link href="/physics/lab/">实验室</Link>
            <span>/</span>
            <span>杠杆</span>
          </nav>
          <Title as="h1" tone="teal">杠杆实验室</Title>
          <p className={styles.lead}>杠杆的中点是支点，两侧各有 8 个等距的孔。先调平衡螺母让杠杆水平，再在两侧挂钩码，或者换成弹簧测力计去拉：动力、动力臂、阻力、阻力臂之间，到底满足什么关系时杠杆才平衡？</p>
        </header>

        <section className={styles.section}>
          <LeverLab />
        </section>
      </div>
    </main>
  );
}
