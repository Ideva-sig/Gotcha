"use client";

import { useRef } from "react";
import { Icon } from "./Icon";
import styles from "./SearchBox.module.css";

// 搜索框：首页用提交跳转，搜索页用实时输入。16px 字号，iPad 点进去不会自动放大。
export function SearchBox({ value, onChange, onSubmit, autoFocus, large }) {
  const inputRef = useRef(null);
  return (
    <form
      className={`${styles.box} ${large ? styles.large : ""}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(inputRef.current?.value ?? "");
      }}
      role="search"
    >
      <Icon name="search" size={large ? 28 : 24} />
      <input
        aria-label="搜索知识点、公式、题目"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        autoFocus={autoFocus}
        className={styles.input}
        enterKeyHint="search"
        onChange={(event) => onChange?.(event.target.value)}
        placeholder="搜知识点、公式、题目"
        ref={inputRef}
        spellCheck={false}
        type="search"
        value={value}
      />
      {value && (
        <button
          aria-label="清空"
          className={styles.clear}
          onClick={() => {
            onChange?.("");
            inputRef.current?.focus();
          }}
          type="button"
        >
          <Icon name="close" size={16} />
        </button>
      )}
      <button className={`island-btn island-btn--primary ${styles.go}`} type="submit">搜索</button>
    </form>
  );
}
