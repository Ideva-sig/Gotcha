import Link from "next/link";
import { Title } from "@/components/island/Island";
import LampPowerLab from "@/components/physics/LampPowerLab";
import styles from "@/components/physics/StatesLab.module.css";

export const metadata = {
  title: "测量小灯泡的电功率实验室 · 初中物理",
  description: "用滑动变阻器改变小灯泡两端的电压，读电流表和电压表，测小灯泡的电功率，比较亮度与实际功率的关系。",
};

export default function LampPowerLabPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <header className={styles.pageHeader}>
          <nav className={styles.breadcrumb} aria-label="页面路径">
            <Link href="/physics/">初中物理</Link>
            <span>/</span>
            <Link href="/physics/chapter/PHY-9-18/">第十八章 电功率</Link>
            <span>/</span>
            <Link href="/physics/lab/">实验室</Link>
            <span>/</span>
            <span>测量小灯泡的电功率</span>
          </nav>
          <Title as="h1" tone="teal">测量小灯泡的电功率实验室</Title>
          <p className={styles.lead}>小灯泡上标着额定电压 2.5 V。先把滑片放在阻值最大处再闭合开关，用滑动变阻器控制灯两端的电压，使它低于、等于和略高于 2.5 V，读出电压和电流，算出电功率，比较灯的亮度。</p>
        </header>

        <section className={styles.section}>
          <LampPowerLab />
        </section>
      </div>
    </main>
  );
}
