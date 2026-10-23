#!/usr/bin/env python3
"""把 course/ 中的一章（lesson.md + questions.md）排成学生试读版：网页 + A4 打印 PDF。

用法：
  /usr/bin/python3 scripts/build-course-preview.py course/physics/g9-13-internal-energy

需要：PyYAML（macOS 自带的 /usr/bin/python3 已有）、项目里的 katex（npm install 后即有）。
生成 PDF 需要 Chromium 内核：默认使用 Playwright 缓存的 chrome-headless-shell，也可用 CHROME_BIN 指定。
输出：
  output/preview/<章目录名>/index.html  （网页，图片和公式样式一并复制）
  output/pdf/student-trial-<章目录名>.pdf
"""
import glob
import html
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("缺少 PyYAML。请用 macOS 自带的 /usr/bin/python3 运行，或先安装 PyYAML。")

ROOT = Path(__file__).resolve().parent.parent
FIGURE_ROOT = None  # 当前章节目录，build() 时设置；用于内联 SVG
INLINED_SVGS = 0    # 内联的 SVG 张数，用于检查结构完整
ERROR_TAGS = ["概念", "公式", "单位", "计算", "审题", "前置"]
BOOK_NAMES = {"8A": "八上", "8B": "八下", "9": "九全"}


# ---------- 读取 ----------

def strip_frontmatter(text):
    if text.startswith("---\n"):
        end = text.index("\n---\n", 4)
        return yaml.safe_load(text[4:end]), text[end + 5:]
    return {}, text


def load_sections_index():
    """课本节编号 → 可读名称，如 PHY-8A-06-2 → 八上 6.2 密度（p.144）。"""
    names = {}
    path = ROOT / "course/physics/textbook-sections.md"
    for code, book, ch, sec, title in re.findall(
        r"`(PHY-(8A|8B|9)-(\d\d)-(\d))` (.+)", path.read_text(encoding="utf-8")
    ):
        names[code] = f"{BOOK_NAMES[book]} {int(ch)}.{sec} {title}"
    return names


def load_kp_index():
    """知识点编号 → 可读名称，如 PHY-8A-06-4a → 八上 6.4a 用密度求质量、体积，鉴别物质（p.152）。"""
    names = {}
    for sec in yaml.safe_load((ROOT / "course/physics/kp-map.yml").read_text(encoding="utf-8")):
        _, book, ch, num = sec["section"].split("-")
        for kp in sec.get("kps") or []:
            names[kp["id"]] = f'{BOOK_NAMES[book]} {int(ch)}.{num}{kp["id"][-1]} {kp["title"]}（p.{sec["page"]}）'
    return names


def load_questions(path):
    _, text = strip_frontmatter(path.read_text(encoding="utf-8"))
    questions = {}
    for block in re.split(r"\n(?=### Q-)", text)[1:]:
        qid = block.split("\n", 1)[0][4:].strip()
        meta = yaml.safe_load(re.search(r"```yaml\n(.*?)```", block, re.S).group(1))
        body = re.split(r"\n---\s*$", block, flags=re.M)[0]
        parts = re.split(r"^\*\*(题干|答案|解析)\*\*(.*)$", body, flags=re.M)
        fields = {}
        for i in range(1, len(parts), 3):
            fields[parts[i]] = (parts[i + 1].strip(), parts[i + 2].strip())
        questions[qid] = {"id": qid, "meta": meta, **fields}
    return questions


def load_lesson(path):
    front, text = strip_frontmatter(path.read_text(encoding="utf-8"))
    chunks = re.split(r"\n(?=## )", text)
    head = chunks[0]
    title = re.search(r"^# (.+)$", head, re.M).group(1)
    intro = re.sub(r"^# .+$", "", head, flags=re.M).strip()
    prereq, kps = None, []
    for chunk in chunks[1:]:
        heading = chunk.split("\n", 1)[0][3:].strip()
        body = re.sub(r"\n---\s*$", "", chunk.split("\n", 1)[1]).strip()
        if heading == "本章前置自查":
            prereq = body
            continue
        meta = yaml.safe_load(re.search(r"```yaml\n(.*?)```", body, re.S).group(1))
        body = re.sub(r"```yaml\n.*?```", "", body, flags=re.S).strip()
        code, name = heading.split(" ", 1)
        subs = []
        for sub in re.split(r"\n(?=### )", "\n" + body)[1:]:
            sub_title = sub.split("\n", 1)[0][4:].strip()
            subs.append((sub_title, sub.split("\n", 1)[1].strip() if "\n" in sub else ""))
        kps.append({"code": code, "name": name, "meta": meta, "subs": subs})
    return front, title, intro, prereq, kps


# ---------- 公式 ----------

class MathRenderer:
    """收集全部公式，一次性交给 KaTeX 渲染。"""

    def __init__(self):
        self.items = []

    def stash(self, text):
        def repl(m):
            display = m.group(1) is not None
            self.items.append((m.group(1) if display else m.group(2), display))
            return f"\x00{len(self.items) - 1}\x00"

        return re.sub(r"\$\$([\s\S]+?)\$\$|\$([^$\n]+)\$", repl, text)

    def render_all(self):
        script = (
            "const katex=require('katex');require('katex/contrib/mhchem');let s='';process.stdin.on('data',d=>s+=d);"
            "process.stdin.on('end',()=>{const a=JSON.parse(s);"
            "console.log(JSON.stringify(a.map(([e,d])=>katex.renderToString(e,{displayMode:d,throwOnError:true,strict:false}))))})"
        )
        out = subprocess.run(
            ["node", "-e", script], input=json.dumps(self.items), cwd=ROOT,
            capture_output=True, text=True, check=True,
        )
        self.html = json.loads(out.stdout)

    def restore(self, text):
        # 公式后紧跟的中文标点不单独换行
        text = re.sub(r"(\x00\d+\x00)([。，；：、）”])", r'<span class="nobr">\1\2</span>', text)
        return re.sub(r"\x00(\d+)\x00", lambda m: self.html[int(m.group(1))], text)


# ---------- 极简 Markdown ----------

def inline(text):
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    # 行内图片（如选择题的选项是电路图）
    text = re.sub(r"!\[(.*?)\]\((.+?)\)", lambda m: f'<img class="{"inline-opt" if m.group(1).startswith("选项") else "inline-fig"}" src="{m.group(2)}" alt="{m.group(1)}">', text)
    return text


def md_blocks(text):
    return "\n".join(md_block_list(text))


def md_block_list(text):
    """支持本格式用到的写法：段落、有序/无序列表（含续行）、表格、图片、独立公式。"""
    lines = text.split("\n")
    out, i = [], 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        img = re.match(r"^!\[(.*?)\]\((.+?)\)\s*$", line)
        if img:
            src = img.group(2)
            if src.endswith(".svg") and FIGURE_ROOT:
                # SVG 直接内联：网页里动画可见，打印时由页面脚本暂停在静止画面
                svg = (FIGURE_ROOT / src).read_text(encoding="utf-8")
                svg = re.sub(r"<\?xml[^>]*>", "", svg).strip()
                out.append(f'<figure class="svg">{svg}</figure>')
                global INLINED_SVGS
                INLINED_SVGS += 1
            else:
                out.append(f'<figure><img src="{src}" alt="{html.escape(img.group(1))}"></figure>')
            i += 1
            continue
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{3,}:?", c) for c in cells):
                    rows.append(cells)
                i += 1
            head, *rest = rows
            th = "".join(f"<th>{inline(c)}</th>" for c in head)
            trs = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rest)
            out.append(f'<table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table>')
            continue
        ordered = re.match(r"^\d+\. ", line)
        if ordered or line.startswith("- "):
            tag = "ol" if ordered else "ul"
            items = []
            while i < len(lines) and (re.match(r"^(\d+\. |- )", lines[i]) or lines[i].startswith("   ")):
                if re.match(r"^(\d+\. |- )", lines[i]):
                    items.append(re.sub(r"^(\d+\. |- )", "", lines[i]))
                else:
                    items[-1] += "<br>" + lines[i].strip()
                i += 1
            lis = "".join(f"<li>{inline(it).replace('&lt;br&gt;', '<br>')}</li>" for it in items)
            out.append(f"<{tag}>{lis}</{tag}>")
            continue
        para = []
        while i < len(lines) and lines[i].strip() and not re.match(r"^(\d+\. |- |\||!\[)", lines[i]):
            para.append(lines[i])
            i += 1
        joined = "<br>".join(inline(p) for p in para)
        out.append(f'<div class="display">{joined}</div>' if joined.startswith("\x00") and joined.endswith("\x00") and "<br>" not in joined else f"<p>{joined}</p>")
    return out


# ---------- 题目 ----------

def source_label(q):
    qid, meta = q["id"], q["meta"]
    m = re.match(r"Q-PHY-TB9-(\d+)\.(\d+)-(\d+)$", qid)
    if m:
        return f"课本 {m.group(1)}.{m.group(2)} 练习与应用 第 {m.group(3)} 题"
    m = re.match(r"Q-PHY-TB9-(\d+)R-(\d+)$", qid)
    if m:
        cn = "零一二三四五六七八九"
        n = int(m.group(1))
        ch = ("十" if n // 10 == 1 else cn[n // 10] + "十") + (cn[n % 10] if n % 10 else "") if n >= 10 else cn[n]
        return f"课本 第{ch}章 复习与提高 第 {m.group(2)} 题"
    regions = {"GZ": "广州", "GD": "广东", "SZ": "深圳"}
    m = re.match(r"Q-PHY-(GZ|GD|SZ)(\d{4})-(\d+)(?:-(\d)([a-z]))?$", qid)
    if m:
        label = f"{m.group(2)} {regions[m.group(1)]}中考 第 {int(m.group(3))} 题"
        if m.group(4):
            label += f"（{m.group(4)}）{'①②③④'[ord(m.group(5)) - 97]}"
        return label
    m = re.match(r"Q-PHY-(GZ|GD|SZ)(\d{4})-", qid)
    if m:
        return f"{m.group(2)} {regions[m.group(1)]}中考"
    if meta.get("category") == "导引例题":
        return "选学 · 思想方法导引"
    return meta.get("category", "")


def clean_stem(text):
    keep = [l for l in text.split("\n") if not (l.startswith("（") and ("配图" in l or "原题有" in l))]
    return "\n".join(keep).strip()


def mark_line():
    tags = "".join(f'<span class="box">{t}</span>' for t in ERROR_TAGS)
    return (
        '<div class="mark"><span class="box">做对了</span><span class="box">做错了</span>'
        f'<span class="arrow">错在</span>{tags}</div>'
    )


def question_card(q, math, note=""):
    stem = math.stash(clean_stem(q["题干"][1]))
    note = "；".join(n for n in (q["meta"].get("do"), f"本知识点做{note}" if note else "") if n)
    note_html = f'<span class="part-note">{html.escape(note)}</span>' if note else ""
    return (
        f'<section class="q"><div class="q-label">{html.escape(source_label(q))}{note_html}</div>'
        f"{md_blocks(stem)}{mark_line()}</section>"
    )


def review_lines(q, names):
    entries = []
    for part in q["meta"].get("parts") or [q["meta"]]:
        prefix = part.get("part", "")
        for tag, target in (part.get("review") or {}).items():
            entries.append(f"{prefix}{tag} → {names(target)}")
    return entries


# ---------- 页面 ----------

CSS = """
:root{--text:#20272b;--soft:#5d6970;--faint:#7d8990;--line:#d8dfe2;--line-strong:#bec9ce;--accent:#287fc4;--accent-soft:#e5f1fa;--coral:#c9554d;--coral-soft:#fbe9e7;--green:#197a60}
*{box-sizing:border-box}
html{background:#e9edef}
body{margin:0;color:var(--text);font:16px/1.75 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
main{max-width:760px;margin:24px auto;background:#fff;padding:48px 56px}
h1{font-size:30px;line-height:1.3;margin:0 0 4px}
.sub{color:var(--soft);font-size:14px;margin:0 0 28px}
.howto{border-top:2px solid var(--text);border-bottom:1px solid var(--line);padding:14px 0;margin:0 0 32px;font-size:15px}
.howto p{margin:4px 0}
h2{font-size:24px;line-height:1.35;margin:0 0 6px}
h2 .code{color:var(--accent);margin-right:10px}
.kp{padding-top:22px;margin-top:34px;border-top:1px solid var(--line)}
.w{font-size:14px;font-weight:600;margin-left:12px;vertical-align:3px}
.w-重点{color:var(--coral)}.w-一般{color:var(--soft)}.w-了解{color:var(--faint)}
.kp-了解 h2{font-size:20px}
h2,h3{break-after:avoid}
h3+p{break-after:avoid}
p,li{orphans:2;widows:2}
.nobr{white-space:nowrap}
.kp-start,.keep,ol,ul{break-inside:avoid}
.kp-start{break-after:avoid}
.goal{font-size:17px;margin:0 0 20px;color:var(--soft)}
h3{font-size:16px;margin:26px 0 8px;color:var(--text)}
p{margin:8px 0}
ol,ul{margin:8px 0;padding-left:1.4em}
li{margin:4px 0}
.mistakes li::marker{color:var(--coral)}
.display{margin:12px 0;overflow-x:auto}
table{border-collapse:collapse;margin:12px 0;font-size:15px;width:100%}
th,td{border:1px solid var(--line-strong);padding:6px 10px;text-align:left;vertical-align:top}
th,td:not(:last-child){white-space:nowrap}
.inline-opt{max-height:130px;max-width:46%;vertical-align:top;margin:2px 0}
.inline-fig{display:block;max-height:260px;max-width:100%;margin:6px 0}
th{background:#f3f5f6;font-weight:600}
figure{margin:16px 0;text-align:center}
figure img{max-width:100%;max-height:340px;width:auto;height:auto}
figure.svg svg{display:block;width:100%;max-width:640px;height:auto;margin:0 auto}
.q figure img{max-height:220px}
.advanced{border:1px dashed var(--accent);padding:4px 18px 10px;margin:22px 0}
.advanced h3{color:var(--accent)}
.q{border:1px solid var(--line-strong);padding:12px 16px 10px;margin:14px 0;break-inside:avoid}
.q-label{font-size:13px;color:var(--soft);margin-bottom:4px}
.part-note{margin-left:10px;color:var(--accent)}
.mark{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:13px;color:var(--soft);border-top:1px solid var(--line);margin-top:10px;padding-top:8px}
.mark .box::before{content:"";display:inline-block;width:12px;height:12px;border:1.5px solid var(--faint);margin-right:4px;vertical-align:-1px}
.mark .arrow{color:var(--faint)}
.recap{font-size:14px;color:var(--soft);border-left:3px solid var(--line-strong);padding-left:12px}
.answers h2{margin-top:0}
.ans{border-bottom:1px solid var(--line);padding:10px 0 12px;break-inside:avoid}
.ans-head{font-size:14px;color:var(--soft)}
.ans-head strong{color:var(--text);font-size:16px;margin-right:8px}
.review{font-size:14px;color:var(--soft);background:#f3f5f6;padding:6px 12px;margin-top:6px}
.review b{color:var(--green);font-weight:600}
.feedback .line{border-bottom:1px solid var(--line-strong);height:34px}
.katex{font-size:1.05em}
@page{size:A4;margin:16mm 16mm 18mm;@bottom-center{content:counter(page);font-size:10pt;color:#7d8990}}
@media print{
  html{background:#fff}
  main{max-width:none;margin:0;padding:0}
  .answers,.feedback{break-before:page;margin-top:0;border-top:0;padding-top:0}
  figure,table{break-inside:avoid}
}
@media (max-width:640px){main{padding:28px 18px;margin:0}}
"""


def render_sub(title, body, kp, questions, rendered, math, names):
    """渲染知识点里的一个小节。自检、真题、进阶里的题目编号展开成题目卡片。"""
    refs = re.findall(r"`(Q-[\w.\-]+)`", body)
    if not refs:
        cls = ' class="mistakes"' if title == "容易错" else ""
        # 按完整的内容块切分（内联 SVG 自带换行，不能按换行符切）
        first, *rest = md_block_list(math.stash(body))
        return f'<div{cls}><div class="keep"><h3>{html.escape(title)}</h3>{first}</div>{"".join(rest)}</div>'

    parts = []
    for line in body.split("\n"):
        ids = re.findall(r"`(Q-[\w.\-]+)`", line)
        if not ids:
            if line.strip():
                parts.append(md_blocks(math.stash(line)))
            continue
        note = re.search(r"第（\d）问", line)
        for qid in ids:
            q = questions[qid]
            if qid in rendered:
                parts.append(
                    f'<p class="recap">回顾：{html.escape(source_label(q))}（在“{rendered[qid]}”里做过）也考到了这一点。</p>'
                )
                continue
            parts.append(question_card(q, math, note.group(0) if note else ""))
            rendered[qid] = f'{kp["code"]} {kp["name"]}'
    head = f"<h3>{html.escape(title)}</h3>"
    inner = (f'<div class="keep">{head}{parts[0]}</div>' + "".join(parts[1:])) if parts else head
    return f'<div class="advanced">{inner}</div>' if title.startswith("进阶") else inner


def build(chapter_dir):
    global FIGURE_ROOT
    chapter_dir = (ROOT / chapter_dir).resolve()
    FIGURE_ROOT = chapter_dir
    name = chapter_dir.name
    # 示意图质量检查：文字不能被图形压住，也不能互相重叠。不通过就不生成。
    figures = sorted(str(p) for p in (chapter_dir / "figures").glob("*.svg"))
    if figures:
        # 检查脚本需要 PIL；当前解释器没有时，换用 PATH 里装了 PIL 的 python3
        candidates = [sys.executable, shutil.which("python3")]
        checker = next((c for c in candidates if c and subprocess.run(
            [c, "-c", "import PIL"], capture_output=True).returncode == 0), None)
        if not checker:
            sys.exit("示意图检查需要 PIL（Pillow），请先安装。")
        result = subprocess.run([checker, str(ROOT / "scripts/check-figure-overlap.py"), *figures])
        if result.returncode != 0:
            sys.exit("示意图有文字被压住或重叠，请先修改上面列出的图。")
    front, title, intro, prereq, kps = load_lesson(chapter_dir / "lesson.md")
    questions = load_questions(chapter_dir / "questions.md")
    sections = {**load_sections_index(), **load_kp_index()}
    kp_names = {kp["meta"]["id"]: f'{kp["code"]} {kp["name"]}' for kp in kps}

    def names(target):
        if target in kp_names:
            return f"<b>{html.escape(kp_names[target])}</b>"
        if target in sections:
            return f"<b>{html.escape(sections[target])}</b>"
        if target.startswith("MATH-"):
            return f"<b>数学：{html.escape(target[5:])}</b>"
        return f"<b>{html.escape(target)}</b>"

    book = (str(front.get("id", "")).split("-") + ["", ""])[1]  # PHY-8A-02 → 8A
    grade = {"8A": "八年级上册", "8B": "八年级下册", "9": "九年级"}.get(book, "")
    math = MathRenderer()
    rendered = {}
    body = [
        f"<h1>{html.escape(title)}</h1>",
        f'<p class="sub">{grade}物理 · 样章试读版 · {front.get("updated", "")}</p>',
        '<div class="howto"><p>先读讲解，再做“练一练”。标着<b class="w-重点">重点</b>的多花时间，标着<b class="w-了解">了解</b>的读懂就行。</p>'
        "<p>做完在题目下方的方框里打勾；做错了，再勾一个“错在哪里”。</p>"
        "<p>答案和解析在最后。每道题的答案后面写着：做错了该回看哪里。</p></div>",
        md_blocks(math.stash(intro)),
    ]
    if prereq:
        body.append("<h3>本章前置自查</h3>" + md_blocks(math.stash(prereq)))
    order = []
    for kp in kps:
        goal = ""
        parts = []
        for sub_title, sub_body in kp["subs"]:
            if sub_title == "本次只学":
                goal = sub_body
                continue
            parts.append(render_sub(sub_title, sub_body, kp, questions, rendered, math, names))
        weight = kp["meta"].get("weight", "")
        tag = f'<span class="w w-{weight}">{weight}</span>' if weight else ""
        goal_html = f'<p class="goal">{inline(goal)}</p>' if goal else ""
        # 标题、一句话目标和第一个小节放在一起，避免标题单独落在页底
        start = f'<div class="kp-start"><h2><span class="code">{kp["code"]}</span>{html.escape(kp["name"])}{tag}</h2>{goal_html}</div>'
        body.append(f'<section class="kp kp-{weight}">{start}{"".join(parts)}</section>')
        order += [qid for qid, where in rendered.items() if where.startswith(kp["code"]) and qid not in order]

    answers = ['<section class="answers"><h2>答案与解析</h2>']
    current = None
    for qid in order:
        q = questions[qid]
        where = rendered[qid]
        if where != current:
            answers.append(f"<h3>{html.escape(where)}</h3>")
            current = where
        ans_note, ans_text = q["答案"]
        review = "；".join(review_lines(q, names))
        answers.append(
            f'<div class="ans"><div class="ans-head"><strong>{html.escape(source_label(q))}</strong>{inline(ans_note)}</div>'
            f'{md_blocks(math.stash(ans_text))}{md_blocks(math.stash(q["解析"][1]))}'
            f'<div class="review">做错了回看：{review}</div></div>'
        )
    answers.append("</section>")
    body += answers
    body.append(
        '<section class="feedback"><h2>试读反馈</h2>'
        "<p>读完后请写几句，帮我们把下一章做得更好。</p>"
        "<h3>哪一处读不懂，或者读了两遍才懂？</h3>" + '<div class="line"></div>' * 3 +
        "<h3>哪一处太长、太啰嗦，可以删掉？</h3>" + '<div class="line"></div>' * 3 +
        "<h3>哪一处最有用？配图有没有帮上忙？</h3>" + '<div class="line"></div>' * 3 + "</section>"
    )

    math.render_all()
    page = math.restore("\n".join(body))
    doc = (
        '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f"<title>{html.escape(title)} · 样章</title>"
        f'<link rel="stylesheet" href="katex/katex.min.css"><style>{CSS}</style></head>'
        f"<body><main>{page}</main>"
        "<script>if(new URLSearchParams(location.search).has('print')||matchMedia('(prefers-reduced-motion: reduce)').matches)"
        "{document.querySelectorAll('svg').forEach(s=>{s.pauseAnimations();s.setCurrentTime(0);});}</script>"
        "</body></html>"
    )

    out_dir = ROOT / "output/preview" / name
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    (out_dir / "index.html").write_text(doc, encoding="utf-8")
    shutil.copytree(chapter_dir / "figures", out_dir / "figures")
    katex_dist = ROOT / "node_modules/katex/dist"
    (out_dir / "katex").mkdir()
    shutil.copy(katex_dist / "katex.min.css", out_dir / "katex/katex.min.css")
    shutil.copytree(katex_dist / "fonts", out_dir / "katex/fonts")

    # 内联 SVG 必须完整地包在 <figure class="svg"> 里，否则说明文字会漏进正文
    intact = len(re.findall(r'<figure class="svg"><svg[^>]*>.*?</svg></figure>', doc, re.S))
    if intact != INLINED_SVGS:
        sys.exit(f"内联 SVG 结构被破坏（内联 {INLINED_SVGS} 张，完整 {intact} 张），请检查生成脚本。")
    missing = [r for r in re.findall(r'src="(figures/[^"]+)"', doc) if not (out_dir / r).exists()]
    if missing:
        sys.exit(f"缺少图片：{missing}")
    print(f"网页：{out_dir / 'index.html'}（{len(kps)} 个知识点，{len(order)} 道题）")

    chrome = os.environ.get("CHROME_BIN") or next(iter(sorted(glob.glob(os.path.expanduser(
        "~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell"
    )), reverse=True)), None)
    if not chrome:
        print("未找到 Chromium 内核，跳过 PDF。可设置 CHROME_BIN。")
        return
    pdf = ROOT / "output/pdf" / f"student-trial-{name}.pdf"
    pdf.parent.mkdir(parents=True, exist_ok=True)
    profile = ROOT / ".build/chrome-profile"
    subprocess.run(
        [chrome, "--no-sandbox", f"--user-data-dir={profile}", "--no-pdf-header-footer",
         "--print-to-pdf-no-header", f"--print-to-pdf={pdf}", (out_dir / "index.html").as_uri() + "?print=1"],
        check=True, capture_output=True, timeout=120,
    )
    print(f"PDF：{pdf}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    build(sys.argv[1])
