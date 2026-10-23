import Link from "next/link";
import { Card, Title } from "@/components/island/Island";
import { PHYSICS_LABS } from "@/lib/labs";
import styles from "@/components/physics/StatesLab.module.css";

export const metadata = {
  title: "实验室 · 初中物理",
  description: "动手做的物理实验：自己操作，看现象怎样变化。",
};

export default function PhysicsLabsPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <header className={styles.pageHeader}>
          <nav className={styles.breadcrumb} aria-label="页面路径">
            <Link href="/physics/">初中物理</Link>
            <span>/</span>
            <span>实验室</span>
          </nav>
          <Title as="h1" tone="teal">实验室</Title>
          <p className={styles.lead}>自己动手做实验：拖一拖、按一按，看现象怎样变化，再把规律找出来。</p>
        </header>

        <section className={styles.labList}>
          {PHYSICS_LABS.map((lab) => (
            <Card key={lab.href} className={styles.labItem}>
              <span className={styles.labChapter}>{lab.chapterTitle}</span>
              <Title as="h2" variant="tab" tone="purple">{lab.title}</Title>
              <p>{lab.text}</p>
              <Link className="island-btn island-btn--primary" href={lab.href}>进入实验室</Link>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
