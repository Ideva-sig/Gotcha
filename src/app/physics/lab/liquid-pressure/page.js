import Link from "next/link";
import { Title } from "@/components/island/Island";
import LiquidPressureLab from "@/components/physics/LiquidPressureLab";
import styles from "@/components/physics/StatesLab.module.css";

export const metadata = {
  title: "液体压强实验室 · 初中物理",
  description: "用 U 形管压强计研究液体内部的压强：转动探头看各个方向，放深看深度，换液体看密度。",
};

export default function LiquidPressureLabPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <header className={styles.pageHeader}>
          <nav className={styles.breadcrumb} aria-label="页面路径">
            <Link href="/physics/">初中物理</Link>
            <span>/</span>
            <Link href="/physics/chapter/PHY-8B-09/">第九章 压强</Link>
            <span>/</span>
            <Link href="/physics/lab/">实验室</Link>
            <span>/</span>
            <span>液体压强</span>
          </nav>
          <Title as="h1" tone="teal">液体压强实验室</Title>
          <p className={styles.lead}>压强计的探头是蒙着橡皮膜的空金属盒。把探头放进液体里，橡皮膜受到压强，U 形管两侧的液面就会出现高度差，高度差越大，说明橡皮膜受到的压强越大。改变探头的方向、深度，或者换一种液体，看看液体内部的压强有什么特点。</p>
        </header>

        <section className={styles.section}>
          <LiquidPressureLab />
        </section>
      </div>
    </main>
  );
}
