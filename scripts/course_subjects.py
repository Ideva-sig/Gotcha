"""各学科的编号、路径、课本、真题配置（唯一一份）。

脚本里不要再写死 `PHY-`、`8A|8B|9`、`course/physics` 这类内容，统一从这里取：

    import course_subjects as cs
    cfg = cs.pick(sys.argv)          # 按路径 / 编号自动判断学科，也认 --subject physics|math
    cfg.dir, cfg.prefix, cfg.kp_re ...

加新学科（如化学）：在 SUBJECTS 里加一份 Subject。数学里标 TODO 的项（课本页码差等）要等课本识别稿做好后再填，
不要猜数值；脚本遇到 None 时会提示，不会瞎算。
"""
import glob as _glob
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# 内容源目录：默认 <仓库>/course；环境变量 COURSE_DIR 可改成别处（如 sample-course），相对路径按仓库根算。
COURSE_ROOT = (ROOT / os.environ["COURSE_DIR"]) if os.environ.get("COURSE_DIR") else ROOT / "course"
# 本机资料根目录（课本 PDF、真题 Word、识别稿放在这里，不随仓库发布）。
# 默认是用户桌面上的“中考”文件夹（课本在各科的“人教版”文件夹里）；放在别处就设环境变量 COURSE_MATERIALS_DIR。
MATERIALS = Path(os.environ.get("COURSE_MATERIALS_DIR") or (Path.home() / "Desktop/中考"))


def _pat(rel):
    """资料目录下的 glob 写法；目录名带“[文件]”这种方括号，要先转义，不然会被当成通配符。"""
    return _glob.escape(str(MATERIALS)) + "/" + rel


@dataclass
class Subject:
    key: str                       # physics / math
    name: str                      # 物理 / 数学
    prefix: str                    # PHY / MATH
    books: tuple                   # 册别代码
    book_names: dict               # textbook-sections.md 里的册标题 → 册别代码
    chapter_re: str                # 章编号（lesson.md 文件头 id）
    chapter_example: str           # 报错时给的示例
    kp_re: str                     # 知识点编号：组 1 章号、组 2 节号、组 3 字母（册别不捕获）
    kp_ref_re: str                 # 在文字里找知识点编号（other_parts）
    section_re: str                # 节编号：组 1 册、组 2 章号（册别捕获）
    question_re: str               # 题目编号
    xsubject_re: str               # 其他学科的自由编号（前置、review 目标）
    xsubject_msg: str              # 前置编号不合规时的提示
    soft_prefixes: tuple           # 这些学科的前置一般标 soft（超过则提示）
    types: tuple                   # 题目 type 取值
    categories: tuple              # 题目 category 取值
    self_graded_types: tuple       # 这些 type 一律 grading: 自评（空 = 不检查）
    answer_by_values: tuple        # answer_by 允许的取值（空 = 不检查）
    papers: dict                   # 真题统计范围 代号 → 显示名（代号与 exam-hits.tsv 前缀一致）
    stats_head: str                # exam-stats.md 的开头
    # ---- 课本 ----
    textbook_dir: Path
    textbook_pdf: dict             # 册别 → (文件名关键字, PDF 页序与印刷页码之差；None = TODO 未配置)
    # ---- 真题 ----
    exam_root: Path                # 按年份分子目录：<exam_root>/<年>/
    exam_special: dict             # 代号 → 不在年份目录里的文件夹
    exam_region: dict              # 地区代码 → 解析版文件名里的关键字
    exam_globs: tuple              # 全部解析版 Word 的 glob（check-exam-text / check-figure-source 用）
    exam_pdf: dict = field(default_factory=dict)   # 代号 → [PDF 路径]（没有 Word 的卷）
    guide_pdf: Path = None         # 思想方法导引（数学）
    textbook_ocr: dict = field(default_factory=dict)  # 册别 → 课本识别稿 .md（有它就不读 PDF 文字层）

    # ---- 路径 ----
    @property
    def dir(self):
        return COURSE_ROOT / self.key

    @property
    def kp_map(self):
        return self.dir / "kp-map.yml"

    @property
    def sections_md(self):
        return self.dir / "textbook-sections.md"

    @property
    def hits_tsv(self):
        return self.dir / "exam-hits.tsv"

    @property
    def stats_md(self):
        return self.dir / "exam-stats.md"

    @property
    def stats_rel(self):
        return f"course/{self.key}/exam-stats.md"

    @property
    def section_line_re(self):
        """textbook-sections.md 里的节行。"""
        return rf"- `({re.escape(self.prefix)}-[^`]+)` (〔[^〕]+〕)?(.+)（p\.(\d+)）"

    def need(self, path, what):
        """必需文件不存在时给一句清楚的提示后退出，不抛异常。"""
        if not Path(path).exists():
            rel = Path(path)
            try:
                rel = rel.relative_to(ROOT)
            except ValueError:
                pass
            sys.exit(f"{self.name}的{what}还不存在：{rel}（{self.name}尚未建立，先建好这个文件再运行）")
        return Path(path)


# ---------------------------------------------------------------------------
# 物理（行为必须与改造前一字不变）
# ---------------------------------------------------------------------------

PHYSICS_STATS_HEAD = """
# 物理真题考点统计

> 由 `scripts/check-kp-map.py --write-stats` 根据 `exam-hits.tsv` 和 `kp-map.yml` 生成，不要手改第 2、3 节；改归类请改 `exam-hits.tsv` 后重新生成。

## 1. 范围和方法

- **范围**：2022–2024 年广州、广东省、深圳中考物理卷各 3 套（精品解析“解析版”Word），加 2025 年广州卷，共 10 套。广州卷权重最高。2025 广东卷只有刷题平台导出件，没有纳入；第十三章 `sources.md` 的旧统计含这套卷，所以个别次数相差 1。
- **计次**：逐题、逐小问判断“主要考查哪个知识点”。选择题只按正确选项和题目主干计，干扰项不计；一道选择题的选项分属两个知识点且各占一半时（如“摩擦力相等 / 做功相等”），两个都计。一个小问里不同空考不同知识点时，各计一次；同一知识点在同一小问里只计一次。
- **不计**：纯读图、读表的空（如“由图可知某时刻电流为多少”）、实验方案设计中只考控制变量的空、超纲的空。
- **双选题**：深圳 2022 有双选题，照样按选项计次。
- **定级参考**：
  - 重点：多次出现，或常在计算、实验、作图题里，或是失分率高的陷阱；
  - 一般：出现过但多为一步判断的送分题，或是重点知识点的必要基础；
  - 了解：10 套卷里几乎不直接考。
  - 2026 年广州实验操作考试（4 套题，每套 1 个八年级操作 + 1 个电路连接）涉及的内容，在地图里标 `lab_exam`，并作为“重点”的线索。
- **局限**：归类由本项目判断，同一道综合题归到哪个知识点有主观成分；10 套卷样本不大，次数只作轻重参考，不是精确的考频。
"""

MATH_STATS_HEAD = """
# 数学真题考点统计

> 由 `scripts/check-kp-map.py --subject math --write-stats` 根据 `exam-hits.tsv` 和 `kp-map.yml` 生成，不要手改第 2、3 节；改归类请改 `exam-hits.tsv` 后重新生成。

## 1. 范围和方法

- **范围**：2022–2024 年广东省、深圳市中考数学卷，2023–2024 年广州卷，加 2025 年广州、广东卷。2022 年没有广州卷。广西卷不收。广州卷权重最高。
- **计次**：逐题、逐小问判断“主要考查哪个知识点”；同一知识点在同一小问里只计一次。
- **局限**：归类由本项目判断，样本不大，次数只作轻重参考，不是精确的考频。
"""

PHYSICS = Subject(
    key="physics", name="物理", prefix="PHY",
    books=("8A", "8B", "9"),
    book_names={"八年级上册": "8A", "八年级下册": "8B", "九年级全一册": "9"},
    chapter_re=r"PHY-(8A|8B|9)-\d\d",
    chapter_example="PHY-9-13",
    kp_re=r"PHY-(?:8A|8B|9)-(\d\d)-(\d)([a-z])",
    kp_ref_re=r"PHY-(?:8A|8B|9)-\d\d-\d[a-z]",
    section_re=r"PHY-(8A|8B|9)-(\d\d)-\d",
    question_re=r"Q-PHY-(TB(8A|8B|9)-[\dR.]+-\d+|(GZ|GD|SZ)20\d\d-\d+(-\w+)?|(?:TJ|YN|HN|SX)20\d\d-\d+(-\w+)?|MG\d+-E\d+)",
    xsubject_re=r"(CHEM|MATH)-",
    xsubject_msg="跨学科前置要以 CHEM- 或 MATH- 开头",
    soft_prefixes=("CHEM-",),
    types=("选择", "选填", "填空", "计算", "简答", "作图"),
    categories=("课本习题", "真题", "外省真题", "导引例题"),
    self_graded_types=(),
    answer_by_values=(),
    papers={
        "GZ2022": "2022 广州", "GZ2023": "2023 广州", "GZ2024": "2024 广州", "GZ2025": "2025 广州",
        "GD2022": "2022 广东", "GD2023": "2023 广东", "GD2024": "2024 广东",
        "SZ2022": "2022 深圳", "SZ2023": "2023 深圳", "SZ2024": "2024 深圳",
    },
    stats_head=PHYSICS_STATS_HEAD,
    textbook_dir=MATERIALS / "物理/人教版",
    textbook_pdf={"8A": ("八年级上册", 6), "8B": ("八年级下册", 4), "9": ("九年级全一册", 6)},
    exam_root=MATERIALS / "中考真题/物理",
    exam_special={"GZ2025": MATERIALS / "物理/精品解析：2025年广东省广州市中考物理试题"},
    exam_region={"GZ": "广州市", "GD": "广东省中考", "SZ": "深圳市"},
    exam_globs=(_pat("中考真题/物理/*/*解析版*.docx"),
                _pat("物理/精品解析：2025年广东省广州市中考物理试题/*.docx")),
)

# ---------------------------------------------------------------------------
# 数学（2026-10-07 起；编号规则见 course/FORMAT.md“数学补充”）
# ---------------------------------------------------------------------------

_MB = "7A|7B|8A|8B|9A|9B"
_MCN = {"七": "7", "八": "8", "九": "9"}
_MATH_BOOK_NAMES = {}
for _g, _n in _MCN.items():
    for _t, _c in (("上册", "A"), ("下册", "B")):
        _MATH_BOOK_NAMES[f"{_g}年级{_t}"] = _n + _c

MATH = Subject(
    key="math", name="数学", prefix="MATH",
    books=tuple(_MB.split("|")),
    book_names=_MATH_BOOK_NAMES,
    chapter_re=rf"MATH-({_MB})-\d{{1,2}}",
    chapter_example="MATH-9A-26",
    kp_re=rf"MATH-(?:{_MB})-(\d{{1,2}})-(\d{{1,2}})([a-z])",
    kp_ref_re=rf"MATH-(?:{_MB})-\d{{1,2}}-\d{{1,2}}[a-z]",
    section_re=rf"MATH-({_MB})-(\d{{1,2}})-\d{{1,2}}",
    # 课本习题 TB9A-26.2-3 / 练习 TB9A-26.2P-2 / 复习题 TB9A-26R-5；真题 GZ2024-23-2；导引 MG16-E5
    question_re=rf"Q-MATH-(TB(?:{_MB})-(?:\d+\.\d+P?|\d+R)-\d+|(GZ|GD|SZ)20\d\d-\d+(-\w+)?|(?:TJ|YN|HN|SX)20\d\d-\d+(-\w+)?|MG\d+-E\d+)",
    xsubject_re=r"(CHEM|PHY)-",
    xsubject_msg="跨学科前置要以 CHEM- 或 PHY- 开头",
    soft_prefixes=("CHEM-", "PHY-"),
    types=("选择", "选填", "填空", "计算", "简答", "作图", "解答", "证明"),
    categories=("课本习题", "真题", "外省真题", "导引例题"),
    self_graded_types=("解答", "证明"),
    answer_by_values=("原卷解析", "导引原解", "本项目编写，待复核", "本项目编写，已复核"),
    papers={
        "GZ2023": "2023 广州", "GZ2024": "2024 广州", "GZ2025": "2025 广州",
        "GD2022": "2022 广东", "GD2023": "2023 广东", "GD2024": "2024 广东", "GD2025": "2025 广东",
        "SZ2022": "2022 深圳", "SZ2023": "2023 深圳", "SZ2024": "2024 深圳",
    },
    stats_head=MATH_STATS_HEAD,
    textbook_dir=MATERIALS / "初中人教版课本/数学/人教版",
    # 文件名关键字；页码差（PDF 页序 - 印刷页码），由 scripts/math-textbook-sections.py 按页脚统计，六册都是 6
    textbook_pdf={"7A": ("数学七年级上册", 6), "7B": ("数学七年级下册", 6),
                  "8A": ("数学八年级上册", 6), "8B": ("数学八年级下册", 6),
                  "9A": ("数学九年级上册", 6),
                  "9B": ("数学九年级下册", 6)},   # 九下是旧版（章号与修订版九上冲突）
    # 课本识别稿（PaddleOCR-VL-1.6 本机识别，见 ~/Documents/OCR-pdf_app/paddleocr-vl/）；修订版 PDF 文字层字形错乱不能用
    textbook_ocr={b: MATERIALS / f"数学/识别稿/{n}/{n}.md" for b, n in {
        "7A": "（根据2022年版课程标准修订）义务教育教科书·数学七年级上册",
        "7B": "（根据2022年版课程标准修订）义务教育教科书·数学七年级下册",
        "8A": "（根据2022年版课程标准修订）义务教育教科书·数学八年级上册",
        "8B": "（根据2022年版课程标准修订）义务教育教科书·数学八年级下册",
        "9A": "（根据2022年版课程标准修订）义务教育教科书·数学九年级上册",
        "9B": "义务教育教科书·数学九年级下册",  # 旧版
    }.items()},
    exam_root=MATERIALS / "中考真题/数学",
    exam_special={"GZ2025": MATERIALS / "数学/2025年广东省广州市中考数学真题"},
    # 文件名里广州卷写法不一（“广东广州中考”“广东省广州市中考”），所以只用“广州”
    exam_region={"GZ": "广州", "GD": "广东省中考", "SZ": "深圳"},
    exam_globs=(_pat("中考真题/数学/*/*解析版*.docx"),
                _pat("数学/2025年广东省广州市中考数学真题/*解析版*.docx")),
    # 2025 广东卷只有刷题平台导出的 PDF（公式文字层不可用，只能当线索），广西卷不收
    exam_pdf={"GD2025": [MATERIALS / "数学/2025-数学-广东-01.pdf",
                         MATERIALS / "数学/2025-数学-广东-02.pdf"]},
    guide_pdf=MATERIALS / "数学/初中数学思想方法导引.pdf",
)


# ---------------------------------------------------------------------------
# 化学（2026-10-14 起；编号规则见 course/FORMAT.md“化学补充”）
# ---------------------------------------------------------------------------

CHEM_STATS_HEAD = """
# 化学真题考点统计

> 由 `scripts/check-kp-map.py --subject chemistry --write-stats` 根据 `exam-hits.tsv` 和 `kp-map.yml` 生成，不要手改第 2、3 节；改归类请改 `exam-hits.tsv` 后重新生成。

## 1. 范围和方法

- **范围**：2022–2024 年广州卷（3 套）、2022–2025 年广东省卷（4 套），共 7 套（精品解析“解析版”Word）。没有 2025 年广州卷；深圳 2022、2023 卷按 2026-10-13 的决定不收。广州卷权重最高。
- **计次**：逐题、逐小问判断“主要考查哪个知识点”；同一知识点在同一小问里只计一次；选择题只按正确选项和题干计。
- **不计**：纯读图、读表的空；超纲的空。
- **九上、九下分开统计**：化学卷是全册综合卷，本表只统计九上知识点的命中；九下内容（金属、溶液、酸碱盐、化学与社会）的命中以后做九下时另表统计。
- **局限**：归类由本项目判断，同一道综合题归到哪个知识点有主观成分；样本不大，次数只作轻重参考，不是精确的考频。
"""

CHEM = Subject(
    key="chemistry", name="化学", prefix="CHEM",
    books=("9A", "9B"),
    book_names={"九年级上册": "9A", "九年级下册": "9B"},
    chapter_re=r"CHEM-(9A|9B)-\d\d",          # 章 = 单元
    chapter_example="CHEM-9A-03",
    kp_re=r"CHEM-(?:9A|9B)-(\d\d)-(\d)([a-z])",
    kp_ref_re=r"CHEM-(?:9A|9B)-\d\d-\d[a-z]",
    section_re=r"CHEM-(9A|9B)-(\d\d)-\d",
    # 课本习题 TB9A-3.2-4（单元.课题-题号，来自“练习与应用”）/ 复习与提高 TB9A-3R-5；真题 GZ2024-17-2
    question_re=r"Q-CHEM-(TB(?:9A|9B)-(?:\d+\.\d+|\d+R)-\d+|(GZ|GD|SZ)20\d\d-\d+(-\w+)?)",
    xsubject_re=r"(PHY|MATH)-",
    xsubject_msg="跨学科前置要以 PHY- 或 MATH- 开头",
    soft_prefixes=("PHY-", "MATH-"),
    types=("选择", "选填", "填空", "简答", "计算", "实验", "探究", "流程", "科普阅读", "综合"),
    categories=("课本习题", "真题"),
    self_graded_types=(),
    answer_by_values=("原卷解析", "本项目编写，待复核", "本项目编写，已复核"),
    papers={
        "GZ2022": "2022 广州", "GZ2023": "2023 广州", "GZ2024": "2024 广州",
        "GD2022": "2022 广东", "GD2023": "2023 广东", "GD2024": "2024 广东", "GD2025": "2025 广东",
    },
    stats_head=CHEM_STATS_HEAD,
    textbook_dir=MATERIALS / "初中人教版课本/化学/人教版",
    # 两册都是 2022 年版课标修订版；页码差 = PDF 页序（从 0 数）- 印刷页码，按页脚统计
    # 注意：资料根目录下 化学/ 里的九上 PDF 和 .md 识别稿是旧版课本（目录不同），不要用
    textbook_pdf={"9A": ("化学九年级上册", 6), "9B": ("化学九年级下册", 4)},
    exam_root=MATERIALS / "中考真题/化学",
    exam_special={"GD2025": MATERIALS / "化学/2025年广东省中考化学真题"},
    exam_region={"GZ": "广州市", "GD": "广东省中考", "SZ": "深圳市"},
    exam_globs=(_pat("中考真题/化学/*/*解析版*.docx"),
                _pat("化学/2025年广东省中考化学真题/*解析版*.docx")),
)

SUBJECTS = {"physics": PHYSICS, "math": MATH, "chemistry": CHEM}
DEFAULT = "physics"


# ---------------------------------------------------------------------------
# 学科判断
# ---------------------------------------------------------------------------

def from_path(arg):
    """路径在 course/<学科>/ 之下 → 学科；否则 None。"""
    try:
        rel = Path(arg).resolve().relative_to(ROOT / "course")
    except (ValueError, OSError):
        return None
    return SUBJECTS.get(rel.parts[0]) if rel.parts else None


def from_id(text):
    """PHY-9-14 / MATH-9A-26 / Q-MATH-... → 学科；否则 None。"""
    for s in SUBJECTS.values():
        if re.match(rf"(Q-)?{s.prefix}-", text):
            return s
    return None


def pick(argv=None, strip=True):
    """按 --subject、路径、编号依次判断学科；都没有时用物理。

    返回 (Subject, 去掉 --subject 参数后的 argv)。
    """
    argv = list(sys.argv if argv is None else argv)
    chosen = None
    if "--subject" in argv:
        i = argv.index("--subject")
        name = argv[i + 1] if i + 1 < len(argv) else ""
        if name not in SUBJECTS:
            sys.exit(f"--subject 只能是 {' / '.join(SUBJECTS)}，现在是 {name!r}")
        chosen = SUBJECTS[name]
        del argv[i:i + 2]
    for a in argv[1:]:
        if chosen:
            break
        chosen = from_path(a) if not a.startswith("-") else None
        chosen = chosen or (from_id(a) if not a.startswith("-") else None)
    return (chosen or SUBJECTS[DEFAULT]), argv


# ---------------------------------------------------------------------------
# 真题文件
# ---------------------------------------------------------------------------

def exam_docx(cfg, code):
    """代号（GZ2024）→ 解析版 Word 路径列表。"""
    import glob
    region, year = code[:2], code[2:]
    folder = cfg.exam_special.get(code, cfg.exam_root / year)
    return [f for f in glob.glob(_glob.escape(str(folder)) + "/*解析版*.docx") if f"{year}年" in f and cfg.exam_region[region] in f]
