"use client";

import { MATH_BOOKS, setMathBook, useMathBook } from "@/lib/mathBook";
import styles from "./MathBookChips.module.css";

// 数学看哪一册：数学首页的章节列表和知识地图共用，选择存在本机
export function MathBookChips({ books = MATH_BOOKS }) {
  const current = useMathBook();
  const items = [{ key: "all", short: "全部" }, ...books];
  return (
    <div aria-label="看哪一册" className={styles.chips} role="group">
      {items.map((b) => (
        <button
          aria-pressed={current === b.key}
          key={b.key}
          onClick={() => setMathBook(b.key)}
          type="button"
        >
          {b.short}
        </button>
      ))}
    </div>
  );
}
