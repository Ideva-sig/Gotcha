#!/usr/bin/env python3
"""把 course/ 的 v3 源文件导出为网站用的 JSON（接口说明见 course/FORMAT.md“网站数据接口”）。

用法：
  /usr/bin/python3 scripts/export-course-json.py physics
  /usr/bin/python3 scripts/export-course-json.py math

输出到 output/app-data/<学科>/：index.json、chapters/<章编号>.json、figures/<章编号>/*.png、pdf/<章编号>.pdf
只做结构转换，不改写内容；找不到题号或图片文件时报错退出。
"""
import importlib.util
import json
import os
import re
import shutil
import sys
from datetime import date
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import course_subjects as cs  # noqa: E402

ROOT = cs.ROOT

# 复用试读稿脚本里的 lesson.md / questions.md 解析
_spec = importlib.util.spec_from_file_location("preview", ROOT / "scripts/build-course-preview.py")
preview = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(preview)
yaml = preview.yaml

SUBJECTS = cs.SUBJECTS
BLOCK_ORDER = ["本次只学", "先认住", "破题钥匙", "数形结合", "走一遍", "容易错", "练一练"]
IMG_LINE = re.compile(r"^!\[(.*?)\]\((.+?)\)\s*$")


def fail(msg):
    sys.exit(f"导出失败：{msg}")


# ---------- 图 ----------

def prefix_svg(svg, name):
    """给 id 和 class 加上图名前缀，避免多张内联 SVG 互相串样式；并加上减少动态效果的样式。"""
    svg = re.sub(r"<\?xml[^>]*>", "", svg).strip()

    def pre(x):
        return x if x.startswith(name + "-") else f"{name}-{x}"

    for old in sorted(set(re.findall(r'\bid="([^"]+)"', svg)), key=len, reverse=True):
        svg = re.sub(rf'(?<![\w-])id="{re.escape(old)}"', f'id="{pre(old)}"', svg)
        svg = re.sub(rf'#{re.escape(old)}(?![\w-])', f'#{pre(old)}', svg)
        svg = re.sub(r'aria-labelledby="([^"]*)"',
                     lambda m: 'aria-labelledby="' + re.sub(rf'(?<![\w-]){re.escape(old)}(?![\w-])', pre(old), m.group(1)) + '"', svg)
    classes = set()
    for m in re.finditer(r'\bclass="([^"]+)"', svg):
        classes.update(m.group(1).split())
    for c in sorted(classes, key=len, reverse=True):
        svg = re.sub(r'class="([^"]*)"',
                     lambda m: 'class="' + " ".join(pre(t) if t == c else t for t in m.group(1).split()) + '"', svg)
        svg = re.sub(rf'\.{re.escape(c)}(?![\w-])', f'.{pre(c)}', svg)
    # 注意：SMIL 动画（animate/animateTransform）不受 CSS 控制，前端需在减少动态效果时调用 svg.pauseAnimations()
    reduce = "<style>@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}</style>"
    return re.sub(r"(<svg[^>]*>)", lambda m: m.group(1) + reduce, svg, count=1)


def figure_block(alt, src, chapter_dir, chapter_id, png_files):
    path = chapter_dir / src
    if not path.is_file():
        fail(f"图片文件不存在：{path}")
    if src.endswith(".svg"):
        svg = prefix_svg(path.read_text(encoding="utf-8"), path.stem)
        return {"type": "figure", "format": "svg", "svg": svg, "alt": alt}
    png_files.append(path)
    return {"type": "figure", "format": "png", "src": f"figures/{chapter_id}/{path.name}", "alt": alt}


def to_blocks(text, chapter_dir, chapter_id, png_files):
    """把一段 Markdown 按图片行切开：文字保持原样，图片变成独立的 figure 块。"""
    blocks, buf = [], []

    def flush():
        md = "\n".join(buf).strip()
        if md:
            blocks.append({"type": "md", "text": md})
        buf.clear()

    for line in text.split("\n"):
        img = IMG_LINE.match(line)
        if img:
            flush()
            blocks.append(figure_block(img.group(1), img.group(2), chapter_dir, chapter_id, png_files))
        else:
            buf.append(line)
    flush()
    return blocks


# ---------- 题目 ----------

def split_options(lines):
    """题干里的 A. … B. … 行拆成选项；返回 (题干行, 选项)。"""
    stem, options = [], []
    for line in lines:
        if re.match(r"^A\. ", line) or (options and re.match(r"^[A-H]\. ", line)):
            for part in re.split(r"\s+(?=[A-H]\. )", line.strip()):
                options.append({"key": part[0], "text": part[3:].strip()})
        else:
            stem.append(line)
    return stem, options


def split_steps(text):
    """解析 → 每步一条：编号列表去掉编号（缩进的续行并入上一步），否则一段一步。"""
    if not re.match(r"^\d+\. ", text):
        return [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    steps = []
    for line in text.split("\n"):
        if re.match(r"^\d+\. ", line):
            steps.append(re.sub(r"^\d+\. ", "", line))
        elif line.strip() and steps:
            steps[-1] += "\n" + line.strip()
    return steps


def export_question(q, kp_id, chapter_dir, chapter_id, png_files):
    meta = q["meta"]
    stem_lines = preview.clean_stem(q["题干"][1]).split("\n")
    options = []
    if meta.get("type") in ("选择", "多选"):
        stem_lines, options = split_options(stem_lines)
    # 题干以外的行内图片（选项里的电路图、答案和解析里的作图答案）：登记复制，路径改成网站里的位置
    def inline_png(m):
        path = chapter_dir / m.group(2)
        if not path.is_file():
            fail(f"图片文件不存在：{path}")
        png_files.append(path)
        return f"![{m.group(1)}](figures/{chapter_id}/{path.name})"

    def fix_images(text):
        return re.sub(r"!\[([^\]]*)\]\(([^)]+\.(?:png|svg))\)", inline_png, text)

    answer_text = fix_images(q["答案"][1])
    answer = {"text": answer_text}
    if meta.get("grading") == "自动":
        m = re.match(r"^[A-H]+$", answer_text.strip())
        answer["key"] = m.group(0) if m else answer_text.strip()
    review = [{"tag": t, "target": g} for t, g in (meta.get("review") or {}).items()]
    for part in meta.get("parts") or []:
        review += [{"part": part["part"], "tag": t, "target": g} for t, g in (part.get("review") or {}).items()]
    out = {
        "category": meta.get("category"), "source": meta.get("source"),
        "kp": meta.get("kp") or kp_id, "type": meta.get("type"), "grading": meta.get("grading"),
        # 单独一行的图片由 to_blocks 处理；嵌在句子里的行内图片在这里改路径
        "stem": to_blocks("\n".join(l if re.fullmatch(r"!\[[^\]]*\]\([^)]+\)\s*", l) else fix_images(l)
                                    for l in stem_lines).strip(), chapter_dir, chapter_id, png_files),
    }
    if options:
        for opt in options:
            opt["text"] = fix_images(opt["text"])
        out["options"] = options
    out["answer"] = answer
    out["steps"] = [fix_images(st) for st in split_steps(q["解析"][1])]
    out["answer_by"] = meta.get("answer_by")
    out["needs_review"] = "待复核" in (meta.get("answer_by") or "")
    out["review"] = review
    if meta.get("widget"):  # 数学题解析后的可拖动图：组件参数 + 静态图（减少动态效果时显示）
        out["widget"] = {"source": meta["widget"],
                         "figure": figure_block("互动图的静态版", meta["widget_figure"], chapter_dir, chapter_id, png_files)}
    for extra in ("accepted", "parts", "do"):  # 填空的可接受答案、分空信息、本章只做哪一问
        if meta.get(extra):
            out[extra] = meta[extra]
    return out


def question_note(meta):
    if meta.get("do"):
        return meta["do"]
    m = re.search(r"(第[（(]\d+[）)]问.*)$", meta.get("source", ""))
    return m.group(1) if m else ""


# ---------- 章 ----------

def export_chapter(chapter_dir, out_dir):
    front, title, intro, prereq, kps = preview.load_lesson(chapter_dir / "lesson.md")
    chapter_id = front["id"]
    questions = preview.load_questions(chapter_dir / "questions.md")
    png_files, used, kp_out = [], {}, []
    for kp in kps:
        blocks = []
        subs = dict(kp["subs"])
        for heading in BLOCK_ORDER:
            if heading not in subs:
                continue
            body = subs[heading]
            if heading == "练一练":
                refs = []
                for qid in re.findall(r"`(Q-[^`]+)`", body):
                    if qid not in questions:
                        fail(f"{chapter_id} 的讲义引用了不存在的题号：{qid}")
                    used[qid] = kp["meta"]["id"]
                    refs.append({"id": qid, "note": question_note(questions[qid]["meta"])})
                blocks.append({"heading": heading, "questions": refs})
            elif body:
                blocks.append({"heading": heading, "body": to_blocks(body, chapter_dir, chapter_id, png_files)})
        meta = kp["meta"]
        kp_out.append({
            "id": meta["id"], "title": kp["name"], "weight": meta.get("weight"),
            "textbook": meta.get("textbook"),
            "prerequisites": meta.get("prerequisites") or [],
            "evidence": meta.get("evidence") or [],
            "blocks": blocks,
        })
    data = {"id": chapter_id, "title": front.get("title", title), "intro": intro, "prereq_check": prereq}
    pdf_src = ROOT / "output/pdf" / f"student-trial-{chapter_dir.name}.pdf"
    if pdf_src.is_file():
        (out_dir / "pdf").mkdir(parents=True, exist_ok=True)
        shutil.copy(pdf_src, out_dir / "pdf" / f"{chapter_id}.pdf")
        data["pdf"] = f"pdf/{chapter_id}.pdf"
    data["kps"] = kp_out
    data["questions"] = {
        qid: export_question(questions[qid], kp_id, chapter_dir, chapter_id, png_files)
        for qid, kp_id in used.items()
    }
    # 图片：题干里引用的 PNG 原样复制（在导出题目时已登记）
    if png_files:
        fig_dir = out_dir / "figures" / chapter_id
        fig_dir.mkdir(parents=True, exist_ok=True)
        for p in sorted(set(png_files)):
            shutil.copy(p, fig_dir / p.name)
    write_json(out_dir / "chapters" / f"{chapter_id}.json", data)
    return chapter_id, front, kp_out


# ---------- 全科目录 ----------

CN_NUM = {c: i for i, c in enumerate("零一二三四五六七八九十")}
CN_NUM.update({f"十{c}": 10 + i for i, c in enumerate("一二三四五六七八九", 1)})
CN_NUM["二十"] = 20
CN_NUM.update({f"二十{c}": 20 + i for i, c in enumerate("一二三四五六七八九", 1)})
CN_NUM["三十"] = 30


def chapter_titles(sections_md, book_names):
    """textbook-sections.md → {(册, 章号): 章标题}。"""
    titles, book = {}, None
    for line in sections_md.read_text(encoding="utf-8").split("\n"):
        if line.startswith("## "):
            book = book_names.get(line[3:].strip())
        m = re.match(r"### 第(.+?)(章|单元) (.+?)（p\.\d+）", line)
        if m:
            titles[(book, CN_NUM[m.group(1)])] = f"第{m.group(1)}{m.group(2)} {m.group(3)}"
    return titles


def load_thinking_intro(cfg):
    """“思维提升”页开头说明（thinking-intro.yml）：必需文件，字段 lead / steps[head,text] / note / source。"""
    path = cfg.need(cfg.dir / "thinking-intro.yml", "思维提升说明 thinking-intro.yml")
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(raw.get("lead"), str) or not raw["lead"].strip():
        fail(f"{path} 缺少 lead（开场一句话）")
    steps = raw.get("steps")
    if not isinstance(steps, list) or not steps or not all(isinstance(s, dict) and s.get("head") and s.get("text") for s in steps):
        fail(f"{path} 的 steps 必须是非空列表，每项有 head 和 text")
    out = {"lead": raw["lead"], "steps": [{"head": s["head"], "text": s["text"]} for s in steps]}
    for key in ("note", "source"):
        if raw.get(key):
            out[key] = raw[key]
    return out


PERIODIC_CATEGORIES = {"h", "alkali", "alkaline", "transition", "metal", "metalloid", "nonmetal",
                       "halogen", "noble", "lanact", "super"}


def load_periodic(cfg):
    """元素周期表数据（chemistry/periodic.yml）：必需文件，118 个元素 + junior 名单，写进内容包 periodic.json。"""
    path = cfg.need(cfg.dir / "periodic.yml", "元素周期表数据 periodic.yml")
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    els = raw.get("elements")
    if not isinstance(els, list) or len(els) != 118:
        fail(f"{path} 的 elements 必须是 118 个元素的列表（现在 {len(els) if isinstance(els, list) else '不是列表'}）")
    out, symbols, cells = [], set(), set()
    for i, e in enumerate(els, 1):
        if not isinstance(e, dict):
            fail(f"{path} 第 {i} 项不是字段表")
        for key in ("z", "symbol", "name", "mass", "calc", "category", "row", "col"):
            if key not in e:
                fail(f"{path} 第 {i} 项缺少字段 {key}")
        if e["z"] != i:
            fail(f"{path} 第 {i} 项的原子序数 z={e['z']}，必须从 1 到 118 连续")
        for key in ("symbol", "name", "mass", "calc"):
            if not isinstance(e[key], str):
                fail(f"{path} 第 {i} 项的 {key} 必须是字符串（数字请加引号）")
        if not e["symbol"] or not e["name"] or not e["mass"]:
            fail(f"{path} 第 {i} 项的 symbol / name / mass 不能为空")
        if e["symbol"] in symbols:
            fail(f"{path} 元素符号重复：{e['symbol']}")
        symbols.add(e["symbol"])
        if e["category"] not in PERIODIC_CATEGORIES:
            fail(f"{path} 第 {i} 项的类别 {e['category']!r} 不认识（可用：{', '.join(sorted(PERIODIC_CATEGORIES))}）")
        if not (isinstance(e["row"], int) and 1 <= e["row"] <= 9 and isinstance(e["col"], int) and 1 <= e["col"] <= 18):
            fail(f"{path} 第 {i} 项的 row 须是 1–9、col 须是 1–18 的整数")
        if (e["row"], e["col"]) in cells:
            fail(f"{path} 第 {i} 项的位置 row={e['row']} col={e['col']} 与别的元素重复")
        cells.add((e["row"], e["col"]))
        out.append({k: e[k] for k in ("z", "symbol", "name", "mass", "calc", "category", "row", "col")})
    junior = raw.get("junior")
    if not isinstance(junior, list) or not all(isinstance(z, int) and 1 <= z <= 118 for z in junior):
        fail(f"{path} 的 junior 必须是原子序数（1–118）的列表")
    return {"junior": junior, "elements": out}


def build_index(cfg, built, generated):
    subject, prefix = cfg.key, cfg.prefix
    kp_map = yaml.safe_load(cfg.need(cfg.kp_map, "知识点地图 kp-map.yml").read_text(encoding="utf-8"))
    titles = chapter_titles(cfg.need(cfg.sections_md, "课本章节目录 textbook-sections.md"), cfg.book_names)
    chapters, kps = {}, {}
    for sec in kp_map:
        m = re.fullmatch(cfg.section_re, sec["section"])
        book, num = m.group(1), m.group(2)
        cid = f"{prefix}-{book}-{num}"
        ch = chapters.setdefault(cid, {"id": cid, "title": titles[(book, int(num))], "book": book,
                                       "status": None, "available": False, "kp_ids": [], "exam_hits": 0})
        for kp in sec.get("kps") or []:
            ch["kp_ids"].append(kp["id"])
            ch["exam_hits"] += kp.get("exam_hits") or 0
            kps[kp["id"]] = {"title": kp["title"], "weight": kp["weight"], "chapter": cid,
                             "section": sec["section"], "section_title": sec["title"],
                             "page": sec["page"], "exam_hits": kp.get("exam_hits") or 0,
                             "prerequisites": [{"id": r["id"], "strength": r.get("strength", "hard"),
                                                "reason": r.get("reason", "")}
                                               for r in kp.get("prerequisites") or []],
                             "used_by": [], "available": cid in built}
    # 反向关系：谁把它当前置（“学会后会用到”）
    for kid, kp in kps.items():
        for r in kp["prerequisites"]:
            if r["id"] in kps:
                kps[r["id"]]["used_by"].append({"id": kid, "strength": r["strength"], "reason": r["reason"]})
    for cid, front in built.items():
        chapters[cid]["status"] = front.get("status")
        chapters[cid]["available"] = True
    # 角色台词（可选文件）：编号必须在地图里
    fun = {"kps": {}, "mastered": [], "mistakes": {}, "avatars": {}}
    fun_path = cs.COURSE_ROOT / subject / "fun-lines.yml"
    if fun_path.exists():
        raw = yaml.safe_load(fun_path.read_text(encoding="utf-8")) or {}
        for kid in raw.get("kps") or {}:
            if kid not in kps:
                fail(f"fun-lines.yml 里的知识点不在地图里：{kid}")
        avatars = raw.get("avatars") or {}
        for group in [*(raw.get("kps") or {}).values(), raw.get("mastered") or [],
                      *((raw.get("mistakes") or {}).values())]:
            for line in group:
                if line["who"] not in avatars:
                    fail(f"fun-lines.yml 里的角色没有头像对应：{line['who']}")
        fun = {"kps": raw.get("kps") or {}, "mastered": raw.get("mastered") or [],
               "mistakes": raw.get("mistakes") or {}, "avatars": avatars}
    return {"subject": subject, "generated": generated, "error_tags": preview.ERROR_TAGS,
            "chapters": list(chapters.values()), "kps": kps, "fun_lines": fun,
            "thinking_intro": load_thinking_intro(cfg)}


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def main(subject):
    if subject not in SUBJECTS:
        fail(f"未知科目：{subject}（可用：{', '.join(SUBJECTS)}）")
    cfg = SUBJECTS[subject]
    cfg.need(cfg.kp_map, "知识点地图 kp-map.yml")
    out_dir = Path(os.environ.get("CONTENT_PACK_DIR") or "output/app-data")
    out_dir = (out_dir if out_dir.is_absolute() else ROOT / out_dir) / subject  # 内容包根目录可由 CONTENT_PACK_DIR 指定
    if out_dir.exists():
        shutil.rmtree(out_dir)  # 每次整体重导，避免残留旧文件
    built = {}
    # 开放名单（course/<学科>/open-chapters.txt，一行一个章编号）：有这个文件时，只导出名单里的章，
    # 没审完的章不会被构建带上线。没有文件 = 全部导出（物理）。环境变量 COURSE_OPEN_ALL=1 可临时全部导出（只用于本机预览）。
    open_file = cs.COURSE_ROOT / subject / "open-chapters.txt"
    open_ids = None
    if open_file.exists() and os.environ.get("COURSE_OPEN_ALL") != "1":
        open_ids = {ln.split("#")[0].strip() for ln in open_file.read_text(encoding="utf-8").splitlines() if ln.split("#")[0].strip()}
    for lesson in sorted((cs.COURSE_ROOT / subject).glob("*/lesson.md")):
        if open_ids is not None:
            lid = re.search(r"^id:\s*(\S+)", lesson.read_text(encoding="utf-8"), re.M)
            if not lid or lid.group(1) not in open_ids:
                print(f"跳过（不在开放名单）：{lesson.parent.name}")
                continue
        cid, front, _ = export_chapter(lesson.parent, out_dir)
        built[cid] = front
        print(f"章：{cid}（{lesson.parent.name}）")
    index = build_index(cfg, built, date.today().isoformat())
    for cid in built:
        if cid not in {c["id"] for c in index["chapters"]}:
            fail(f"章 {cid} 不在知识点地图里")
    write_json(out_dir / "index.json", index)
    formulas = cs.COURSE_ROOT / subject / "formulas.md"
    if formulas.exists():  # 公式速查属于内容，随内容包走，前端只读内容包
        shutil.copyfile(formulas, out_dir / "formulas.md")
    if subject == "chemistry":  # 周期表是化学科目级内容，随内容包走，前端只读内容包
        write_json(out_dir / "periodic.json", load_periodic(cfg))
    print(f"目录：{len(index['chapters'])} 章，{len(index['kps'])} 个知识点 → {out_dir}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
