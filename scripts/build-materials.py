#!/usr/bin/env python3
"""为物理 / 数学某一章生成写讲义用的素材包（纯抽取，不改写）。

内容：本章知识点表；课本原文（从课本 PDF 按印刷页取文字，页码准确）；
地图里本章各知识点的真题全文（题干、答案、解析，公式图片尽量读出文字）。

用法：/usr/bin/python3 scripts/build-materials.py PHY-9-14 g9-14-internal-energy-use
输出：output/materials/<章目录>/materials.md

数学（学科由编号前缀判断，也可加 --subject math）：
  /usr/bin/python3 scripts/build-materials.py MATH-9A-26 <章目录>     # 需要 course/math/ 的地图、目录、真题归类表
  /usr/bin/python3 scripts/build-materials.py --subject math --paper GZ2024   # 只取一整套真题的文字
  /usr/bin/python3 scripts/build-materials.py --subject math --paper GZ2024 --list   # 列出有哪些卷
整卷输出到 output/materials/_papers/<学科>-<代号>.md。各学科的路径、页码差、真题目录配置在 scripts/course_subjects.py。
"""
import collections, re, sys, zipfile, glob
from pathlib import Path
import yaml

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import course_subjects as cs  # noqa: E402
import exam_docx, wmf_text  # noqa: E402

ROOT = cs.ROOT
cfg = cs.PHYSICS  # main() 里按编号 / --subject 换成实际学科
problems = []


def sections_index():
    """节编号 → (标题, 起始印刷页)，按课本顺序。"""
    out = collections.OrderedDict()
    for line in cfg.need(cfg.sections_md, "课本章节目录 textbook-sections.md").read_text().splitlines():
        m = re.match(cfg.section_line_re, line.strip())
        if m:
            out[m.group(1)] = (m.group(3), int(m.group(4)))
    return out


PAGES_SCRIPT = r"""
import json, sys, pymupdf
path, offset, first, last = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
pdf = pymupdf.open(path)
out = {}
for p in range(first, last + 1):
    if p + offset < len(pdf):
        lines = [l.rstrip() for l in pdf[p + offset].get_text().splitlines()]
        out[p] = "\n".join(l for l in lines if l.strip() and "仅供个人学习使用" not in l)
print(json.dumps(out, ensure_ascii=False))
"""


def textbook_pages(book, first, last):
    """按印刷页取课本 PDF 文字。系统 Python 没有 pymupdf 时，换用 PATH 里装了它的 python3。"""
    import json, shutil, subprocess
    key, offset = cfg.textbook_pdf[book]
    if offset is None:  # TODO：数学课本页码差还没量，不猜
        problems.append(f"课本 {book} 的 PDF 页码差还没配置（scripts/course_subjects.py 的 textbook_pdf），课本原文未取")
        return {}
    ocr = cfg.textbook_ocr.get(book)
    if ocr:  # 有识别稿（数学）：按“<!-- PDF 第 N 页 -->”标记切页，N 从 1 数
        parts = re.split(r"<!-- PDF 第 (\d+) 页 -->", Path(ocr).expanduser().read_text())
        pages = {int(n) - 1 - offset: t.strip() for n, t in zip(parts[1::2], parts[2::2])}
        return {p: pages.get(p, "") for p in range(first, last + 1)}
    path = str(next(cfg.textbook_dir.glob(f"*{key}.pdf")))
    for exe in (sys.executable, shutil.which("python3")):
        r = subprocess.run([exe, "-c", PAGES_SCRIPT, path, str(offset), str(first), str(last)],
                           capture_output=True, text=True)
        if r.returncode == 0:
            return {int(k): v for k, v in json.loads(r.stdout).items()}
    sys.exit("读取课本 PDF 需要 pymupdf（pip install pymupdf）")


# ---------- 真题 ----------

def runs_text(p, rels, z):
    """同 exam_docx.runs_text，但公式图片（WMF）能读出文字时写成〔式:…〕。"""
    out = []
    for tok in re.findall(r"<w:r[ >].*?</w:r>|<w:object.*?</w:object>", p, re.S):
        img = re.search(r'r:embed="([^"]+)"', tok) or re.search(r'<v:imagedata r:id="([^"]+)"', tok)
        if img:
            target = rels.get(img.group(1), "")
            text = ""
            if target.lower().endswith(".wmf"):
                try:
                    text = wmf_text.render(wmf_text.wmf_text(z.read("word/" + target)))
                except Exception:
                    text = ""
            out.append(f"〔式:{text}〕" if text.strip() else ("〔式〕" if tok.startswith("<w:object") else f"〔图:{target}〕"))
            continue
        if tok.startswith("<w:object"):
            out.append("〔式〕"); continue
        t = "".join(re.findall(r"<w:t[^>]*>(.*?)</w:t>", tok, re.S))
        if not t:
            continue
        if 'w:val="superscript"' in tok:
            t = "^{" + t + "}"
        elif 'w:val="subscript"' in tok:
            t = "_{" + t + "}"
        out.append(t)
    return "".join(out)


def pdf_text(paths):
    """没有 Word 的卷（如 2025 广东）：按页取 PDF 文字层。需要 pymupdf，同 textbook_pages 的做法。"""
    import shutil, subprocess
    script = ("import sys, pymupdf\nfor p in sys.argv[1:]:\n d = pymupdf.open(p)\n"
              " for i, pg in enumerate(d, 1):\n  print('〔%s p.%d〕' % (p.split('/')[-1], i)); print(pg.get_text())\n")
    for exe in (sys.executable, shutil.which("python3")):
        r = subprocess.run([exe, "-c", script, *map(str, paths)], capture_output=True, text=True)
        if r.returncode == 0:
            return "\n".join(l for l in r.stdout.splitlines() if l.strip() and "只刷真题" not in l and "zsztk" not in l)
    problems.append("读取 PDF 真题需要 pymupdf（pip install pymupdf）")
    return ""


_cache = {}
def paper_text(code):
    if code in _cache:
        return _cache[code]
    files = cs.exam_docx(cfg, code)
    if not files and cfg.exam_pdf.get(code):
        text = pdf_text(cfg.exam_pdf[code])
        _cache[code] = text
        return text
    if not files:
        problems.append(f"{code}：找不到解析版 Word"); _cache[code] = ""; return ""
    z = zipfile.ZipFile(files[0])
    x = z.read("word/document.xml").decode()
    rels = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', z.read("word/_rels/document.xml.rels").decode()))
    text = "\n".join(runs_text(p, rels, z) for p in re.findall(r"<w:p[ >].*?</w:p>", x, re.S))
    i = text.find("一、")  # 跳过“注意事项”里的 1. 2. 编号
    text = text[i:] if i > 0 else text
    _cache[code] = text
    return text


def question(code, n):
    text = paper_text(code)
    try:
        q = exam_docx.question(text, n)
    except AttributeError:
        problems.append(f"{code} 第 {n} 题：在 Word 里没找到题号"); return ""
    q = re.sub(r"\n\s*\n+", "\n", q).strip()
    q = re.sub(r"(〔图:[^〕]+〕\s*){2,}", lambda m: m.group(0).split("〕")[0] + "〕（等多张图）", q)
    return q


def whole_paper(code):
    """整卷文字（--paper）。"""
    if code[:2] not in cfg.exam_region or not re.fullmatch(r"[A-Z]{2}20\d\d", code):
        sys.exit(f"卷代号应为 GZ2024 这样的写法（地区 {'/'.join(cfg.exam_region)} + 年份），现在是 {code!r}")
    text = paper_text(code)
    if not text:
        sys.exit("；".join(problems) or f"{code}：没有取到文字")
    kind = "解析版 Word" if cs.exam_docx(cfg, code) else "PDF（平台导出件，文字层不完整，只能当线索）"
    dest = ROOT / "output/materials/_papers"
    dest.mkdir(parents=True, exist_ok=True)
    out = dest / f"{cfg.key}-{code}.md"
    out.write_text(f"# {cfg.name} {code} 整卷文字（{kind}）\n\n> 由 `scripts/build-materials.py --paper` 生成，纯抽取。`〔式:…〕` 是从公式图片里读出的文字，"
                   f"字符顺序和上下标常常错乱，只能核对数字；`〔式〕` `〔图:…〕` 是读不出文字的公式 / 图。\n\n```text\n{text}\n```\n")
    print(f"{out}：{len(text)} 字，公式读出 {text.count('〔式:')} 个、没读出 {text.count('〔式〕')} 个，图 {text.count('〔图:')} 个")


def list_papers():
    for code in cfg.papers:
        found = cs.exam_docx(cfg, code)
        print(code, "Word" if found else ("PDF" if cfg.exam_pdf.get(code) else "（找不到）"))


def main():
    global cfg
    cfg, argv = cs.pick(sys.argv)
    if "--list" in argv:
        return list_papers()
    if "--paper" in argv:
        return whole_paper(argv[argv.index("--paper") + 1])
    if len(argv) != 3:
        sys.exit(__doc__)
    cid, dirname = argv[1], argv[2]
    book = cid.split("-")[1]
    idx = sections_index()
    secs = [s for s in idx if s.startswith(cid + "-")]
    if not secs:
        sys.exit(f"找不到章 {cid}")
    later = [s for s in idx if s.split("-")[1] == book and idx[s][1] > idx[secs[-1]][1]]
    if later:  # 下一节若属于下一章，还要再让出下一章的章首页
        new_chapter = later[0].rsplit("-", 1)[0] != secs[-1].rsplit("-", 1)[0]
        last_page = idx[later[0]][1] - (2 if new_chapter else 1)
    else:
        last_page = idx[secs[-1]][1] + 12
    kpmap = {s["section"]: s for s in yaml.safe_load(cfg.need(cfg.kp_map, "知识点地图 kp-map.yml").read_text())}
    hits = collections.defaultdict(list)
    for line in cfg.need(cfg.hits_tsv, "真题归类表 exam-hits.tsv").read_text().splitlines()[1:]:
        ref, kp = line.split("\t")
        hits[kp].append(ref)

    out = [f"# {cid} 素材包（{dirname}）", "",
           "> 由 `scripts/build-materials.py` 生成，纯抽取，不要手改。课本文字取自课本 PDF 文字层，换行是排版换行；"
           "`〔式:…〕` 是从公式图片里读出的文字，**字符顺序和上下标常常错乱**（如 1.0×10³ kg/m³ 读成 `_{33}1.010kgm×`），只能用来核对数字，不能照抄；写进讲义的公式要按题意重写，并用答案反算核对。", ""]
    out += ["## 1. 本章知识点", "", "| 编号 | 标题 | 轻重 | 真题次数 | 定级理由 |", "| --- | --- | --- | --- | --- |"]
    kps = []
    for s in secs:
        sec = kpmap[s]
        if sec.get("type"):
            out.append(f"| {s} | 〔跨学科实践〕{sec['title']} | — | — | {sec['task']} |")
        for k in sec.get("kps") or []:
            kps.append(k)
            out.append(f"| {k['id']} | {k['title']} | {k['weight']} | {k['exam_hits']} | {k['weight_note']} |")

    out += ["", f"## 2. 课本原文（p.{idx[secs[0]][1] - 1}–{last_page}）", "",
            "每页前标〔p.N〕。“练习与应用”“复习与提高”的题目编号写成 `TB9-14.1-3`（第 1 节第 3 题）、`TB9-14R-3`（复习与提高第 3 题）。", ""]
    for p, text in textbook_pages(book, idx[secs[0]][1] - 1, last_page).items():
        out += [f"### 〔p.{p}〕", "", "```text", text, "```", ""]

    out += ["## 3. 真题全文（按知识点）", ""]
    done = {}
    for k in kps:
        refs = sorted(hits.get(k["id"], []))
        out += [f"### {k['id']} {k['title']}（{len(refs)} 条）", ""]
        for ref in refs:
            code, rest = ref.split("-", 1)
            n = int(re.match(r"\d+", rest).group(0))
            key = (code, n)
            out.append(f"#### {ref}")
            out.append("")
            if key in done:
                out += [f"同一道题的全文见 {done[key]}。", ""]
                continue
            done[key] = ref
            q = question(code, n)
            out += ["```text", q or "（未抽取到）", "```", ""]
            if "〔式〕" in q:
                problems.append(f"{ref}：有 {q.count('〔式〕')} 个公式没能读出文字，要看原卷")

    out += ["## 4. 抽取问题", ""] + ([f"- {p}" for p in problems] or ["- 无"])
    dest = ROOT / "output/materials" / dirname
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "materials.md").write_text("\n".join(out) + "\n")
    print(f"{dest / 'materials.md'}：{len(kps)} 个知识点，课本 {last_page - idx[secs[0]][1] + 2} 页，真题 {len(done)} 道（{sum(len(hits.get(k['id'], [])) for k in kps)} 条记录），抽取问题 {len(problems)} 条")


if __name__ == "__main__":
    main()
