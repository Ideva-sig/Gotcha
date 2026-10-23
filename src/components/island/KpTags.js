// 全站统一的“含义标签”：颜色表示什么在这里定死，页面里只管用。
import { Tag } from "./Island";

// 轻重：重点（红，实心）/ 一般（蓝）/ 了解（棕）
const WEIGHT_TONE = { 重点: "red", 一般: "blue", 了解: "brown" };

// 学习状态：已掌握（绿，实心）/ 已完成（黄）/ 未开始（棕）
const STATUS_TONE = { 已掌握: "leaf", 已完成: "yellow", 未开始: "brown" };

// 错因：每种一个颜色，错题本里一眼能分
export const ERROR_TONE = {
  概念: "purple",
  公式: "blue",
  单位: "orange",
  计算: "yellow",
  审题: "teal",
  前置: "pink",
  未指定: "brown",
};

export function WeightTag({ weight = "一般", size = "sm" }) {
  return (
    <Tag size={size} tone={WEIGHT_TONE[weight] || "blue"} variant={weight === "重点" ? "solid" : "soft"}>
      {weight}
    </Tag>
  );
}

export function StatusTag({ status = "未开始", size = "sm", children }) {
  return (
    <Tag size={size} tone={STATUS_TONE[status] || "brown"} variant={status === "已掌握" ? "solid" : "soft"}>
      {children ?? status}
    </Tag>
  );
}

export function ErrorTag({ tag = "未指定", size = "sm", children }) {
  return (
    <Tag size={size} tone={ERROR_TONE[tag] || "brown"}>
      {children ?? tag}
    </Tag>
  );
}
