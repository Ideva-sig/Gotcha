import { useSyncExternalStore } from "react";

// 数学当前选的课本（"all" 表示全部）。存在本机，数学首页的章节列表和知识地图共用。
const KEY = "road2.mathBook";
const EVENT = "road2-mathbook";

export const MATH_BOOKS = [
  { key: "7A", title: "七年级上册", short: "七上" },
  { key: "7B", title: "七年级下册", short: "七下" },
  { key: "8A", title: "八年级上册", short: "八上" },
  { key: "8B", title: "八年级下册", short: "八下" },
  { key: "9A", title: "九年级上册", short: "九上" },
];

function read() {
  try {
    return window.localStorage.getItem(KEY) || "all";
  } catch (_) {
    return "all";
  }
}

function subscribe(callback) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function setMathBook(value) {
  try {
    window.localStorage.setItem(KEY, value);
  } catch (_) {
    // 本机存不了时，这次选择只在当前页面有效
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useMathBook() {
  return useSyncExternalStore(subscribe, read, () => "all");
}
