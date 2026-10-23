#!/usr/bin/env python3
"""核对题图是不是取自对的试卷、对的那道题。

用法：
  python3 scripts/check-figure-source.py course/physics/<章目录>   # 一章
  python3 scripts/check-figure-source.py course/physics            # 全科
  course/math/… 同理（学科从路径判断，也可加 --subject math）；配置在 scripts/course_subjects.py。

做法：读原卷 Word（解析版）的正文，按出现顺序记下每张图在第几题；再按文件指纹找到 figures/ 里每张图对应的原图，
和文件名里的地区、年份、题号（如 gz2023-07-1.png → 2023 广州第 7 题）对照。
- 对不上题号或试卷：标“<<< 题号不符”，必须换图。
- 找不到原图：多半是裁剪过或转了格式，标“需人工看图”，打开核对内容。
- 文件名不是“地区年份-题号”格式（如课本截图）：跳过。
"""
import glob, hashlib, os, re, sys, zipfile
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import course_subjects as cs  # noqa: E402

REGION = {"广州": "gz", "深圳": "sz", "广东": "gd"}


def exam_key(path):
    name = os.path.basename(path)
    year = re.search(r"(20\d\d)年", name).group(1)
    region = "gz" if "广州" in name else "sz" if "深圳" in name else "gd"
    return region, year


def index_exam(path):
    """返回 {md5: 题号}：按正文顺序，图归属于它前面最近的“N．/N.”开头的题。"""
    z = zipfile.ZipFile(path)
    rels = dict(re.findall(r'Id="([^"]+)"[^>]*Target="media/([^"]+)"', z.read("word/_rels/document.xml.rels").decode()))
    doc = z.read("word/document.xml").decode()
    out, current = {}, None
    for para in re.findall(r"<w:p[ >].*?</w:p>", doc, re.S):
        text = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", para)).strip()
        m = re.match(r"(\d{1,2})\s*[．.、](?!\d)", text)  # “4.5”“3.8V”这类数值不是题号
        if m and not text.startswith(("【", "（")):
            n = int(m.group(1))
            if current is None or n == 1 or current < n <= current + 3:  # 题号只往后走；卷首“注意事项”也编号，遇到 1 重新计
                current = n
        for rid in re.findall(r'r:embed="([^"]+)"', para):
            media = rels.get(rid)
            if media and current is not None:
                h = hashlib.md5(z.read("word/media/" + media)).hexdigest()
                out.setdefault(h, (current, media))
    return out


def main():
    cfg, argv = cs.pick(sys.argv)
    EXAMS = [os.path.expanduser(g) for g in cfg.exam_globs]
    if len(argv) < 2:
        sys.exit(__doc__)
    target = argv[1].rstrip("/")
    figs = sorted(glob.glob(target + "/*/figures/*.png")) or sorted(glob.glob(target + "/figures/*.png"))
    index = {}
    for pat in EXAMS:
        for d in glob.glob(pat):
            index[exam_key(d)] = index_exam(d)
    bad = manual = 0
    for f in figs:
        b = os.path.basename(f)
        m = re.match(r"(gz|gd|sz)(20\d\d)-(\d+)", b)
        if not m:
            continue
        key, q = (m.group(1), m.group(2)), int(m.group(3))
        h = hashlib.md5(open(f, "rb").read()).hexdigest()
        hit = [(k, v) for k, idx in index.items() for hh, v in idx.items() if hh == h]
        chap = os.path.basename(os.path.dirname(os.path.dirname(f)))
        if not hit:
            manual += 1
            print(f"{chap}  {b}  找不到原图（裁剪或转格式），需人工看图")
            continue
        ok = any(k == key and v[0] == q for k, v in hit)
        where = "；".join(f"{k[1]}{'广州' if k[0]=='gz' else '深圳' if k[0]=='sz' else '广东'}第{v[0]}题 {v[1]}" for k, v in hit)
        if ok:
            print(f"{chap}  {b}  对（{where}）")
        else:
            bad += 1
            print(f"{chap}  {b}  <<< 题号不符：原图在 {where}")
    print(f"题号不符 {bad} 张；需人工看图 {manual} 张")


if __name__ == "__main__":
    main()
