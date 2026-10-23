#!/usr/bin/env node
/**
 * 校验 Markdown 中的数学/化学公式渲染（KaTeX + mhchem）
 *
 * 用法：
 *   node scripts/check-math-render.mjs course/chemistry/g9a-01-intro ...
 */

import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import 'katex/contrib/mhchem';

/**
 * 抽取 Markdown 文本中的所有 $...$ 和 $$...$$ 公式（忽略代码块；\$ 转义不算）
 * 返回数组: [{ file, line, display, raw, content }]
 */
function extractFormulas(text, filePath) {
  const formulas = [];
  const len = text.length;
  let i = 0;
  let line = 1;

  while (i < len) {
    // 1. 检查行首围栏代码块
    const isLineStart = (i === 0 || text[i - 1] === '\n');
    if (isLineStart) {
      const rest = text.slice(i);
      const match = rest.match(/^[ ]{0,3}(`{3,}|~{3,})/);
      if (match) {
        const fence = match[1];
        const fenceChar = fence[0];
        const fenceLen = fence.length;
        // 跳过围栏起始行
        let lineEnd = text.indexOf('\n', i);
        if (lineEnd === -1) {
          break;
        }
        i = lineEnd + 1;
        line++;
        // 查找闭合围栏行
        while (i < len) {
          const nextLineEnd = text.indexOf('\n', i);
          const currentLine = nextLineEnd === -1 ? text.slice(i) : text.slice(i, nextLineEnd);
          const closeMatch = currentLine.match(/^[ ]{0,3}(`{3,}|~{3,})/);
          if (closeMatch && closeMatch[1][0] === fenceChar && closeMatch[1].length >= fenceLen) {
            i = nextLineEnd === -1 ? len : nextLineEnd + 1;
            line++;
            break;
          }
          i = nextLineEnd === -1 ? len : nextLineEnd + 1;
          line++;
        }
        continue;
      }
    }

    const ch = text[i];
    if (ch === '\n') {
      line++;
      i++;
      continue;
    }

    // 2. 检查行内代码 `...`
    if (ch === '`') {
      let run = 1;
      while (i + run < len && text[i + run] === '`') {
        run++;
      }
      const closeIdx = text.indexOf('`'.repeat(run), i + run);
      if (closeIdx !== -1) {
        for (let k = i; k < closeIdx + run; k++) {
          if (text[k] === '\n') line++;
        }
        i = closeIdx + run;
      } else {
        i += run;
      }
      continue;
    }

    // 3. 转义字符（如 \$）
    if (ch === '\\') {
      if (i + 1 < len) {
        if (text[i + 1] === '\n') line++;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    // 4. Display 模式 $$...$$
    if (ch === '$' && i + 1 < len && text[i + 1] === '$') {
      const startLine = line;
      const contentStart = i + 2;
      let j = contentStart;
      let found = false;
      let curLine = line;

      while (j < len) {
        if (text[j] === '\n') {
          curLine++;
        } else if (text[j] === '\\' && j + 1 < len) {
          if (text[j + 1] === '\n') curLine++;
          j += 2;
          continue;
        } else if (text[j] === '$' && j + 1 < len && text[j + 1] === '$') {
          found = true;
          break;
        }
        j++;
      }

      if (found) {
        const content = text.slice(contentStart, j);
        const raw = text.slice(i, j + 2);
        formulas.push({
          file: filePath,
          line: startLine,
          display: true,
          raw,
          content,
        });
        line = curLine;
        i = j + 2;
        continue;
      }
    }

    // 5. Inline 模式 $...$
    if (ch === '$') {
      const startLine = line;
      const contentStart = i + 1;
      let j = contentStart;
      let found = false;
      let curLine = line;

      while (j < len) {
        if (text[j] === '\n') {
          curLine++;
          // 行内公式遇到空行（段落结束）终止匹配
          if (j + 1 < len && (text[j + 1] === '\n' || (text[j + 1] === '\r' && j + 2 < len && text[j + 2] === '\n'))) {
            break;
          }
        } else if (text[j] === '\\' && j + 1 < len) {
          if (text[j + 1] === '\n') curLine++;
          j += 2;
          continue;
        } else if (text[j] === '$') {
          found = true;
          break;
        }
        j++;
      }

      if (found) {
        const content = text.slice(contentStart, j);
        const raw = text.slice(i, j + 1);
        formulas.push({
          file: filePath,
          line: startLine,
          display: false,
          raw,
          content,
        });
        line = curLine;
        i = j + 1;
        continue;
      }
    }

    i++;
  }

  return formulas;
}

function collectFiles(args) {
  const files = [];
  for (const arg of args) {
    if (!fs.existsSync(arg)) {
      console.warn(`警告：路径不存在 ${arg}`);
      continue;
    }
    const stat = fs.statSync(arg);
    if (stat.isDirectory()) {
      for (const name of ['lesson.md', 'questions.md']) {
        const p = path.join(arg, name);
        if (fs.existsSync(p)) {
          files.push(p);
        }
      }
    } else if (stat.isFile() && arg.endsWith('.md')) {
      files.push(arg);
    }
  }
  return files;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('用法: node scripts/check-math-render.mjs <章目录...>');
    process.exit(1);
  }

  const files = collectFiles(args);
  if (files.length === 0) {
    console.error('未找到任何 lesson.md 或 questions.md 文件');
    process.exit(1);
  }

  let totalFormulas = 0;
  let totalErrors = 0;

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const formulas = extractFormulas(text, file);

    for (const f of formulas) {
      totalFormulas++;
      try {
        katex.renderToString(f.content, {
          throwOnError: true,
          strict: 'error',
          displayMode: f.display,
        });
      } catch (err) {
        totalErrors++;
        // 单行化展示公式避免日志乱序
        const cleanRaw = f.raw.replace(/\r?\n/g, ' ');
        console.error(`${f.file}:${f.line} ${cleanRaw} ${err.message}`);
      }
    }
  }

  console.log(`共 ${totalFormulas} 处公式，${totalErrors} 个错误`);
  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
