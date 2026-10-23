#!/usr/bin/env python3
"""把某章（或全科）questions.md 里每道真题的题干，和原卷 Word 全文逐段比对。

用法：
  python3 scripts/check-exam-text.py course/physics/<章目录>      # 一章
  python3 scripts/check-exam-text.py course/physics               # 全科
  python3 scripts/check-exam-text.py course/physics/<章目录> Q-PHY-GZ2022-02   # 列出这题对不上的片段
  course/math/… 同理（学科从路径判断，也可加 --subject math）；配置在 scripts/course_subjects.py。

做法：题干只留汉字，看每个字所在的 6 字片段能不能在原卷全文里找到；吻合率 = 找得到的字数占比，低于 0.85 的标出来。
它查得出“整题编造”“题干被改写”；删掉“如图所示”、删掉无关小问也会让吻合率略降，标出来后要人看一眼未匹配的片段。
2025 广东卷等不在原卷目录里的题会显示 0 分，属正常。
"""
import glob, os, re, sys, zipfile
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import course_subjects as cs  # noqa: E402

N = 6
cfg = cs.PHYSICS  # main() 里按路径换成实际学科
EXAMS = [os.path.expanduser(g) for g in cfg.exam_globs]


def norm(t):
    t = re.sub(r"\$[^$]*\$", "", t)
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", t)
    return re.sub(r"[^一-鿿]", "", t)


def load_corpus():
    text = ""
    for pat in EXAMS:
        for d in glob.glob(pat):
            x = zipfile.ZipFile(d).read("word/document.xml").decode()
            text += norm(re.sub(r"<[^>]+>", "", x))
    if not text:
        sys.exit("找不到原卷 Word（" + "；".join(EXAMS) + "）")
    return text


def questions(path):
    s = open(path, encoding="utf-8").read()
    for m in re.finditer(rf"^### (Q-{cfg.prefix}-\S+)\n(.*?)(?=^### |\Z)", s, re.S | re.M):
        body = m.group(2)
        if "category: 真题" not in body:
            continue
        st = re.search(r"\*\*题干\*\*(.*?)\*\*答案\*\*", body, re.S)
        yield m.group(1), norm(st.group(1)) if st else None


def unmatched(t, corpus):
    out, cur = [], ""
    for i, ch in enumerate(t):
        ok = any(t[j:j + N] in corpus for j in range(max(0, i - N + 1), min(i + 1, len(t) - N + 1)))
        if not ok:
            cur += ch
        elif cur:
            out.append(cur)
            cur = ""
    if cur:
        out.append(cur)
    return out


def main():
    global cfg, EXAMS
    cfg, argv = cs.pick(sys.argv)
    EXAMS = [os.path.expanduser(g) for g in cfg.exam_globs]
    if len(argv) < 2:
        sys.exit(__doc__)
    target = argv[1].rstrip("/")
    files = sorted(glob.glob(target + "/*/questions.md")) or [target + "/questions.md"]
    files = [f for f in files if os.path.exists(f)]
    if not files:
        sys.exit(f"{cfg.name}：{target} 下没有 questions.md（{cfg.name}题库还没建立）")
    corpus = load_corpus()
    only = set(argv[2:])
    flagged = 0
    for f in files:
        chap = os.path.basename(os.path.dirname(f))
        for qid, t in questions(f):
            if only and qid not in only:
                continue
            if t is None:
                print(f"{chap}  {qid}  没有题干")
                flagged += 1
                continue
            miss = unmatched(t, corpus)
            hit = 1 - sum(len(x) for x in miss) / max(1, len(t))
            mark = ""
            if hit < 0.85:
                mark = "  <<< 请核对"
                flagged += 1
            print(f"{chap}  {qid}  吻合 {hit:.2f}{mark}")
            if only or hit < 0.85:
                print("    未匹配片段：", "、".join(miss) or "（无）")
    print(f"共标出 {flagged} 道需要核对")


if __name__ == "__main__":
    main()
