import { CourseMarkdown } from "@/components/CourseMarkdown";
import { Card, Title } from "@/components/island/Island";
import { WeightTag } from "@/components/island/KpTags";
import styles from "./formulaEntry.module.css";

// 条目正文按“- **标签**：”切成字段；没有“核心公式”字段的条目返回 null，按旧样子整段显示。
export function parseFormulaFields(body) {
  const fields = {};
  let current = null;
  for (const line of body.replace(/^---[ \t]*$/gm, "").split("\n")) {
    const head = line.match(/^- \*\*(.+?)\*\*：(.*)$/);
    if (head) {
      current = head[1];
      fields[current] = head[2] ? [head[2]] : [];
    } else if (current) {
      fields[current].push(line.replace(/^ {2}/, ""));
    }
  }
  if (!fields["核心公式"]) return null;
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.join("\n").trim()]));
}

// “- $v$：速度（解释），单位：米每秒（m/s）” → 一行表格；有一行对不上就整段按原文显示。
function parseMeanings(text) {
  const rows = [];
  for (const line of text.split("\n").filter(Boolean)) {
    const m = line.match(/^- (\$[^$]+\$)：(.+)$/);
    if (!m) return null;
    const [what, unit = ""] = m[2].split(/，单位：/);
    const named = what.match(/^(.+?)（(.+)）$/);
    rows.push({ symbol: m[1], name: named ? named[1] : what, note: named ? named[2] : "", unit });
  }
  return rows;
}

function Md({ content, inline, className }) {
  return content ? <CourseMarkdown content={inline ? content : `${content}\n`} inline={inline} className={className} nestedLists /> : null;
}

function Meanings({ text }) {
  const rows = parseMeanings(text);
  if (!rows) return <Md content={text} />;
  return (
    <table className={styles.meanings}>
      <thead>
        <tr><th scope="col">符号</th><th scope="col">含义</th><th scope="col">单位</th></tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.symbol}>
            <td className={styles.symbol}><Md content={row.symbol} inline /></td>
            <td>
              <Md content={row.name} inline />
              {row.note && <span className={styles.note}><Md content={row.note} inline /></span>}
            </td>
            <td><Md content={row.unit} inline /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function FormulaEntry({ id, title, fields, tone }) {
  const meaningKey = Object.keys(fields).find((k) => k.includes("含义"));
  const pitfallKey = Object.keys(fields).find((k) => k.includes("避坑"));
  return (
    <article className={styles.entry} id={id}>
      <h3 className={styles.title}>
        <span>{title}</span>
        {fields["轻重"] && <WeightTag weight={fields["轻重"]} />}
      </h3>

      <div className={`${styles.core} tone-${tone}`}>
        <Md content={fields["核心公式"]} />
      </div>
      {fields["变形式"] && (
        <div className={styles.variants}>
          <span className={styles.label}>变形</span>
          <Md content={fields["变形式"]} />
        </div>
      )}

      {meaningKey && <Meanings text={fields[meaningKey]} />}

      {fields["适用条件"] && (
        <p className={styles.condition}>
          <span className={styles.label}>适用</span>
          <Md content={fields["适用条件"]} inline />
        </p>
      )}

      {pitfallKey && (
        <div className={styles.pitfall}>
          <Title as="h4" size="sm" tone="pink" variant="tab">踩坑提醒</Title>
          <Md content={fields[pitfallKey]} />
        </div>
      )}
    </article>
  );
}

// 页首“核心公式一览”：每条只放核心公式，点一下跳到那一条。
export function FormulaOverview({ items, tone }) {
  return (
    <ul className={styles.overview}>
      {items.map(({ id, title, fields }) => (
        <li key={id}>
          <Card as="a" hoverable className={styles.tile} href={`#${id}`}>
            <span className={styles.tileHead}>
              <span>{title.replace(/^\d+\.\s*/, "")}</span>
              {fields["轻重"] && <WeightTag weight={fields["轻重"]} />}
            </span>
            <span className={`${styles.tileCore} tone-${tone}`}>
              <Md content={fields["核心公式"]} />
            </span>
          </Card>
        </li>
      ))}
    </ul>
  );
}
