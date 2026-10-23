// “数形结合”卡片：```bridge 代码块的解析。只认下面这几个字段，不执行任何东西。
// mode: cards（一行一张，左式右图）或 hero（大字卡，两张并排）
// 每张卡以单独一行 --- 分隔，字段：式、图、形、色；可选一行 结（一句话小结）。
import extra from "./bridgeGlyphs.json";

export const BRIDGE_TONES = {
  green: "#197a60",
  red: "#c9554d",
  yellow: "#bf8d08",
  blue: "#287fc4",
};

// 图：小示意图的名字，冒号后可带一个参数（数轴上的数）。
export const BRIDGE_GLYPHS = [
  "parab-up",
  "parab-down",
  "parab-narrow",
  "parab-wide",
  "hyper-rect",
  "ray-gt",
  "ray-ge",
  "ray-lt",
  "ray-le",
  ...Object.keys(extra),
];

export function parseBridge(source) {
  const out = { mode: "cards", cards: [], takeaway: "" };
  let card = null;
  const push = () => {
    if (card && Object.keys(card).length) out.cards.push(card);
    card = {};
  };
  push();
  for (const raw of String(source).split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line === "---") { push(); continue; }
    const m = line.match(/^(mode|式|图|形|色|结)\s*[:：]\s*(.*)$/);
    if (!m) throw new Error(`数形结合卡片格式错误：${line}`);
    const [, key, value] = m;
    if (key === "mode") out.mode = value;
    else if (key === "结") out.takeaway = value;
    else card[{ 式: "expr", 图: "glyph", 形: "caption", 色: "tone" }[key]] = value;
  }
  push();
  out.cards = out.cards.filter((c) => c.expr || c.glyph);
  if (!["cards", "hero"].includes(out.mode)) throw new Error("mode 只能是 cards 或 hero");
  for (const c of out.cards) {
    if (!c.expr || !c.caption) throw new Error("每张卡都要有“式”和“形”");
    if (c.tone && !BRIDGE_TONES[c.tone]) throw new Error(`没有这个颜色：${c.tone}`);
    if (c.glyph && !BRIDGE_GLYPHS.includes(c.glyph.split(":")[0].trim())) throw new Error(`没有这个小图：${c.glyph}`);
  }
  return out;
}
