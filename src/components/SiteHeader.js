"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getActiveMistakes, subscribeCourseV3 } from "@/lib/studyData";
import { Icon } from "./Icon";
import styles from "./SiteHeader.module.css";

const SUBJECTS = [
  { value: "math", label: "数学", root: "/math/", icon: "compass" },
  { value: "physics", label: "物理", root: "/physics/", icon: "magnet" },
  { value: "chemistry", label: "化学", root: "/chemistry/", icon: "water-cup" },
];

// 各科的页面入口，放在底部浮动导航条里；错题本常驻在页头右上角
const SECTIONS = {
  math: [
    { exact: true, href: "/math/", label: "首页与章节", icon: "home" },
    { href: "/math/thinking/", label: "思维提升", icon: "bulb" },
    { href: "/math/map/", label: "知识地图", icon: "map" },
    { href: "/math/formulas/", label: "公式速查", icon: "pencil" },
  ],
  chemistry: [
    { exact: true, href: "/chemistry/", label: "首页与单元", icon: "home" },
    { href: "/chemistry/thinking/", label: "思维提升", icon: "bulb" },
    { href: "/chemistry/map/", label: "知识地图", icon: "map" },
    { href: "/chemistry/formulas/", label: "公式速查", icon: "pencil" },
    { href: "/chemistry/periodic/", label: "元素周期表", icon: "book" },
  ],
  physics: [
    { exact: true, href: "/physics/", label: "首页", icon: "home", also: ["/physics/chapter", "/physics/kp"] },
    { href: "/physics/thinking/", label: "思维提升", icon: "bulb" },
    { href: "/physics/map/", label: "知识地图", icon: "map" },
    { href: "/physics/formulas/", label: "公式速查", icon: "pencil" },
    { href: "/physics/lab/", label: "实验室", icon: "flame" },
  ],
};

const MISTAKES_HREF = { math: "/mistakes/#math", physics: "/mistakes/#physics", chemistry: "/mistakes/#chemistry" };

function currentSubject(pathname) {
  return SUBJECTS.find((s) => pathname === s.root.slice(0, -1) || pathname.startsWith(s.root))?.value ?? "home";
}

function isActive({ exact, href, also = [] }, pathname) {
  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  const target = href === "/" ? "/" : href.replace(/\/$/, "");
  if (exact) return path === target;
  return [target, ...also].some((p) => path === p || path.startsWith(`${p}/`));
}

export function SiteHeader() {
  const pathname = usePathname();
  const subject = currentSubject(pathname);
  const mistakesHref = MISTAKES_HREF[subject] ?? "/mistakes/";
  const sections = SECTIONS[subject] ?? [];

  // 学科页显示本科的待复习数；首页和统一错题本页显示各科合计
  const studyKey = ["physics", "math", "chemistry"].includes(subject) ? subject : "math,physics,chemistry";
  const [pending, setPending] = useState(0);
  useEffect(() => {
    const subjects = studyKey.split(",");
    const update = () =>
      setPending(subjects.reduce((sum, s) => sum + getActiveMistakes(null, s).length, 0));
    update();
    const unsubscribes = subjects.map((s) => subscribeCourseV3(update, s));
    return () => unsubscribes.forEach((off) => off());
  }, [studyKey]);
  const mistakesActive = pathname.startsWith("/mistakes") || pathname.includes("/mistakes/");

  return (
    <>
      <header className={`${styles.header} no-print`}>
        <div className={styles.inner}>
          <Link aria-label="Gotcha 首页" className={styles.brand} href="/">
            <img alt="" className={styles.logo} height="36" src="/brand/gotcha.svg" width="36" />
            <strong>Gotcha</strong>
          </Link>

          <nav aria-label="科目" className={styles.subjects}>
            {SUBJECTS.map((item) => (
              <Link
                aria-current={item.value === subject ? "page" : undefined}
                className={styles.subject}
                href={item.root}
                key={item.value}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <Link
              aria-current={pathname.startsWith("/search") ? "page" : undefined}
              aria-label="搜索"
              className={`${styles.mistakes} ${styles.searchButton}`}
              href="/search/"
            >
              <Icon name="search" size={20} />
            </Link>
            <Link
              aria-current={mistakesActive ? "page" : undefined}
              className={styles.mistakes}
              href={mistakesHref}
            >
              <Icon name="bookmark" size={18} />
              <span className={styles.mistakesLabel}>错题本</span>
              {pending > 0 && (
                <span aria-label={`${pending} 道待复习`} className={styles.count}>
                  {pending > 99 ? "99+" : pending}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      {sections.length > 1 && <Dock pathname={pathname} sections={sections} />}
    </>
  );
}

/* 底部浮动导航条：往下读时收起，往上滑或读到底再出来 */
function Dock({ sections, pathname }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 80;
      if (y < 120 || nearBottom || y < last - 6) setHidden(false);
      else if (y > last + 6) setHidden(true);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  useEffect(() => setHidden(false), [pathname]);

  return (
    <nav aria-label="页面" className={`${styles.dock} no-print`} data-dock="" data-hidden={hidden ? "true" : "false"}>
      {sections.map((item) => {
        const active = isActive(item, pathname);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={styles.dockItem}
            href={item.href}
            key={item.href}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
