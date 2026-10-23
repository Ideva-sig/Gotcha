// 注意：这里的静态 import 要逐科写出来（打包器需要看到固定路径），科目集合的唯一来源是 contentPack.mjs 的 SUBJECTS；新增科目时两处都要改。
import physicsIndex from "@content-pack/physics/index.json";
import mathIndex from "@content-pack/math/index.json";
import chemistryIndex from "@content-pack/chemistry/index.json";

export const BOOK_NAMES = {
  "7A": "七年级上册",
  "7B": "七年级下册",
  "9A": "九年级上册",
  "9B": "九年级下册",
  "8A": "八年级上册",
  "8B": "八年级下册",
  "9": "九年级全一册",
};

export const WEIGHT_LABELS = {
  "重点": "重点",
  "一般": "一般",
  "了解": "了解",
};

export const ERROR_TAGS = ["概念", "公式", "单位", "计算", "审题", "前置"];

/**
 * 解析回看或前置知识点指引目标
 */
export function resolvePhysicsTarget(targetId, subject = "physics") {
  if (subject === "math") {
    const kp = mathIndex.kps?.[targetId];
    if (kp?.available) return { type: "kp", id: targetId, text: `${targetId.replace(/^MATH-[^-]+-/, "")} ${kp.title}`, href: `/math/kp/${targetId}/` };
    if (kp) return { type: "text", text: `${BOOK_NAMES[kp.chapter?.split("-")[1]] || ""} 课本 p.${kp.page} 《${kp.section_title || kp.title}》` };
    // 尚未建图的数学前置：按正式编号给出册别和节号，不编造页码。
    const parts = targetId?.match(/^MATH-([^-]+)-(\d+)-(\d+)[a-z]?$/);
    if (parts) return { type: "text", text: `${BOOK_NAMES[parts[1]] || parts[1]} 课本 ${Number(parts[2])}.${parts[3]} 节` };
    return { type: "text", text: targetId || "本章知识点" };
  }
  if (subject === "chemistry") {
    const kp = chemistryIndex.kps?.[targetId];
    if (kp?.available) return { type: "kp", id: targetId, text: `${targetId.replace(/^CHEM-[^-]+-0?/, "")} ${kp.title}`, href: `/chemistry/kp/${targetId}/` };
    if (kp) return { type: "text", text: `${BOOK_NAMES[kp.chapter?.split("-")[1]] || ""} 课本 p.${kp.page} 《${kp.section_title || kp.title}》` };
    if (targetId?.startsWith("PHY-")) return { type: "cross", text: `物理：${targetId.replace("PHY-", "")}` };
    if (targetId?.startsWith("MATH-")) return { type: "cross", text: `数学：${targetId.replace("MATH-", "")}` };
    return { type: "text", text: targetId || "本单元知识点" };
  }
  if (!targetId) return { type: "text", text: "本章知识点" };

  if (targetId.startsWith("CHEM-")) {
    return { type: "cross", text: `化学：${targetId.replace("CHEM-", "")}` };
  }
  if (targetId.startsWith("MATH-")) {
    return { type: "cross", text: `数学：${targetId.replace("MATH-", "")}` };
  }

  const kps = physicsIndex.kps || {};

  // 1. 精确匹配
  if (kps[targetId]) {
    const kp = kps[targetId];
    if (kp.available) {
      const code = targetId.replace(/^MATH-[^-]+-/, "").replace(/^PHY-9-/, "").replace(/^PHY-/, "");
      return {
        type: "kp",
        id: targetId,
        text: `${code} ${kp.title}`,
        href: `/physics/kp/${targetId}/`,
      };
    }
    const book = BOOK_NAMES[kp.chapter ? kp.chapter.split("-")[1] : "8A"] || "课本";
    return {
      type: "text",
      text: `${book} 课本 p.${kp.page} 《${kp.section_title || kp.title}》`,
    };
  }

  // 2. 前缀匹配
  const matchedKey = Object.keys(kps).find(
    (k) => k.startsWith(targetId) || targetId.startsWith(k),
  );
  if (matchedKey) {
    const kp = kps[matchedKey];
    if (kp.available) {
      const code = matchedKey.replace(/^MATH-[^-]+-/, "").replace(/^PHY-9-/, "").replace(/^PHY-/, "");
      return {
        type: "kp",
        id: matchedKey,
        text: `${code} ${kp.title}`,
        href: `/physics/kp/${matchedKey}/`,
      };
    }
    const bookPart = kp.chapter ? kp.chapter.split("-")[1] : "";
    const book = BOOK_NAMES[bookPart] || "八年级";
    return {
      type: "text",
      text: `${book} 课本 p.${kp.page} 《${kp.section_title || kp.title}》`,
    };
  }

  return { type: "text", text: targetId };
}
