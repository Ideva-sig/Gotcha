import Link from "next/link";
import { Title } from "@/components/island/Island";
import LensLab from "@/components/physics/LensLab";
import styles from "@/components/physics/StatesLab.module.css";

export const metadata = {
  title: "凸透镜成像实验室 · 初中物理",
  description: "在光具座上移动发光物体和光屏，找到清晰的像，自己总结凸透镜成像的规律。",
};

export default function LensLabPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <header className={styles.pageHeader}>
          <nav className={styles.breadcrumb} aria-label="页面路径">
            <Link href="/physics/">初中物理</Link>
            <span>/</span>
            <Link href="/physics/chapter/PHY-8A-05/">第五章 透镜及其应用</Link>
            <span>/</span>
            <Link href="/physics/lab/">实验室</Link>
            <span>/</span>
            <span>凸透镜成像</span>
          </nav>
          <Title as="h1" tone="teal">凸透镜成像实验室</Title>
          <p className={styles.lead}>凸透镜固定在 50 cm 处，焦距 10 cm。把发光物体从远处慢慢移近，每到一个位置，都移动光屏找到最清楚的像：像的虚实、大小、正倒跟物距有什么关系？</p>
        </header>

        <section className={styles.section}>
          <LensLab />
        </section>
      </div>
    </main>
  );
}
