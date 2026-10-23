#!/usr/bin/env python3
"""检查一章的 lesson.md / questions.md 是否符合 course/FORMAT.md。

子代理交回的章节先过这道检查，再由人审读。检查的是格式和硬性规则，
不判断内容对不对：物理是否正确、孩子能否看懂，仍要人看。

用法：/usr/bin/python3 scripts/check-chapter.py course/physics/g9-13-internal-energy
      /usr/bin/python3 scripts/check-chapter.py course/math/<章目录>
学科从路径判断（course/physics/… 或 course/math/…），也可加 --subject physics|math。各学科的编号、取值配置在 scripts/course_subjects.py。
"""
import re, sys
from pathlib import Path
import yaml

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import course_subjects as cs  # noqa: E402

ROOT = cs.ROOT
cfg = cs.PHYSICS  # main() 里按路径换成实际学科
SUBS = ["本次只学", "先认住", "破题钥匙", "数形结合", "走一遍", "容易错", "练一练"]  # 数形结合：数学可选；破题钥匙：物理/化学可选；各最多一块
# 轻重与篇幅：先认住、容易错条数上限；练一练题数范围；是否写“走一遍”
BUDGET = {
    "重点": dict(know=4, pitfalls=3, qs=(1, 2), walk=True),
    "一般": dict(know=3, pitfalls=2, qs=(1, 1), walk=False),
    "了解": dict(know=3, pitfalls=0, qs=(0, 0), walk=False),
}
TAGS = {"概念", "公式", "单位", "计算", "审题", "前置"}
# 学生正文里不该出现的维护用语
BANNED = ["sources.md", "待复核", "TODO", "待查", "维护", "审查", "v1", "状元笔记", "OCR", "备选"]

errors, warnings = [], []
err = errors.append
warn = warnings.append


BRIDGE_TONES = {"green", "red", "yellow", "blue"}
BRIDGE_GLYPHS = {"parab-up", "parab-down", "parab-narrow", "parab-wide", "hyper-rect", "ray-gt", "ray-ge", "ray-lt", "ray-le"}
try:  # 其余小图由 scripts/bridge_glyphs/build.py 生成，名字以它为准
    import json as _json
    BRIDGE_GLYPHS |= set(_json.loads((Path(__file__).resolve().parent.parent / "src/lib/bridgeGlyphs.json").read_text(encoding="utf-8")))
except Exception:
    pass


THINK_MOVES = ["理想化", "控制变量", "转换", "等效", "画图", "守恒"]  # 物理；与 src/lib/thinkCards.js 一致
THINK_MOVES_CHEM = THINK_MOVES + ["证据", "类别预测"]  # 化学（三重表征）可多用两个


def check_think(kid, source):
    """破题钥匙卡片：现象、模型、图、关系各一行（图必须是 phy- 开头的已画好小图）；可选 招、结。"""
    got = {}
    for raw in source.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = re.match(r"^(现象|模型|关系|宏观|微观|符号|图|招|结)\s*[:：]\s*(.*)$", line)
        if not m or not m.group(2).strip():
            err(f"{kid}：破题钥匙卡片里有看不懂的行：{line}")
            continue
        if m.group(1) in got:
            err(f"{kid}：破题钥匙的“{m.group(1)}”写了不止一行")
        got[m.group(1)] = m.group(2).strip()
    triple = "宏观" in got
    if triple and any(k in got for k in ("现象", "模型", "关系")):
        err(f"{kid}：破题钥匙不能把 宏观/微观/符号 和 现象/模型/关系 混着写")
    for k in (("宏观", "微观", "图", "符号") if triple else ("现象", "模型", "图", "关系")):
        if k not in got:
            err(f"{kid}：破题钥匙缺“{k}”")
    if cfg.key == "chemistry" and not triple:
        err(f"{kid}：化学的破题钥匙（三重表征）要写 宏观、微观、图、符号")
    if cfg.key == "physics" and triple:
        err(f"{kid}：物理的破题钥匙要写 现象、模型、图、关系")
    prefix = "chem-" if triple else "phy-"
    if "图" in got and not (got["图"].startswith(prefix) and got["图"] in BRIDGE_GLYPHS):
        err(f"{kid}：破题钥匙没有这个小图：{got['图']}")
    moves = THINK_MOVES_CHEM if triple else THINK_MOVES
    if "招" in got and got["招"] not in moves:
        err(f"{kid}：破题钥匙没有这一招：{got['招']}（只能用 {'/'.join(moves)}）")


def check_bridge(kid, source):
    """数形结合卡片：mode、卡片数（1–3，大字卡 2–3）、每张必须有式和形，图和色只能用约定的名字。"""
    mode, cards, card = "cards", [], {}
    for raw in source.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line == "---":
            cards.append(card); card = {}
            continue
        m = re.match(r"^(mode|式|图|形|色|结)\s*[:：]\s*(.*)$", line)
        if not m:
            err(f"{kid}：数形结合卡片里有看不懂的行：{line}")
            continue
        if m.group(1) == "mode":
            mode = m.group(2)
        elif m.group(1) != "结":
            card[m.group(1)] = m.group(2)
    cards.append(card)
    cards = [c for c in cards if c]
    if mode not in ("cards", "hero"):
        err(f"{kid}：数形结合 mode 只能是 cards 或 hero")
    if not 1 <= len(cards) <= 3:
        err(f"{kid}：数形结合要 1–3 张卡，现在 {len(cards)} 张")
    if mode == "hero" and len(cards) < 2 and len(cards) != 1:
        err(f"{kid}：大字卡数量不对")
    for c in cards:
        if "式" not in c or "形" not in c:
            err(f"{kid}：数形结合每张卡都要有“式”和“形”")
        if "图" in c and c["图"].split(":")[0].strip() not in BRIDGE_GLYPHS:
            err(f"{kid}：数形结合没有这个小图：{c['图']}")
        if "色" in c and c["色"] not in BRIDGE_TONES:
            err(f"{kid}：数形结合没有这个颜色：{c['色']}")


def frontmatter(text):
    if text.startswith("---\n"):
        end = text.index("\n---\n", 4)
        return yaml.safe_load(text[4:end]), text[end + 5:]
    return {}, text


def load_map():
    data = yaml.safe_load(cfg.need(cfg.kp_map, "知识点地图 kp-map.yml").read_text())
    return {k["id"]: k for s in data for k in s.get("kps") or []}


def items(body):
    """顶层列表项（以 “- ” 或 “1. ” 开头的行）。"""
    return [l for l in body.splitlines() if re.match(r"(- |\d+\. )", l)]


def check_images(where, body, chapter_dir):
    for src in re.findall(r"!\[[^\]]*\]\(([^)]+)\)", body):
        if not (chapter_dir / src).exists():
            err(f"{where}：图片不存在 {src}")


def check_lesson(chapter_dir, kpmap):
    front, text = frontmatter((chapter_dir / "lesson.md").read_text())
    cid = front.get("id", "")
    if not re.fullmatch(cfg.chapter_re, cid):
        err(f"lesson.md 文件头 id 应为章编号，如 {cfg.chapter_example}，现在是 {cid!r}")
    for f in ("subject", "title", "textbook", "status", "updated"):
        if not front.get(f):
            err(f"lesson.md 文件头缺 {f}（照样板章写）")
    # 学生正文里不能出现内部编号（练一练的题号行除外）
    student_all = re.sub(r"```yaml.*?```", "", text, flags=re.S)
    for line in student_all.splitlines():
        if line.startswith("- `Q-"):
            continue
        if re.search(r"PHY-|CHEM-|MATH-", line):
            err(f"lesson.md 学生正文里出现内部编号：{line.strip()[:60]}（写成“第十五章第 4 节”这类说法）")
        elif "`Q-" in line:
            err(f"lesson.md 题号只能写在“练一练”里：{line.strip()[:60]}")
    chunks = re.split(r"\n(?=## )", text)
    headings = [c.split("\n", 1)[0][3:].strip() for c in chunks[1:]]
    if "本章前置自查" not in headings:
        err("lesson.md 缺“本章前置自查”")
    refs, seen = [], []
    for chunk in chunks[1:]:
        heading = chunk.split("\n", 1)[0][3:].strip()
        if heading == "本章前置自查":
            continue
        m = re.search(r"```yaml\n(.*?)```", chunk, re.S)
        if not m:
            err(f"{heading}：缺后台信息 yaml 块"); continue
        meta = yaml.safe_load(m.group(1))
        kid = meta.get("id", "")
        seen.append(kid)
        mkid = re.fullmatch(cfg.kp_re, kid)
        if mkid:
            code = f"{int(mkid.group(1))}.{mkid.group(2)}{mkid.group(3)}"
            if heading.split(" ", 1)[0] != code:
                err(f"{kid}：标题要以“{code} ”开头（学生看到的是这个编号），现在是“{heading}”")
        mk = kpmap.get(kid)
        if not mk:
            err(f"{heading}：{kid} 不在 kp-map.yml 里"); continue
        if meta.get("weight") != mk["weight"]:
            err(f"{kid}：weight {meta.get('weight')} 与地图 {mk['weight']} 不一致")
        a = sorted(p.get("id") for p in meta.get("prerequisites") or [])
        b = sorted(p["id"] for p in mk.get("prerequisites") or [])
        if a != b:
            err(f"{kid}：前置 {a} 与地图 {b} 不一致")
        for p in meta.get("prerequisites") or []:
            if p.get("strength") not in ("hard", "soft") or not p.get("reason"):
                err(f"{kid} → {p.get('id')}：要写 strength（hard / soft）和 reason")
        ev = meta.get("evidence") or []
        lo_ev = 1 if mk["weight"] == "了解" else 2
        if not lo_ev <= len(ev) <= 3:
            err(f"{kid}：evidence 要 {lo_ev}–3 条，现在 {len(ev)} 条")
        for f in ("textbook", "figure", "sources"):
            if not meta.get(f):
                err(f"{kid}：缺 {f}")

        body = chunk[m.end():]
        subs = re.split(r"\n(?=### )", "\n" + body)[1:]
        names = [s.split("\n", 1)[0][4:].strip() for s in subs]
        for n in names:
            if n not in SUBS:
                err(f"{kid}：小标题“{n}”不在规定的小标题里")
        order = [n for n in SUBS if n in names]
        if [n for n in names if n in SUBS] != order:
            err(f"{kid}：小标题顺序应为 {' / '.join(SUBS)}")
        content = {s.split("\n", 1)[0][4:].strip(): (s.split("\n", 1)[1] if "\n" in s else "") for s in subs}
        for name in ("本次只学", "先认住", "容易错"):
            if re.search(r"课本\s*p\.|复习与提高第|练习与应用第|原卷", content.get(name, "")):
                err(f"{kid}：“{name}”里出现来源说明（如“课本 p.109 第 9 题”），来源写进 sources.md")
        for name, sec_text in content.items():
            if name != "练一练" and "`Q-" in sec_text:
                err(f"{kid}：“{name}”里出现题号；题号只能写在“练一练”里，“走一遍”用课本例子")
        if "破题钥匙" in content:
            if cfg.key == "math":
                err(f"{kid}：数学不写“破题钥匙”（数学用“数形结合”）")
            think_text = content["破题钥匙"]
            m_think = re.search(r"```think\s*\n(.*?)```", think_text, re.S)
            if not m_think:
                err(f"{kid}：破题钥匙必须写成 ```think 卡片（见 FORMAT.md）")
            else:
                check_think(kid, m_think.group(1))
                rest = think_text[:m_think.start()] + think_text[m_think.end():]
                if rest.strip():
                    err(f"{kid}：破题钥匙的卡片之外不要再写文字")
        if "数形结合" in content:
            if cfg.key != "math":
                err(f"{kid}：只有数学可以写“数形结合”")
            bridge_text = content["数形结合"]
            m_bridge = re.search(r"```bridge\s*\n(.*?)```", bridge_text, re.S)
            if m_bridge:
                check_bridge(kid, m_bridge.group(1))
                rest = (bridge_text[:m_bridge.start()] + bridge_text[m_bridge.end():])
                if [l for l in rest.splitlines() if l.strip() and not l.strip().startswith("![")]:
                    err(f"{kid}：数形结合的卡片之外不要再写文字")
            else:
                # 迁移期：旧的文字写法只提示，全部改成卡片后升为错误
                n_lines = len([l for l in bridge_text.splitlines() if l.strip() and not l.strip().startswith("![")])
                if n_lines > 3:
                    err(f"{kid}：数形结合最多 3 行，现在 {n_lines} 行")
                err(f"{kid}：数形结合必须写成 ```bridge 卡片（见 FORMAT.md）")
        bud = BUDGET[mk["weight"]]
        if "本次只学" not in content and mk["weight"] != "了解":
            err(f"{kid}：缺“本次只学”")
        if len(items(content.get("先认住", ""))) > bud["know"]:
            err(f"{kid}：先认住 {len(items(content['先认住']))} 条，{mk['weight']}最多 {bud['know']} 条")
        if bud["walk"] and "走一遍" not in content:
            warn(f"{kid}：重点知识点一般要有“走一遍”")
        if not bud["walk"] and "走一遍" in content:
            err(f"{kid}：只有重点知识点写“走一遍”")
        n_pit = len(items(content.get("容易错", "")))
        if n_pit > bud["pitfalls"]:
            err(f"{kid}：容易错 {n_pit} 条，{mk['weight']}最多 {bud['pitfalls']} 条")
        qs = re.findall(r"^- `(Q-[^`]+)`", content.get("练一练", ""), re.M)
        lo, hi = bud["qs"]
        if not lo <= len(qs) <= hi:
            (warn if len(qs) == lo - 1 or len(qs) == hi + 1 else err)(
                f"{kid}：练一练 {len(qs)} 道，{mk['weight']}应为 {lo}–{hi} 道")
        for line in content.get("练一练", "").splitlines():
            if line.startswith("- `Q-") and re.sub(r"^- `Q-[^`]+`(\s*第（\d+）问)?", "", line).strip():
                err(f"{kid}：练一练的说明文字要另起一行，不和编号写在同一行：{line}")
        refs += qs
        student = re.sub(r"```yaml.*?```", "", chunk, flags=re.S)
        for w in BANNED:
            if w in student:
                err(f"{kid}：学生正文里出现维护用语“{w}”")
        if re.search(r"\\textcolor\{#287fc4\}\{[^{}]*\\mathrm", body):
            err(f"{kid}：蓝色只给数字，单位放在花括号外（\\textcolor{{#287fc4}}{{2.5}}\\ \\mathrm{{V}}）")
        walk = content.get("走一遍", "")
        if re.search(r"=\s*\\?[\d.]", walk) and "\\boxed" not in walk:
            warn(f"{kid}：“走一遍”里有计算但没有加框的最终答案（计算步骤写法见 FORMAT.md）")
        check_images(kid, body, chapter_dir)

    if cid:
        expected = [k for k in kpmap if k.startswith(cid + "-")]
        missing = [k for k in expected if k not in seen]
        if missing:
            warn(f"本章在地图里还有知识点没写：{', '.join(missing)}")
        if [k for k in seen if k in expected] != [k for k in expected if k in seen]:
            err("知识点顺序应与地图一致")
    return cid, refs


def check_questions(chapter_dir, kpmap, refs):
    _, text = frontmatter((chapter_dir / "questions.md").read_text())
    main = re.split(r"\n## 备选", text)[0]
    blocks = {b.split("\n", 1)[0][4:].strip(): b for b in re.split(r"\n(?=### Q-)", main)[1:]}
    for q in refs:
        if q not in blocks:
            err(f"讲义引用的 {q} 不在 questions.md 的讲义用题部分")
    for q in blocks:
        if q not in refs:
            warn(f"{q} 在讲义用题部分，但讲义没有引用（不用就移到备选）")
    if len(set(refs)) > 10:
        warn(f"全章 {len(set(refs))} 道题，一般在 10 道以内")

    # 题号全科唯一：别的章已经用过的编号不能再用（同一道真题在不同章只能用不同小问、不同编号）
    for other in sorted(cfg.dir.glob("*/questions.md")):
        if other.parent.resolve() == chapter_dir.resolve():
            continue
        used = set(re.findall(r"^### (Q-[^\s]+)", re.split(r"\n## 备选", other.read_text())[0], re.M))
        for qid in blocks:
            if qid in used:
                err(f"{qid}：编号已在 {other.parent.name} 用过；同一道题不要两章都放，确需复用就只用别的小问并改编号")
    for qid, b in blocks.items():
        if not re.fullmatch(cfg.question_re, qid):
            err(f"{qid}：题目编号格式不对")
        m = re.search(r"```yaml\n(.*?)```", b, re.S)
        if not m:
            err(f"{qid}：缺 yaml 块"); continue
        meta = yaml.safe_load(m.group(1))
        for f in ("category", "source", "source_quality", "kp", "type", "grading", "answer_by", "review"):
            if not meta.get(f):
                err(f"{qid}：缺 {f}")
        if meta.get("category") not in CATEGORIES:
            err(f"{qid}：category 只能是 {' / '.join(CATEGORIES)}")
        if meta.get("type") not in TYPES:
            err(f"{qid}：type 只能是 {' / '.join(TYPES)}")
        if meta.get("type") in cfg.self_graded_types and meta.get("grading") != "自评":
            err(f"{qid}：{meta.get('type')}题只能自评（grading: 自评）")
        if cfg.answer_by_values and meta.get("answer_by") \
                and not any(v in str(meta["answer_by"]) for v in cfg.answer_by_values):
            err(f"{qid}：answer_by 只能是 {' / '.join(cfg.answer_by_values)}")
        if meta.get("grading") == "自动" and meta.get("type") not in ("选择", "选填"):
            err(f"{qid}：只有选择题和有固定选项的选填才能自动判分")
        if meta.get("category") == "课本习题" and "待复核" not in str(meta.get("answer_by", "")) \
                and "复核" not in str(meta.get("answer_by", "")):
            err(f"{qid}：课本习题答案由本项目编写，answer_by 要标“本项目编写，待复核”（家长复核后改“本项目编写，已复核”）")
        do = meta.get("do")
        if do and not re.fullmatch(r"本章只做[^；;。]*", str(do)):
            err(f"{qid}：do 会印在学生版题目上，只能写“本章只做第（N）问”这类说明；维护说明写进 sources.md")
        for ref in re.findall(cfg.kp_ref_re, str(meta.get("other_parts", ""))):
            if ref not in kpmap:
                err(f"{qid}：other_parts 里的 {ref} 不在地图里")
        if re.search(r"\\textcolor\{#287fc4\}\{[^{}]*\\mathrm", b):
            err(f"{qid}：蓝色只给数字，单位放在花括号外（\\textcolor{{#287fc4}}{{2.5}}\\ \\mathrm{{V}}）")
        kp = meta.get("kp")
        if kp and kp not in kpmap:
            err(f"{qid}：kp {kp} 不在地图里")
        for tag, target in (meta.get("review") or {}).items():
            if tag not in TAGS:
                err(f"{qid}：错因标签“{tag}”不在 6 个规定标签里")
            if not (target in kpmap or re.match(cfg.xsubject_re, str(target))):
                err(f"{qid}：review {tag} → {target} 不是地图里的知识点编号")
        parts = dict(re.findall(r"^\*\*(题干|答案|解析)\*\*\s*\n(.*?)(?=^\*\*(?:题干|答案|解析)\*\*|\Z)", b, re.S | re.M))
        for f in ("题干", "答案", "解析"):
            if not parts.get(f, "").strip(" \n-"):
                err(f"{qid}：缺 {f}")
        if meta.get("grading") == "自动" and meta.get("type") == "选择":
            if len(re.findall(r"(?:^|\s)[A-D][.．]\s*\S", parts.get("题干", ""))) < 4:
                err(f"{qid}：选择题题干里要有 A–D 四个选项")
            if not re.fullmatch(r"\s*[A-D]\s*", parts.get("答案", "").split("\n\n---")[0].strip().split("\n")[0]):
                err(f"{qid}：自动判分的选择题，答案第一行只写一个字母")
        sol = parts.get("解析", "")
        if meta.get("type") in ("计算", "填空", "选填") and re.search(r"=\s*[\d.]", sol) and "\\boxed" not in sol:
            warn(f"{qid}：解析里有计算但没有加框的最终答案（计算步骤写法见 FORMAT.md）")
        check_images(qid, b, chapter_dir)


def main():
    global cfg, CATEGORIES, TYPES
    cfg, argv = cs.pick(sys.argv)
    if len(argv) != 2:
        sys.exit(__doc__)
    CATEGORIES, TYPES = set(cfg.categories), set(cfg.types)
    chapter_dir = Path(argv[1]).resolve()
    for f in ("lesson.md", "questions.md", "sources.md"):
        if not (chapter_dir / f).exists():
            err(f"缺 {f}")
    if errors:
        print("\n".join("错误：" + e for e in errors)); sys.exit(1)
    for f in ("lesson.md", "questions.md", "sources.md"):
        for i, line in enumerate((chapter_dir / f).read_text().splitlines(), 1):
            if re.search(r"”[^“”\n]*”", line) and line.count("“") < line.count("”"):
                err(f"{f} 第 {i} 行：中文引号不成对（左引号被写成了右引号）")
    kpmap = load_map()
    src = (chapter_dir / "sources.md").read_text()
    for need in ("考点轻重统计", "冲突与取舍", "未解决的问题"):
        if need not in src:
            err(f"sources.md 缺“{need}”一节（照样板章的结构写）")
    cid, refs = check_lesson(chapter_dir, kpmap)
    check_questions(chapter_dir, kpmap, refs)
    for w in warnings:
        print("提示：", w)
    for e in errors:
        print("错误：", e)
    print(f"{cid}：{len(errors)} 个错误，{len(warnings)} 条提示")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
