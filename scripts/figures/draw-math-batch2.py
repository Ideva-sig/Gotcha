#!/usr/bin/env python3
"""数学第二批：只生成17.1b、23.2a、24.3a的三张静态步骤图。

用法：python3 scripts/figures/draw-math-batch2.py output/preview/fig-review/math-batch2
所有数据来自对应lesson.md；不生成练习答案图、不改已有图。
"""
from pathlib import Path
from html import escape
import glob
import math
import re
import subprocess
import sys
import tempfile

from svgkit import *

ROOT = Path(__file__).resolve().parents[2]


def label(g, x, y, parts, size=18, anchor="start"):
    """沿用draw-math-26的混排：数学变量斜体，中文及数字正体。"""
    spans = []
    for text, color in parts:
        for token in re.findall(r"[A-Za-z]+|[^A-Za-z]+", text):
            italic = token.isascii() and token.isalpha()
            family = "Times New Roman,serif" if italic else "-apple-system,PingFang SC,sans-serif"
            spans.append(
                f'<tspan fill="{color}" font-family="{family}" '
                f'font-style="{"italic" if italic else "normal"}">{escape(token)}</tspan>'
            )
    g.raw(f'<text class="{g.p}-math" x="{f(x)}" y="{f(y)}" text-anchor="{anchor}" '
          f'style="font-size:{size}px;font-weight:500;stroke:none">{"".join(spans)}</text>')


def quartile(g, x, y, sub, color, size=21):
    g.raw(f'<text class="{g.p}-math" x="{f(x)}" y="{f(y)}" text-anchor="middle" '
          f'style="fill:{color};font:italic {size}px Times New Roman,serif;stroke:none">'
          f'Q<tspan font-size="{size * .72:g}" baseline-shift="sub" font-style="normal">'
          f'{sub}</tspan></text>')


def step(g, number):
    g.raw(f'<g data-step="{number}">')


def end_step(g):
    g.raw('</g>')


def factor_common():
    g = Fig(720, 405, "factor-common-17-1b", "提公因式：末项的商是1",
            "第一步标出3x²、−4xy²、x共有的因式x，黄色只标各项中的x。"
            "第二步逐项除以x，细箭头对应绿色的商3x、−4y²、1；圈出末项的商1。"
            "第三步将三个商按原顺序放进括号，得到x(3x−4y²+1)。没有使用练习数据。")
    columns = (175, 350, 525)
    step(g, 1)
    g.text(26, 30, "找共同因式", size=16)
    label(g, 525, 30, [("公因式 ", INK), ("x", YELLOW)], 19)
    label(g, columns[0], 89, [("3", INK), ("x", YELLOW), ("²", INK)], 27, "middle")
    label(g, columns[1], 89, [("−4", INK), ("x", YELLOW), ("y²", INK)], 27, "middle")
    label(g, columns[2], 89, [("+", INK), ("x", YELLOW)], 27, "middle")
    end_step(g)

    step(g, 2)
    g.text(26, 149, "逐项除", size=16)
    for x in columns:
        g.arrow(x, 115, x, 190, c=GREEN, w=1.5, size=8)
        label(g, x + 19, 158, [("÷ ", INK), ("x", YELLOW)], 19)
    label(g, columns[0], 227, [("3x", GREEN)], 27, "middle")
    label(g, columns[1], 227, [("−4y²", GREEN)], 27, "middle")
    g.circle(columns[2], 218, 25, GREEN, 1.6)
    label(g, columns[2], 227, [("1", GREEN)], 27, "middle")
    g.text(570, 216, "剩下 1", GREEN, size=17)
    g.text(570, 243, "不是 0", SOFT, size=16)
    end_step(g)

    step(g, 3)
    g.text(26, 298, "写成乘积", size=16)
    for x in columns:
        g.arrow(x, 260, x, 316, c=GREEN, w=1.3, size=7)
    label(g, 103, 357, [("x", YELLOW)], 29)
    label(g, 134, 357, [("(", INK)], 31, "middle")
    label(g, columns[0], 357, [("3x", GREEN)], 27, "middle")
    label(g, columns[1], 357, [("−4y²", GREEN)], 27, "middle")
    label(g, columns[2], 357, [("+1", GREEN)], 27, "middle")
    label(g, 560, 357, [(")", INK)], 31, "middle")
    end_step(g)
    return g


class Plane:
    """单一等比例坐标系：横纵方向均为每单位72px。"""
    def __init__(self, g):
        self.g, self.scale = g, 72
        self.xmin, self.xmax, self.ymin, self.ymax = -3, 4, -3, 3
        self.ox, self.oy = 296, 334

    def point(self, x, y):
        return self.ox + self.scale * x, self.oy - self.scale * y

    def axes(self):
        g = self.g
        g.arrow(80, self.oy, 609, self.oy, GRAY, 1.3, size=7)
        g.arrow(self.ox, 550, self.ox, 105, GRAY, 1.3, size=7)
        label(g, 624, self.oy + 6, [("x", INK)], 20)
        label(g, self.ox - 12, 94, [("y", INK)], 20)
        label(g, self.ox - 14, self.oy + 25, [("O", INK)], 18, "end")
        for x in range(self.xmin, self.xmax + 1):
            if x == 0:
                continue
            px, py = self.point(x, 0)
            g.line(px, py - 4, px, py + 4, GRAY, 1)
            label(g, px, py + 24, [(str(x).replace("-", "−"), SOFT)], 15, "middle")
        for y in range(self.ymin, self.ymax + 1):
            if y == 0:
                continue
            px, py = self.point(0, y)
            g.line(px - 4, py, px + 4, py, GRAY, 1)
            # 数字放轴右侧；y=1处避开下降直线及其轴上标点。
            label(g, px + 14, py - 12 if y == 1 else py + 5,
                  [(str(y).replace("-", "−"), SOFT)], 15)

    def line(self, k, b, color):
        # 从解析式计算与视窗边界的交点，随后逐点采样；不新增轴交点标记。
        ends = sorted(((self.ymin - b) / k, (self.ymax - b) / k))
        lo, hi = max(self.xmin, ends[0]), min(self.xmax, ends[1])
        assert lo < hi
        points = [self.point(lo + (hi - lo) * i / 120, k * (lo + (hi - lo) * i / 120) + b)
                  for i in range(121)]
        assert all(80 - 1e-8 <= x <= 584 + 1e-8 and 118 - 1e-8 <= y <= 550 + 1e-8
                   for x, y in points)
        self.g.poly(points, c=color, w=2.4)

    def dot(self, x, y, k, b, color):
        assert math.isclose(y, k * x + b)
        self.g.dot(*self.point(x, y), r=4, c=color)


def line_kb():
    g = Fig(720, 610, "line-kb-23-2a", "两点确定一次函数的直线图象",
            "同一个等比例坐标系，横坐标从−3到4，纵坐标从−3到3。"
            "第一步蓝色直线y=2x−1，标出(0,−1)、(1,1)，k大于0，从左向右上升。"
            "第二步绿色直线y=−0.5x+1，标出(0,1)、(1,0.5)，k小于0，从左向右下降。"
            "坐标标签与对应直线同色；只标讲义示范的四点，不标横轴交点。")
    plane = Plane(g)
    plane.axes()
    step(g, 1)
    label(g, 26, 38, [("y=2x−1", BLUE)], 23)
    label(g, 26, 71, [("k>0，上升", BLUE)], 18)
    plane.line(2, -1, BLUE)
    plane.dot(0, -1, 2, -1, BLUE)
    plane.dot(1, 1, 2, -1, BLUE)
    label(g, 256, 452, [("(0, −1)", BLUE)], 18, "end")
    label(g, 388, 260, [("(1, 1)", BLUE)], 18)
    end_step(g)
    step(g, 2)
    label(g, 426, 38, [("y=−0.5x+1", GREEN)], 23)
    label(g, 426, 71, [("k<0，下降", GREEN)], 18)
    plane.line(-.5, 1, GREEN)
    plane.dot(0, 1, -.5, 1, GREEN)
    plane.dot(1, .5, -.5, 1, GREEN)
    label(g, 317, 228, [("(0, 1)", GREEN)], 18)
    label(g, 406, 299, [("(1, 0.5)", GREEN)], 18)
    end_step(g)
    return g


def boxplot_structure():
    g = Fig(720, 390, "boxplot-structure-24-3a", "五数与箱线图结构对应",
            "第一步用一条无数字刻度的水平数轴标出最小值、Q1、Q2中位数、Q3、最大值。"
            "第二步浅蓝箱体从Q1到Q3，箱内绿色竖线标出Q2。"
            "第三步灰色须线分别连接最小值与Q1、Q3与最大值。"
            "五个位置仅表示先后顺序，间距不等，不表示任何具体数据。")
    # 只是有序符号的位置，不是给学生自编的数值或某组数据的四分位数。
    minimum, q1, q2, q3, maximum = 100, 210, 390, 510, 620
    assert minimum < q1 < q2 < q3 < maximum
    g.arrow(66, 268, 663, 268, GRAY, 1.3, size=7)
    step(g, 1)
    g.text(26, 30, "五个位置", size=16)
    for x, color in [(minimum, GRAY), (q1, BLUE), (q2, GREEN), (q3, BLUE), (maximum, GRAY)]:
        g.line(x, 262, x, 274, color, 1.7)
        g.line(x, 218, x, 249, LIGHT, 1.1, dash="4 4")
    g.text(minimum, 308, "最小值", anchor="middle", size=17)
    quartile(g, q1, 306, 1, BLUE)
    quartile(g, q2, 306, 2, GREEN)
    g.text(q2, 338, "中位数", GREEN, anchor="middle", size=16)
    quartile(g, q3, 306, 3, BLUE)
    g.text(maximum, 308, "最大值", anchor="middle", size=17)
    end_step(g)
    step(g, 2)
    g.text(276, 84, "箱体与中位线", size=16)
    g.rect(q1, 132, q3 - q1, 74, c=BLUE, sw=2, fill=WATER)
    g.line(q2, 132, q2, 206, GREEN, 2.6)
    end_step(g)
    step(g, 3)
    g.text(26, 169, "须线", SOFT, size=16)
    g.line(minimum, 169, q1, 169, GRAY, 2)
    g.line(q3, 169, maximum, 169, GRAY, 2)
    g.line(minimum, 150, minimum, 188, GRAY, 2)
    g.line(maximum, 150, maximum, 188, GRAY, 2)
    g.text(26, 375, "位置示意，不表示具体数据", SOFT, size=15)
    end_step(g)
    return g


def render_png(svg_path, directory, w, h):
    """沿用draw-math-26的Chromium预览，并隔离临时HTML与浏览器配置。"""
    found = sorted(glob.glob(str(Path.home() /
                   "Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell")))
    if not found:
        raise RuntimeError("未找到Chromium，不能生成预览")
    directory.mkdir(parents=True, exist_ok=True)
    shot = directory / (svg_path.stem + ".png")
    with tempfile.TemporaryDirectory(prefix="render-", dir=directory) as temporary:
        work = Path(temporary)
        page = work / "figure.html"
        page.write_text('<!doctype html><html><head><meta charset="utf-8"></head>'
                        '<body style="margin:0;background:#fff">'
                        f'<div style="width:{w}px">{svg_path.read_text()}</div></body></html>')
        subprocess.run([found[-1], "--headless", "--no-sandbox", "--hide-scrollbars",
                        f"--user-data-dir={work / 'profile'}", f"--screenshot={shot}",
                        f"--window-size={w},{h}", "--force-device-scale-factor=2", page.as_uri()],
                       capture_output=True, check=True, timeout=120)
    if not shot.is_file() or shot.stat().st_size == 0:
        raise RuntimeError(f"预览未生成：{shot}")
    return shot


def main():
    preview_dir = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else None
    figures = [
        ("g8a-17-factorization", "factor-common-17-1b.svg", factor_common()),
        ("g8b-23-linear-functions", "line-kb-23-2a.svg", line_kb()),
        ("g8b-24-data-analysis", "boxplot-structure-24-3a.svg", boxplot_structure()),
    ]
    for chapter, filename, fig in figures:
        path = ROOT / "course/math" / chapter / "figures" / filename
        fig.save(str(path))
        print(path.relative_to(ROOT))
        if preview_dir:
            print(render_png(path, preview_dir, fig.w, fig.h))


if __name__ == "__main__":
    main()
