"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "light");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("study-theme", next);
    setTheme(next);
  }

  const nextLabel = theme === "dark" ? "浅色" : "深色";

  return (
    <button
      aria-label={`切换到${nextLabel}主题`}
      className={styles.button}
      onClick={toggleTheme}
      title={`切换到${nextLabel}主题`}
      type="button"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} />
    </button>
  );
}
