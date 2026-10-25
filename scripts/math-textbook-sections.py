"""由数学课本 PDF 的目录书签生成 course/math/textbook-sections.md，并量出各册页码差。

用法：python3 scripts/math-textbook-sections.py        （需要 pymupdf，系统 Python 没有就用 PATH 里的 python3）

页码差 = PDF 页序（从 0 数）- 印刷页码，靠页脚的页码数字统计得出；结果同时打印出来，
需要手工抄进 scripts/course_subjects.py 的 textbook_pdf。
"""
import collections
import os
import re
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from course_subjects import MATERIALS  # noqa: E402  资料目录只在 course_subjects.py 里配一处

DIR = MATERIALS / "初中人教版课本/数学/人教版"
BOOKS = [("7A", "七年级上册"), ("7B", "七年级下册"), ("8A", "八年级上册"),
         ("8B", "八年级下册"), ("9A", "九年级上册"), ("9B", "九年级下册")]
CN = {c: i for i, c in enumerate("零一二三四五六七八九")}
FW = str.maketrans("０１２３４５６７８９", "0123456789")


def cn_num(s):
    """二十六 → 26"""
    if s == "十":
        return 10
    if "十" in s:
        a, b = s.split("十")
        return (CN[a] if a else 1) * 10 + (CN[b] if b else 0)
    return CN[s]


def offset_of(pdf):
    """页脚数字的文字层顺序有时是倒的（“０４”= 40），正反都试，取最常见的差。"""
    votes = collections.Counter()
    for i in range(8, pdf.page_count - 4):
        lines = [l.strip().translate(FW) for l in pdf[i].get_text().splitlines()]
        for l in lines[-4:]:
            if re.fullmatch(r"\d{1,3}", l):
                for n in {int(l), int(l[::-1])}:
                    votes[i - n] += 1
    return votes.most_common(1)[0][0]


def main():
    out = ["# 数学课本章节编号索引", "",
           "由人教版数学课本 PDF 的目录书签生成（`scripts/math-textbook-sections.py`），供知识点和前置知识引用。", "",
           "- 编号格式：`MATH-{册}-{章}-{节}`。册：`7A` 七上、`7B` 七下、`8A` 八上、`8B` 八下、`9A` 九上、`9B` 九下。",
           "- 七上至九上是 2022 年版课标修订版，章号各册连续；九下暂用旧版（章号 26–29 与修订版九上重复，所以编号必须带册别）。",
           "- 知识点编号在节编号后加字母，如 `MATH-9A-26-2a`。",
           "- 页码为课本印刷页码。", ""]
    for code, name in BOOKS:
        path = next(DIR.glob(f"*{name}.pdf"))
        pdf = pymupdf.open(path)
        off = offset_of(pdf)
        old = "2022" not in path.name
        print(f"{code} {name}：页码差 {off}{'（旧版）' if old else ''}")
        out += [f"## {name}{'（旧版）' if old else ''}", ""]
        chap = None
        for level, title, page in pdf.get_toc():
            title = re.sub(r"\s+", " ", title.replace("　", " ")).strip()
            printed = page - 1 - off
            m = re.match(r"第(.+?)章 ?(.*)", title)
            if level == 1 and m:
                chap = cn_num(m.group(1))
                out += ["", f"### 第{m.group(1)}章 {m.group(2)}（p.{printed}）", ""]
                continue
            if level == 1:  # 综合与实践等
                chap = None
                out += ["", f"### {title}（p.{printed}）", ""]
                continue
            sub = re.match(r"\*?(\d+)\.(\d+)\.(\d+) ?(.*)", title)
            if sub and chap == int(sub.group(1)):  # 小节（如 26.2.1）不另编号，缩进列在节下
                # 书签偶尔把两个小节写在一条里（“2.3.2 科学记数法 2.3.3近似数”）
                for t in re.split(r" (?=\d+\.\d+\.\d+)", title):
                    t = re.sub(r"^(\d+\.\d+\.\d+) ?", r"\1 ", t)
                    out.append(f"  - {t}（p.{printed}）")
                continue
            s = re.match(r"(\*?)(\d+)\.(\d+) ?(.*)", title)
            if s and chap == int(s.group(2)):
                opt = "〔选学〕" if s.group(1) else ""
                out.append(f"- `MATH-{code}-{chap:02d}-{s.group(3)}` {opt}{s.group(4)}（p.{printed}）")
            # 小结、数学活动、阅读与思考等栏目不编号，不列
        out.append("")
    dest = ROOT / "course/math/textbook-sections.md"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text("\n".join(out))
    print(f"已写入 {dest}")


if __name__ == "__main__":
    sys.exit(main())
