#!/usr/bin/env python3
"""校验知识点地图 course/<学科>/kp-map.yml（物理、数学），并输出概览。

检查：节与课本目录一一对应；知识点编号格式、唯一；轻重、前置强度取值；
前置指向的编号存在、没有环；exam_hits / exam_refs 与 exam-hits.tsv 一致；
各章 lesson.md 里的知识点字段与地图一致（不一致只提示，不算失败）。

用法：
  /usr/bin/python3 scripts/check-kp-map.py              # 校验
  /usr/bin/python3 scripts/check-kp-map.py --overview   # 校验并打印概览
  /usr/bin/python3 scripts/check-kp-map.py --write-stats  # 校验并重新生成 exam-stats.md
  加 --subject math 检查数学（不加默认物理）。各学科配置在 scripts/course_subjects.py。
"""
import collections, re, sys
from pathlib import Path
import yaml

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import course_subjects as cs  # noqa: E402

ROOT = cs.ROOT
cfg = cs.PHYSICS  # main() 里按 --subject 换成实际学科
WEIGHTS = ("重点", "一般", "了解")
PAPERS = cfg.papers  # 统计范围；代号与 exam-hits.tsv 的题号前缀一致
errors, warnings = [], []


def load_sections():
    out = collections.OrderedDict()
    chapter = None
    for line in cfg.need(cfg.sections_md, "课本章节目录 textbook-sections.md").read_text().splitlines():
        if line.startswith("### "):
            chapter = line[4:].split("（")[0]
        m = re.match(cfg.section_line_re, line.strip())
        if m:
            out[m.group(1)] = dict(title=m.group(3), page=int(m.group(4)), practice=bool(m.group(2)), chapter=chapter)
    return out


def load_hits():
    hits = collections.defaultdict(list)
    for i, line in enumerate(cfg.need(cfg.hits_tsv, "真题归类表 exam-hits.tsv").read_text().splitlines()[1:], 2):
        ref, kp = line.split("\t")
        if ref.split("-")[0] not in PAPERS:
            errors.append(f"exam-hits.tsv 第 {i} 行：未知试卷 {ref}")
        hits[kp].append(ref)
    return hits


def check(data, sections, hits):
    kps = collections.OrderedDict()
    seen_sec = []
    for s in data:
        sec = s["section"]
        seen_sec.append(sec)
        info = sections.get(sec)
        if not info:
            errors.append(f"{sec}：课本目录里没有这一节"); continue
        if s.get("page") != info["page"]:
            errors.append(f"{sec}：页码 {s.get('page')} 与目录 {info['page']} 不一致")
        if info["practice"]:
            if s.get("type") != "跨学科实践" or not s.get("task") or s.get("kps"):
                errors.append(f"{sec}：跨学科实践节应写 type 和 task，不拆知识点")
            continue
        if not s.get("kps"):
            errors.append(f"{sec}：没有知识点"); continue
        for k in s["kps"]:
            kid = k["id"]
            if not re.fullmatch(re.escape(sec) + r"[a-z]", kid):
                errors.append(f"{kid}：编号应为节编号加一个小写字母")
            if kid in kps:
                errors.append(f"{kid}：编号重复")
            if k.get("weight") not in WEIGHTS:
                errors.append(f"{kid}：weight 只能是 重点 / 一般 / 了解")
            if not k.get("weight_note"):
                errors.append(f"{kid}：缺 weight_note")
            refs = k.get("exam_refs") or []
            if k.get("exam_hits") != len(refs):
                errors.append(f"{kid}：exam_hits={k.get('exam_hits')}，但 exam_refs 有 {len(refs)} 条")
            if sorted(refs) != sorted(hits.get(kid, [])):
                errors.append(f"{kid}：exam_refs 与 exam-hits.tsv 不一致")
            k["_section"] = sec
            kps[kid] = k
    if seen_sec != list(sections):
        errors.append("节的顺序或数量与 textbook-sections.md 不一致")
    for kid in set(hits) - set(kps):
        errors.append(f"exam-hits.tsv 里的 {kid} 在地图中不存在")

    deps = collections.defaultdict(list)
    for kid, k in kps.items():
        pres = k.get("prerequisites") or []
        if len(pres) > 4:
            warnings.append(f"{kid}：前置 {len(pres)} 条，超过 4 条")
        for p in pres:
            pid = p.get("id", "")
            if p.get("strength") not in ("hard", "soft"):
                errors.append(f"{kid} → {pid}：strength 只能是 hard / soft")
            if not p.get("reason"):
                errors.append(f"{kid} → {pid}：缺 reason")
            if pid.startswith(cfg.prefix + "-"):
                if pid not in kps:
                    errors.append(f"{kid} → {pid}：前置编号不存在")
                elif pid == kid:
                    errors.append(f"{kid}：前置指向自己")
                else:
                    deps[kid].append(pid)
            elif not re.match(cfg.xsubject_re, pid):
                errors.append(f"{kid} → {pid}：{cfg.xsubject_msg}")
            elif p.get("strength") == "hard" and pid.startswith(cfg.soft_prefixes):
                warnings.append(f"{kid} → {pid}：跨学科前置一般标 soft")

    # 找环（深度优先）
    state = {}
    def visit(n, path):
        state[n] = 1
        for m in deps.get(n, []):
            if state.get(m) == 1:
                errors.append("前置关系有环：" + " → ".join(path[path.index(m):] + [m]))
            elif m not in state:
                visit(m, path + [m])
        state[n] = 2
    for n in kps:
        if n not in state:
            visit(n, [n])
    return kps, deps


def check_lessons(kps):
    for lesson in sorted(cfg.dir.glob("*/lesson.md")):
        text = lesson.read_text()
        for block in re.findall(r"```yaml\n(.*?)```", text, re.S):
            k = yaml.safe_load(block)
            if not isinstance(k, dict) or "id" not in k:
                continue
            kid, rel = k["id"], lesson.relative_to(ROOT)
            m = kps.get(kid)
            if not m:
                warnings.append(f"{rel}：{kid} 不在地图里"); continue
            if k.get("weight") != m["weight"]:
                warnings.append(f"{rel}：{kid} weight {k.get('weight')} ≠ 地图 {m['weight']}")
            a = sorted(p["id"] for p in k.get("prerequisites") or [])
            b = sorted(p["id"] for p in m.get("prerequisites") or [])
            if a != b:
                warnings.append(f"{rel}：{kid} 前置 {a} ≠ 地图 {b}")


def overview(data, kps, deps, sections):
    by_ch = collections.OrderedDict()
    for s in data:
        ch = sections[s["section"]]["chapter"]
        row = by_ch.setdefault(ch, collections.Counter())
        row["节"] += 1
        if s.get("type"):
            row["实践"] += 1
        for k in s.get("kps") or []:
            row["点"] += 1; row[k["weight"]] += 1; row["真题"] += k["exam_hits"]
    lines = ["| 章 | 节 | 知识点 | 重点 | 一般 | 了解 | 真题计次 |", "| --- | --- | --- | --- | --- | --- | --- |"]
    tot = collections.Counter()
    for ch, r in by_ch.items():
        tot.update(r)
        lines.append(f"| {ch} | {r['节']}{'（含实践 %d）' % r['实践'] if r['实践'] else ''} | {r['点']} | {r['重点']} | {r['一般']} | {r['了解']} | {r['真题']} |")
    lines.append(f"| **合计** | {tot['节']}（含实践 {tot['实践']}） | {tot['点']} | {tot['重点']} | {tot['一般']} | {tot['了解']} | {tot['真题']} |")
    rdeps = collections.Counter(p for v in deps.values() for p in v)
    lines += ["", "被依赖最多的知识点（其他知识点把它列为前置的次数）：", ""]
    for kid, n in rdeps.most_common(12):
        lines.append(f"- {kid} {kps[kid]['title']}（{kps[kid]['weight']}）：{n} 次")
    lines += ["", "真题计次最多的知识点：", ""]
    for kid, k in sorted(kps.items(), key=lambda x: -x[1]["exam_hits"])[:12]:
        lines.append(f"- {kid} {k['title']}（{k['weight']}）：{k['exam_hits']} 次")
    return "\n".join(lines)


def write_stats(kps, hits, sections):
    per_paper = collections.defaultdict(list)
    for kid, refs in hits.items():
        for r in refs:
            per_paper[r.split("-")[0]].append((r, kid))
    def key(r):
        q = re.match(r"\w+-(\d+)(.*)", r)
        return int(q.group(1)), q.group(2)
    out = [cfg.stats_head.strip(), ""]
    out += ["## 2. 各知识点计次", "", "| 知识点 | 轻重 | 次数 | 广州 | 出现位置 |", "| --- | --- | --- | --- | --- |"]
    for kid, k in kps.items():
        refs = sorted(hits.get(kid, []), key=lambda r: (r[:6], key(r)))
        gz = sum(r.startswith("GZ") for r in refs)
        out.append(f"| {kid[len(cfg.prefix) + 1:]} {k['title']} | {k['weight']} | {len(refs)} | {gz} | {'、'.join(refs) or '—'} |")
    out += ["", "## 3. 逐卷记录", "", "题号后的（1）（2）是小问；一个小问考两个知识点时记两条。", ""]
    for code, name in PAPERS.items():
        rows = sorted(per_paper[code], key=lambda x: key(x[0]))
        out.append(f"### {name}（{len(rows)} 条）\n")
        out.append("；".join(f"{r.split('-', 1)[1]} {kps[k]['title']}" for r, k in rows) + "\n")
    cfg.stats_md.write_text("\n".join(out))


def main():
    global cfg, PAPERS
    cfg, _ = cs.pick(sys.argv)
    PAPERS = cfg.papers
    data = yaml.safe_load(cfg.need(cfg.kp_map, "知识点地图 kp-map.yml").read_text())
    sections = load_sections()
    hits = load_hits()
    kps, deps = check(data, sections, hits)
    check_lessons(kps)
    for w in warnings:
        print("提示：", w)
    for e in errors:
        print("错误：", e)
    print(f"{len(data)} 节，{len(kps)} 个知识点，{sum(len(v) for v in deps.values())} 条本科前置，{sum(len(v) for v in hits.values())} 条真题记录；"
          f"{len(errors)} 个错误，{len(warnings)} 条提示")
    if "--overview" in sys.argv:
        print("\n" + overview(data, kps, deps, sections))
    if "--write-stats" in sys.argv and not errors:
        write_stats(kps, hits, sections)
        print(f"已生成 {cfg.stats_rel}")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
