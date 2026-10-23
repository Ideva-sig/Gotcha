"use client";
import { useCourseSubject } from "./CourseSubject";
import katex from "katex";
import "katex/contrib/mhchem"; // 化学式、化学方程式用 \ce{...}
import styles from "./CourseMarkdown.module.css";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 讲义配色写死在公式里（打印用）；网页上换成主题变量，深色模式下也看得清
const PALETTE_VARS = {
  "#287fc4": "var(--accent)",
  "#c9554d": "var(--coral)",
  "#bf8d08": "var(--yellow)",
  "#197a60": "var(--green)",
};

function renderKaTeX(expr, isDisplay, subject) {
  try {
    const html = katex.renderToString(expr, {
      displayMode: isDisplay,
      throwOnError: false,
      strict: false,
    });
    if (subject === "math") return html;
    return html.replace(/color:\s*(#[0-9a-fA-F]{6})/g, (m, hex) => {
      const v = PALETTE_VARS[hex.toLowerCase()];
      return v ? `color:${v}` : m;
    });
  } catch (err) {
    const tag = isDisplay ? "div" : "span";
    const prefix = isDisplay ? "$$" : "$";
    return `<${tag} class="katex-fallback">${prefix}${escapeHtml(expr)}${prefix}</${tag}>`;
  }
}

function renderInlineFormatting(text) {
  let s = escapeHtml(text);
  // **bold**
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // `code`
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  // ![alt](src)：行内图片，如电路图选项；相对路径指向导出的课程素材
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const url = /^(https?:)?\//.test(src) ? src : `/app-data/physics/${src}`;
    return `<img class="${styles.inlineImage}" src="${url}" alt="${alt}" loading="lazy">`;
  });
  // [text](url)
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>',
  );
  return s;
}

// 手册可选的嵌套列表；默认保留现有讲义的渲染行为。
function renderNestedList(lines, start = 0, indent = 0) {
  const listItem = /^(\s*)([-*]|\d+\.)\s+(.*)$/;
  const first = lines[start].match(listItem);
  const tag = /^\d/.test(first[2]) ? "ol" : "ul";
  let html = `<${tag}>`;
  let index = start;
  let itemOpen = false;

  while (index < lines.length) {
    const line = lines[index];
    const match = line.match(listItem);
    const depth = match ? match[1].length : line.match(/^\s*/)[0].length;
    if (depth < indent) break;

    if (match && depth > indent) {
      const child = renderNestedList(lines, index, depth);
      html += child.html;
      index = child.next;
      continue;
    }

    if (match) {
      const nextTag = /^\d/.test(match[2]) ? "ol" : "ul";
      if (nextTag !== tag) break;
      if (itemOpen) html += "</li>";
      html += `<li>${renderInlineFormatting(match[3])}`;
      itemOpen = true;
    } else {
      const content = line.trim();
      // 展示公式块留在所属列表项中，不把 div 放进 p。
      html += /^\x02BM_\d+\x03$/.test(content)
        ? content
        : `<br>${renderInlineFormatting(content)}`;
    }
    index += 1;
  }

  if (itemOpen) html += "</li>";
  return { html: `${html}</${tag}>`, next: index };
}

export function parseCourseMarkdown(rawText, { inline = false, nestedLists = false, subject = "physics" } = {}) {
  if (!rawText) return "";
  let text = String(rawText);

  // 1. Extract block math $$...$$
  const blockMath = [];
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    blockMath.push(math.trim());
    return `\x02BM_${blockMath.length - 1}\x03`;
  });

  // 数学讲义也用单个 $ 包裹跨行 aligned；先抽成独立公式，避免被段落拆开。
  if (subject === "math") {
    text = text.replace(/\$(\\begin\{(aligned|cases)\}[^$]*?\\end\{\2\})\$/g, (_, math) => {
      blockMath.push(math.trim());
      return `\x02BM_${blockMath.length - 1}\x03`;
    });
  }

  // 2. Extract inline math $...$
  const inlineMath = [];
  text = text.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    inlineMath.push(math.trim());
    return `\x02IM_${inlineMath.length - 1}\x03`;
  });

  // If inline mode requested and no newlines/tables, render simple inline text
  if (inline && !text.includes("\n") && !text.includes("|")) {
    let res = renderInlineFormatting(text);
    res = res.replace(/\x02IM_(\d+)\x03/g, (_, idx) => {
      const math = inlineMath[Number(idx)];
      return renderKaTeX(math, false, subject);
    });
    return res.replaceAll('/app-data/physics/', `/app-data/${subject}/`);
  }

  // 3. Process tables
  text = text.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (match) => {
    const lines = match.trim().split(/\r?\n/);
    if (lines.length >= 2 && lines[1].includes("---")) {
      const headers = lines[0]
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      const rows = lines
        .slice(2)
        .map((line) => line.split("|").slice(1, -1).map((c) => c.trim()));

      let tableHtml = `<div class="${styles.tableWrap}"><table><thead><tr>`;
      headers.forEach((h) => {
        tableHtml += `<th>${renderInlineFormatting(h)}</th>`;
      });
      tableHtml += "</tr></thead><tbody>";
      rows.forEach((r) => {
        tableHtml += "<tr>";
        r.forEach((cell) => {
          tableHtml += `<td>${renderInlineFormatting(cell)}</td>`;
        });
        tableHtml += "</tr>";
      });
      tableHtml += "</tbody></table></div>";
      return tableHtml;
    }
    return match;
  });

  // 4. Process paragraphs and blocks
  // 列表项下面空一行、再缩进写的段落（比如单独一行的算式），仍属于这一项，跟这一项的文字对齐
  const paragraphs = [];
  for (const block of text.split(/\n\s*\n/)) {
    const prev = paragraphs.at(-1);
    if (prev && /^ {2,}\S/.test(block) && /^\s*(?:[-*]|\d+\.)\s+/m.test(prev.trim())) {
      paragraphs[paragraphs.length - 1] = `${prev.replace(/\s+$/, "")}\x04${block.trim().replace(/\n\s*/g, "\x04")}`;
    } else {
      paragraphs.push(block);
    }
  }
  const renderedParagraphs = paragraphs.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";

    if (trimmed.startsWith(`<div class="${styles.tableWrap}">`)) {
      return trimmed;
    }

    if (nestedLists && /^(?:[-*]|\d+\.)\s+/.test(trimmed)) {
      const lines = trimmed.split(/\n/);
      let html = "";
      let index = 0;
      while (index < lines.length) {
        const list = renderNestedList(lines, index);
        html += list.html;
        index = list.next;
      }
      return html;
    }

    // Unordered lists (- or *)
    if (/^[\*\-]\s+/m.test(trimmed)) {
      const lines = trimmed.split(/\n/);
      let listHtml = "<ul>";
      let inList = false;
      for (const line of lines) {
        const m = line.match(/^[\*\-]\s+(.*)$/);
        if (m) {
          listHtml += `<li>${renderInlineFormatting(m[1])}</li>`;
          inList = true;
        } else if (inList) {
          listHtml += `<br>${renderInlineFormatting(line)}`;
        } else {
          listHtml += renderInlineFormatting(line);
        }
      }
      listHtml += "</ul>";
      return listHtml;
    }

    // Ordered lists (1. 2.)
    if (/^\d+\.\s+/m.test(trimmed)) {
      const lines = trimmed.split(/\n/);
      let listHtml = "<ol>";
      for (const line of lines) {
        const m = line.match(/^\d+\.\s+(.*)$/);
        if (m) {
          listHtml += `<li>${renderInlineFormatting(m[1])}</li>`;
        } else {
          listHtml += `<br>${renderInlineFormatting(line)}`;
        }
      }
      listHtml += "</ol>";
      return listHtml;
    }

    // Blockquote (>)
    if (trimmed.startsWith(">")) {
      const quoteText = trimmed.replace(/^>\s?/gm, "");
      if (nestedLists) {
        const lines = quoteText.split(/\n/);
        const start = lines.findIndex((line) => /^(?:[-*]|\d+\.)\s+/.test(line));
        if (start !== -1) {
          const lead = renderInlineFormatting(lines.slice(0, start).join("\n"));
          return `<blockquote>${lead}${renderNestedList(lines, start).html}</blockquote>`;
        }
      }
      return `<blockquote>${renderInlineFormatting(quoteText)}</blockquote>`;
    }

    // Standalone block math
    if (/^\x02BM_\d+\x03$/.test(trimmed)) {
      return trimmed;
    }

    // Normal paragraph with line breaks
    const lines = trimmed.split(/\n/);
    const content = lines.map((l) => renderInlineFormatting(l)).join("<br>");
    return `<p>${content}</p>`;
  });

  let resultHtml = renderedParagraphs.join("\n").replaceAll("\x04", "<br>");

  // 5. Restore and render block math
  resultHtml = resultHtml.replace(/\x02BM_(\d+)\x03/g, (_, idx) => {
    const math = blockMath[Number(idx)];
    return `<div class="${styles.displayMath}">${renderKaTeX(math, true, subject)}</div>`;
  });

  // 6. Restore and render inline math
  resultHtml = resultHtml.replace(/\x02IM_(\d+)\x03/g, (_, idx) => {
    const math = inlineMath[Number(idx)];
    return renderKaTeX(math, false, subject);
  });

  return resultHtml.replaceAll('/app-data/physics/', `/app-data/${subject}/`);
}

export function CourseMarkdown({
  content,
  className = "",
  inline = false,
  nestedLists = false,
  as: Component = inline ? "span" : "div",
}) {
  const subject = useCourseSubject();
  const html = parseCourseMarkdown(content, { inline, nestedLists, subject });
  const wrapperClass = `${styles.markdown} ${inline ? styles.inline : ""} ${className}`.trim();

  return (
    <Component
      className={wrapperClass}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// 标题、关系名称等短文字：带 $ 的公式用同一渲染器，其余原样。
export function CourseText({ children }) {
  return typeof children === "string" && children.includes("$")
    ? <CourseMarkdown content={children} inline /> : children;
}
