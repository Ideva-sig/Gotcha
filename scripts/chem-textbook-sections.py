"""由化学课本 PDF 的目录书签生成 course/chemistry/textbook-sections.md。

用法：python3 scripts/chem-textbook-sections.py     （需要 pymupdf，系统 Python 没有就用 PATH 里的 python3）

编号：CHEM-{册}-{单元两位}-{节}。节 = 课题1、2、3…，其后是“实验活动”“跨学科实践活动”，接着往下编。
页码 = 书签页序（从 1 数）- 1 - 页码差；页码差在 course_subjects.py 的 textbook_pdf。
"""
import re
import sys
from pathlib import Path

import pymupdf

sys.path.insert(0, str(Path(__file__).resolve().parent))
import course_subjects as cs  # noqa: E402

CN = {c: i for i, c in enumerate("零一二三四五六七八九")}
CN["十"] = 10
cfg = cs.CHEM


def unit_no(s):
    return 10 + CN[s[1]] if s.startswith("十") and len(s) > 1 else CN[s]


def main():
    out = ["# 化学课本章节编号索引", "",
           "由人教版化学课本（2022 年版课标修订版）PDF 的目录书签生成（`scripts/chem-textbook-sections.py`），供知识点和前置知识引用。", "",
           "- 编号格式：`CHEM-{册}-{单元}-{节}`。册：`9A` 九年级上册，`9B` 九年级下册。单元号两册连续（九上 1–7，九下 8–11）。",
           "- “章”在化学里叫“单元”。节 = 课题；各单元的“实验活动”“跨学科实践活动”接在课题后面继续编号，并加标签。",
           "- 知识点编号在节编号后加字母，如 `CHEM-9A-03-2a`。",
           "- 页码为课本印刷页码。课本里的“绪论”不编号，也不列。",
           "- **本机资料里另有一份旧版九上 PDF 和识别稿，目录不同，不要用。**", ""]
    for code, name in (("9A", "九年级上册"), ("9B", "九年级下册")):
        path = next(cfg.textbook_dir.glob(f"*{name}.pdf"))
        off = cfg.textbook_pdf[code][1]
        pdf = pymupdf.open(path)
        out += [f"## {name}", ""]
        unit = n = None
        for level, title, page in pdf.get_toc():
            title = re.sub(r"\s+", " ", title.replace("　", " ")).strip()
            printed = page - 1 - off
            m = re.match(r"第(.+?)单元 ?(.*)", title)
            if level == 1 and m:
                unit, n = unit_no(m.group(1)), 0
                out += ["", f"### 第{m.group(1)}单元 {m.group(2)}（p.{printed}）", ""]
            elif level == 2 and unit and (t := re.match(r"课题(\d) ?(.*)", title)):
                n = int(t.group(1))
                out.append(f"- `CHEM-{code}-{unit:02d}-{n}` {t.group(2)}（p.{printed}）")
            elif level == 1 and unit and re.match(r"(实验活动|跨学科实践活动)\d+", title):
                n += 1
                tag = "" if title.startswith("实验") else "〔跨学科实践〕"
                out.append(f"- `CHEM-{code}-{unit:02d}-{n}` {tag}{title}（p.{printed}）")
        out.append("")
    dest = cs.ROOT / "course/chemistry/textbook-sections.md"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text("\n".join(out))
    print(f"已写入 {dest}")


if __name__ == "__main__":
    sys.exit(main())
