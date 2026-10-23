import Link from "next/link";
import { Title } from "@/components/island/Island";
import MirrorLab from "@/components/physics/MirrorLab";
import styles from "@/components/physics/StatesLab.module.css";

export const metadata = {
  title: "平面镜成像与光的反射实验室 · 初中物理",
  description: "转动入射光、折转纸板，探究光的反射定律；移动蜡烛找到像的位置，探究平面镜成像的特点。",
};

export default function MirrorLabPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <header className={styles.pageHeader}>
          <nav className={styles.breadcrumb} aria-label="页面路径">
            <Link href="/physics/">初中物理</Link>
            <span>/</span>
            <Link href="/physics/chapter/PHY-8A-04/">第四章 光现象</Link>
            <span>/</span>
            <Link href="/physics/lab/">实验室</Link>
            <span>/</span>
            <span>平面镜成像与光的反射</span>
          </nav>
          <Title as="h1" tone="teal">平面镜成像与光的反射实验室</Title>
          <p className={styles.lead}>先让一束激光射到平面镜上，改变入射角，看反射光怎样变，再把纸板折起来试一试；然后用玻璃板和两支相同的蜡烛，找到蜡烛的像，比较像和物体的大小、位置。</p>
        </header>

        <section className={styles.section}>
          <MirrorLab />
        </section>
      </div>
    </main>
  );
}
