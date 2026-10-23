import Link from "next/link";
import { Title } from "@/components/island/Island";
import BuoyancyLab from "@/components/physics/BuoyancyLab";
import styles from "@/components/physics/StatesLab.module.css";

export const metadata = {
  title: "浮力实验室 · 初中物理",
  description: "用弹簧测力计把物体一点点浸入液体，看浮力跟什么有关、跟什么无关，再用溢水杯比一比浮力和排开液体所受的重力。",
};

export default function BuoyancyLabPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <header className={styles.pageHeader}>
          <nav className={styles.breadcrumb} aria-label="页面路径">
            <Link href="/physics/">初中物理</Link>
            <span>/</span>
            <Link href="/physics/chapter/PHY-8B-10/">第十章 浮力</Link>
            <span>/</span>
            <Link href="/physics/lab/">实验室</Link>
            <span>/</span>
            <span>浮力</span>
          </nav>
          <Title as="h1" tone="teal">浮力实验室</Title>
          <p className={styles.lead}>弹簧测力计下挂着一个物体，把它一点点放进液体里。先用称重法算出浮力，再看浮力跟浸入的体积、深度、液体有什么关系，最后用溢水杯比一比浮力和排开的液体所受的重力。g 取 10 N/kg。</p>
        </header>

        <section className={styles.section}>
          <BuoyancyLab />
        </section>
      </div>
    </main>
  );
}
