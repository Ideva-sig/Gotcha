// “破题钥匙”卡片：```think 代码块的解析。只认下面这几个字段，不执行任何东西。
// 物理：现象（看到什么）→ 模型（想成什么图，图必须有）→ 关系（写成什么式子）。
// 化学（三重表征）：宏观（看得见的）→ 微观（看不见的，配图）→ 符号（写出来的）。可选 招、结。
import extra from "./bridgeGlyphs.json";

import { THINK_MOVES, THINK_MOVES_CHEM } from "./thinkMoves.js";
export { THINK_MOVES, THINK_MOVES_CHEM };
export const THINK_GLYPHS = Object.keys(extra).filter((n) => n.startsWith("phy-") || n.startsWith("chem-"));

const KEYS = {
  现象: "see", 模型: "model", 关系: "relation",
  宏观: "see", 微观: "model", 符号: "relation",
  图: "glyph", 招: "move", 结: "takeaway",
};

export function parseThink(source) {
  const out = { kind: "", see: "", model: "", glyph: "", relation: "", move: "", takeaway: "" };
  for (const raw of String(source).split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(现象|模型|关系|宏观|微观|符号|图|招|结)\s*[:：]\s*(.*)$/);
    if (!m) throw new Error(`“破题钥匙”卡片格式错误：${line}`);
    if (m[1] === "宏观") out.kind = "triple";
    out[KEYS[m[1]]] = m[2].trim();
  }
  if (!out.kind) out.kind = "model";
  for (const k of ["see", "model", "glyph", "relation"]) {
    if (!out[k]) throw new Error("“破题钥匙”四行都要有（物理：现象、模型、图、关系；化学：宏观、微观、图、符号）");
  }
  const prefix = out.kind === "triple" ? "chem-" : "phy-";
  if (!THINK_GLYPHS.includes(out.glyph) || !out.glyph.startsWith(prefix)) throw new Error(`没有这个小图：${out.glyph}`);
  if (out.move && !(out.kind === "triple" ? THINK_MOVES_CHEM : THINK_MOVES).includes(out.move)) throw new Error(`没有这一招：${out.move}`);
  return out;
}

export function findThink(text) {
  const m = String(text).match(/```think\s*\n([\s\S]*?)```/);
  return m ? { source: m[1], index: m.index, length: m[0].length } : null;
}
