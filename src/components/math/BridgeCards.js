"use client";
import { CourseMarkdown } from "../CourseMarkdown";
import { BRIDGE_TONES } from "@/lib/bridgeCards";
import extra from "@/lib/bridgeGlyphs.json";
import styles from "./BridgeCards.module.css";

const GREY = "#9aa5a8";

// 小示意图：图形必须画准，参数写在这里，不让 AI 生图。第 0 秒就是完整静态图。
function Glyph({ spec, color }) {
  const [name, arg = ""] = spec.split(":").map((s) => s.trim());
  const stroke = { fill: "none", stroke: color, strokeWidth: 4.5, strokeLinecap: "round" };
  const ref = { fill: "none", stroke: GREY, strokeWidth: 3, strokeDasharray: "5 4", strokeLinecap: "round" };
  const axis = { stroke: GREY, strokeWidth: 1.5 };
  let body = null;

  if (name.startsWith("parab")) {
    const up = name !== "parab-down";
    const narrow = [44, 106];
    const normal = [22, 128];
    const wide = [10, 140];
    const curve = ([a, b]) => `M${a} 8 Q75 150 ${b} 8`;
    body = (
      <>
        <line {...axis} strokeDasharray="3 3" x1="75" x2="75" y1="4" y2="86" />
        {name === "parab-narrow" && <path {...ref} d={curve(normal)} />}
        {name === "parab-wide" && <path {...ref} d={curve(narrow)} />}
        {name === "parab-up" && <path {...stroke} d={curve(normal)} />}
        {name === "parab-narrow" && <path {...stroke} d={curve(narrow)} />}
        {name === "parab-wide" && <path {...stroke} d={curve(wide)} />}
        {name === "parab-down" && <path {...stroke} d="M22 82 Q75 -60 128 82" />}
        <circle cx="75" cy={up ? 79 : 11} fill={color} r="5" />
      </>
    );
  } else if (name === "hyper-rect") {
    const ox = 22;
    const oy = 78;
    const k = 1000;
    const pts = [];
    for (let X = 14; X <= 112; X += 2) pts.push(`${ox + X},${(oy - k / X).toFixed(1)}`);
    const dot = (X) => [ox + X, oy - k / X];
    const [px, py] = dot(40);
    const [qx, qy] = dot(25);
    body = (
      <>
        <rect fill={color} fillOpacity="0.16" height={oy - py} width={px - ox} x={ox} y={py} />
        <rect fill="none" height={oy - qy} stroke={color} strokeDasharray="4 3" strokeWidth="2" width={qx - ox} x={ox} y={qy} />
        <line {...axis} x1={ox} x2="140" y1={oy} y2={oy} />
        <line {...axis} x1={ox} x2={ox} y1="4" y2={oy} />
        <polyline fill="none" points={pts.join(" ")} stroke={color} strokeLinecap="round" strokeWidth="4.5" />
        <circle cx={px} cy={py} fill={color} r="4.5" />
        <circle cx={qx} cy={qy} fill="#fff" r="4" stroke={color} strokeWidth="2" />
      </>
    );
  } else if (name.startsWith("ray")) {
    const right = name.endsWith("gt") || name.endsWith("ge");
    const closed = name.endsWith("ge") || name.endsWith("le");
    const x0 = 75;
    const y0 = 40;
    const end = right ? 138 : 12;
    const dir = right ? -1 : 1;
    body = (
      <>
        <line {...axis} x1="8" x2="142" y1={y0} y2={y0} />
        {[-2, -1, 0, 1, 2].map((i) => (
          <line {...axis} key={i} x1={x0 + i * 30} x2={x0 + i * 30} y1={y0 - 4} y2={y0 + 4} />
        ))}
        <line {...stroke} strokeWidth="6" x1={x0} x2={end} y1={y0} y2={y0} />
        <path {...stroke} d={`M${end + dir * 9} ${y0 - 8} L${end} ${y0} L${end + dir * 9} ${y0 + 8}`} strokeWidth="3.5" strokeLinejoin="round" />
        <circle cx={x0} cy={y0} fill={closed ? color : "#fff"} r="7" stroke={color} strokeWidth="3.5" />
        {arg && <text fill="#2b3a3f" fontSize="14" fontWeight="700" textAnchor="middle" x={x0} y={y0 + 28}>{arg}</text>}
      </>
    );
  }
  if (!body && extra[name]) {
    return (
      <svg
        aria-hidden="true"
        className={styles.glyph}
        dangerouslySetInnerHTML={{ __html: extra[name] }}
        style={{ color }}
        viewBox="0 0 150 90"
      />
    );
  }
  return (
    <svg aria-hidden="true" className={styles.glyph} viewBox="0 0 150 90">
      {body}
    </svg>
  );
}

function Card({ card, hero }) {
  const color = BRIDGE_TONES[card.tone || "green"];
  return (
    <li className={`${styles.card} ${hero ? styles.hero : ""}`} style={{ "--c": color }}>
      <div className={styles.expr}>
        <span className={styles.label}>看到式子</span>
        <CourseMarkdown className={styles.formula} content={card.expr} inline />
      </div>
      <span aria-hidden="true" className={styles.arrow}>⇄</span>
      <div className={styles.pic}>
        {card.glyph && <Glyph color={color} spec={card.glyph} />}
        <p className={styles.caption}>
          <span className={styles.label2}>图上这样</span>
          <CourseMarkdown content={card.caption} inline />
        </p>
      </div>
    </li>
  );
}

export default function BridgeCards({ config }) {
  const hero = config.mode === "hero";
  return (
    <div className={styles.wrap}>
      <ul className={`${styles.list} ${hero ? styles.heroList : ""}`}>
        {config.cards.map((card, i) => (
          <Card card={card} hero={hero} key={i} />
        ))}
      </ul>
      {config.takeaway && (
        <p className={styles.takeaway}>
          <CourseMarkdown content={config.takeaway} inline />
        </p>
      )}
    </div>
  );
}
