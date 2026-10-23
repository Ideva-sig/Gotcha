#!/usr/bin/env python3
"""数学第三批子批3b：生成13.2a、15.2a、28.1a、28.2c、30.3b的五张示意图。

用法：python3 scripts/figures/draw-math-batch3b.py output/preview/fig-review/math-batch3b
所有数据来自对应lesson.md；会泄题的图只存不插。
"""
from html import escape
from pathlib import Path
import glob
import math
import re
import subprocess
import sys
import tempfile

from svgkit import *

ROOT = Path(__file__).resolve().parents[2]


def label(g, x, y, parts, size=16, anchor="start"):
    """沿用批次规范的混排：数学变量斜体，中文、数字及单位正体。"""
    if isinstance(parts, str):
        parts = [(parts, INK)]
    spans = []
    for text, color in parts:
        for token in re.findall(r"[A-Za-z]+|[^A-Za-z]+", text):
            italic = (token.isascii() and token.isalpha() and
                      token not in ("m", "mm", "cm")) or token in ("θ", "α", "β")
            family = "Times New Roman,serif" if italic else "-apple-system,PingFang SC,sans-serif"
            spans.append(
                f'<tspan fill="{color}" font-family="{family}" '
                f'font-style="{"italic" if italic else "normal"}">{escape(token)}</tspan>'
            )
    g.raw(f'<text class="{g.p}-math" x="{f(x)}" y="{f(y)}" text-anchor="{anchor}" '
          f'style="font-size:{size}px;font-weight:500;stroke:none">{"".join(spans)}</text>')


def step(g, number):
    g.raw(f'<g data-step="{number}">')


def end_step(g):
    g.raw('</g>')


# ==============================================================================
# 图 1：triangle-inequality-13-2a.svg (13.2a 三角形三边关系)
# ==============================================================================
def triangle_inequality():
    g = Fig(720, 410, "triangle-inequality-13-2a",
            "三角形三边关系：两边之差与两边之和的极限位置",
            "固定两边长7与2，第一步展示反向重叠共线的内侧极限，间距为5，共线不能组成三角形；"
            "第二步展示短边转动围成三角形，第三边在5与9之间；"
            "第三步展示同向拉直共线的外侧极限，间距为9，同样不能组成三角形。"
            "极限态画成共线，不标为三角形。")

    label(g, 26, 30, [("已知两边长分别为 ", INK), ("7", BLUE), (" 和 ", INK), ("2", BLUE),
                      ("，第三边长为 ", INK), ("c", GREEN)], 17)

    # ---------- 第 1 步：内侧极限 ----------
    step(g, 1)
    g.text(26, 68, "1. 内侧极限", size=15)
    # 底线与长边 7
    g.line(100, 114, 296, 114, c=BLUE, w=2.8)
    label(g, 198, 104, [("7", BLUE)], 15, "middle")
    # 短边 2 折叠在上方，黄色
    g.line(240, 88, 296, 88, c=YELLOW, w=2.8)
    label(g, 268, 78, [("2", YELLOW)], 14, "middle")
    # 辅助垂虚线
    g.line(240, 88, 240, 114, c=LIGHT, w=1.2, dash="3 3")
    g.line(296, 88, 296, 114, c=LIGHT, w=1.2, dash="3 3")
    # 端点
    g.dot(100, 114, r=3.5, c=INK)
    g.dot(240, 88, r=3.5, c=INK)
    g.dot(296, 114, r=3.5, c=INK)
    label(g, 84, 118, [("A", INK)], 14, "end")
    label(g, 240, 74, [("C", YELLOW)], 13, "middle")
    label(g, 310, 118, [("B", INK)], 14, "start")
    # 距离标注
    g.line(100, 134, 240, 134, c=CORAL, w=1.4)
    g.line(100, 129, 100, 139, c=CORAL, w=1.4)
    g.line(240, 129, 240, 139, c=CORAL, w=1.4)
    label(g, 170, 150, [("端点间距：", INK), ("7 − 2 = 5", CORAL)], 13, "middle")
    # 说明文字
    g.text(385, 96, "两边重叠折叠，三点落在同一直线上", c=INK, size=14)
    label(g, 385, 122, [("共线不能围成三角形", CORAL), ("（需满足 ", SOFT), ("c > 5", GREEN), ("）", SOFT)], 14)
    end_step(g)

    # ---------- 第 2 步：三角形状态 ----------
    step(g, 2)
    g.text(26, 180, "2. 形成三角形", size=15)
    # A(100, 240), B(296, 240)
    g.line(100, 240, 296, 240, c=BLUE, w=2.4)
    label(g, 198, 258, [("7", BLUE)], 15, "middle")
    # C 绕 B 旋转 120°：Bx=296, By=240, Cx=296-28=268, Cy=240-48.5=191.5
    cx, cy = 268, 191.5
    g.line(296, 240, cx, cy, c=BLUE, w=2.4)
    label(g, 294, 210, [("2", BLUE)], 14, "start")
    # 第三边 AC
    g.line(100, 240, cx, cy, c=GREEN, w=2.4)
    # 文字放在 AC 上方开阔区域
    label(g, 175, 204, [("第三边 c", GREEN)], 15, "middle")
    # 旋转弧指示（半径56）
    g.arc(296, 240, 56, 180, 240, c=LIGHT, w=1.2)
    # 端点
    g.dot(100, 240, r=3.5, c=INK)
    g.dot(296, 240, r=3.5, c=INK)
    g.dot(cx, cy, r=3.5, c=INK)
    label(g, 84, 244, [("A", INK)], 14, "end")
    label(g, 310, 244, [("B", INK)], 14, "start")
    label(g, 268, 178, [("C", INK)], 14, "middle")
    # 说明文字
    g.text(385, 206, "短边绕端点旋转，三点脱离共线", c=INK, size=14)
    label(g, 385, 234, [("两边之差 < 第三边 < 两边之和：", INK), ("5 < c < 9", GREEN)], 15)
    end_step(g)

    # ---------- 第 3 步：外侧极限 ----------
    step(g, 3)
    g.text(26, 296, "3. 外侧极限", size=15)
    # A(100, 340), B(296, 340), C(352, 340)
    g.line(100, 340, 296, 340, c=BLUE, w=2.8)
    label(g, 198, 330, [("7", BLUE)], 15, "middle")
    g.line(296, 340, 352, 340, c=YELLOW, w=2.8)
    label(g, 324, 330, [("2", YELLOW)], 14, "middle")
    # 端点
    g.dot(100, 340, r=3.5, c=INK)
    g.dot(296, 340, r=3.5, c=INK)
    g.dot(352, 340, r=3.5, c=INK)
    label(g, 84, 344, [("A", INK)], 14, "end")
    label(g, 296, 358, [("B", INK)], 14, "middle")
    label(g, 352, 326, [("C", YELLOW)], 14, "middle")
    # 距离标注
    g.line(100, 368, 352, 368, c=CORAL, w=1.4)
    g.line(100, 363, 100, 373, c=CORAL, w=1.4)
    g.line(352, 363, 352, 373, c=CORAL, w=1.4)
    label(g, 226, 384, [("端点间距：", INK), ("7 + 2 = 9", CORAL)], 13, "middle")
    # 说明文字
    g.text(385, 318, "两边拉直成一条线段，三点再次共线", c=INK, size=14)
    label(g, 385, 344, [("共线不能围成三角形", CORAL), ("（需满足 ", SOFT), ("c < 9", GREEN), ("）", SOFT)], 14)
    label(g, 370, 378, [("结论：第三边取值范围为 ", INK), ("5 < c < 9", GREEN)], 15)
    label(g, 370, 398, [("（两端点均不取等号）", SOFT)], 13)
    end_step(g)

    return g


# ==============================================================================
# 图 2：axis-symmetry-15-2a.svg (15.2a 坐标轴对称与将军饮马)
# ==============================================================================
def axis_symmetry():
    g = Fig(720, 440, "axis-symmetry-15-2a",
            "平面直角坐标系中的轴对称与将军饮马最短路径",
            "左侧展示点P(-2,6)关于x轴对称到(-2,-6)、关于y轴对称到(2,6)，辅助垂线虚线，等距刻痕同色；"
            "右侧展示同侧两点A、B的最短路径，反射点B为B'，连结AB'交直线于C，折线AC+CB转化为直线段AB'最简路径。"
            "两点在同侧时使用对称点转化，不暗示路径最短对所有点无条件成立。")

    # 底图：左右分栏中隔线
    g.line(360, 20, 360, 420, c=LIGHT, w=1, dash="4 4")

    # ---------- 左栏：坐标对称 ----------
    ox, oy = 185, 215
    sx, sy = 28, 18
    # 坐标轴
    g.arrow(45, oy, 325, oy, c=GRAY, w=1.3, size=7)
    g.arrow(ox, 385, ox, 45, c=GRAY, w=1.3, size=7)
    label(g, 335, oy + 5, [("x", INK)], 18)
    label(g, ox - 10, 36, [("y", INK)], 18)
    label(g, ox - 12, oy + 20, [("O", INK)], 16, "end")
    # 刻度线与标签：避开 x=129 和 y=107 的垂虚线
    # x = -2 (x=129)
    g.line(ox - 2 * sx, oy - 3, ox - 2 * sx, oy + 3, c=GRAY, w=1)
    label(g, ox - 2 * sx - 6, oy + 18, [("−2", SOFT)], 14, "end")
    # x = 2 (x=241)
    g.line(ox + 2 * sx, oy - 3, ox + 2 * sx, oy + 3, c=GRAY, w=1)
    label(g, ox + 2 * sx, oy + 18, [("2", SOFT)], 14, "middle")
    # y = 6 (y=107)
    g.line(ox - 3, oy - 6 * sy, ox + 3, oy - 6 * sy, c=GRAY, w=1)
    label(g, ox - 8, oy - 6 * sy - 4, [("6", SOFT)], 14, "end")
    # y = -6 (y=323)
    g.line(ox - 3, oy + 6 * sy, ox + 3, oy + 6 * sy, c=GRAY, w=1)
    label(g, ox - 8, oy + 6 * sy + 14, [("−6", SOFT)], 14, "end")

    # 坐标点
    px_p, py_p = ox - 2 * sx, oy - 6 * sy        # P(-2, 6) = (129, 107)
    px_p1, py_p1 = ox - 2 * sx, oy + 6 * sy      # P1(-2, -6) = (129, 323)
    px_p2, py_p2 = ox + 2 * sx, oy - 6 * sy      # P2(2, 6) = (241, 107)

    g.dot(px_p, py_p, r=3.8, c=INK)
    label(g, px_p - 8, py_p - 8, [("P(−2, 6)", INK)], 15, "end")

    # Step 1: 关于 x 轴对称
    step(g, 1)
    g.line(px_p, py_p, px_p1, py_p1, c=BLUE, w=1.5, dash="4 4")
    g.right_angle(px_p, oy, (0, -1), (1, 0), s=8, c=BLUE, w=1.2)
    # 单刻痕（等距）
    g.line(px_p - 4, (py_p + oy) / 2, px_p + 4, (py_p + oy) / 2, c=BLUE, w=1.5)
    g.line(px_p - 4, (py_p1 + oy) / 2, px_p + 4, (py_p1 + oy) / 2, c=BLUE, w=1.5)
    g.dot(px_p1, py_p1, r=3.8, c=BLUE)
    label(g, px_p1 - 8, py_p1 + 16, [("P₁(−2, −6)", BLUE)], 15, "end")
    label(g, 26, 400, [("关于 x 轴对称：", BLUE), ("横不变，纵变相反数", INK)], 13)
    end_step(g)

    # Step 2: 关于 y 轴对称
    step(g, 2)
    g.line(px_p, py_p, px_p2, py_p2, c=GREEN, w=1.5, dash="4 4")
    g.right_angle(ox, py_p, (-1, 0), (0, 1), s=8, c=GREEN, w=1.2)
    # 双刻痕（等距）
    mx1 = (px_p + ox) / 2
    g.line(mx1 - 2, py_p - 4, mx1 - 2, py_p + 4, c=GREEN, w=1.3)
    g.line(mx1 + 2, py_p - 4, mx1 + 2, py_p + 4, c=GREEN, w=1.3)
    mx2 = (px_p2 + ox) / 2
    g.line(mx2 - 2, py_p - 4, mx2 - 2, py_p + 4, c=GREEN, w=1.3)
    g.line(mx2 + 2, py_p - 4, mx2 + 2, py_p + 4, c=GREEN, w=1.3)
    g.dot(px_p2, py_p2, r=3.8, c=GREEN)
    label(g, px_p2 + 8, py_p - 8, [("P₂(2, 6)", GREEN)], 15, "start")
    label(g, 26, 424, [("关于 y 轴对称：", GREEN), ("纵不变，横变相反数", INK)], 13)
    end_step(g)

    # ---------- 右栏：将军饮马 ----------
    step(g, 3)
    g.text(380, 36, "将军饮马：同侧两点最短路径", size=16)

    ly = 225  # 对称轴直线 l 的高度
    g.line(380, ly, 650, ly, c=GRAY, w=1.8)
    label(g, 658, ly + 5, [("直线 ", SOFT), ("l", SOFT)], 15)

    ax, ay = 420, 115
    bx, by = 620, 145
    # 对称点 B'
    bpx, bpy = bx, ly + (ly - by)  # (620, 305)

    # 垂线 BB'
    g.line(bx, by, bpx, bpy, c=BLUE, w=1.5, dash="4 4")
    g.right_angle(bx, ly, (-1, 0), (0, 1), s=8, c=BLUE, w=1.2)
    # 等距刻痕
    my1 = (by + ly) / 2
    g.line(bx - 4, my1, bx + 4, my1, c=BLUE, w=1.5)
    my2 = (ly + bpy) / 2
    g.line(bx - 4, my2, bx + 4, my2, c=BLUE, w=1.5)

    # 交点 C：连结 AB' 与直线 y=ly 的交点
    cx = ax + (bpx - ax) * (ly - ay) / (bpy - ay)  # 420 + 200 * 110 / 190 ≈ 535.8
    cy = ly

    # 路径线段
    g.line(ax, ay, cx, cy, c=GREEN, w=2.4)
    g.line(cx, cy, bx, by, c=GREEN, w=2.4)
    g.line(cx, cy, bpx, bpy, c=GREEN, w=1.5, dash="4 4")

    # 点与标注
    g.dot(ax, ay, r=3.8, c=INK)
    g.dot(bx, by, r=3.8, c=INK)
    g.dot(bpx, bpy, r=3.8, c=BLUE)
    g.dot(cx, cy, r=3.8, c=GREEN)

    label(g, ax - 8, ay - 6, [("A", INK)], 16, "end")
    label(g, bx + 8, by - 4, [("B", INK)], 16, "start")
    label(g, bpx + 8, bpy + 6, [("B′", BLUE)], 16, "start")
    label(g, cx - 6, cy + 22, [("C", GREEN)], 16, "end")

    # 说明文字
    label(g, 380, 342, [("1. 作点 ", INK), ("B", INK), (" 关于直线 ", INK), ("l", INK),
                        (" 的对称点 ", INK), ("B′", BLUE)], 14)
    label(g, 380, 366, [("2. 连结 ", INK), ("AB′", GREEN), (" 交直线于点 ", INK), ("C", GREEN),
                        ("，连结 ", INK), ("CB", GREEN)], 14)
    label(g, 380, 390, [("3. 由对称性 ", INK), ("CB = CB′", SOFT), ("，得 ", INK),
                        ("AC + CB = AB′", GREEN)], 14)
    label(g, 380, 416, [("两点之间线段最短：交点 C 处路径和最短", SOFT)], 13)
    end_step(g)

    return g


# ==============================================================================
# 图 3：rotation-elements-28-1a.svg (28.1a 认清旋转中心、方向和角)
# ==============================================================================
def rotation_elements():
    g = Fig(720, 420, "rotation-elements-28-1a",
            "旋转的三要素：旋转中心、方向与旋转角",
            "左侧取坐标系原点O(0,0)为旋转中心，P(3,0)绕O逆时针旋转角θ=60°得到对应点P'，"
            "保留线段OP与OP'，角弧外标逆时针箭头；"
            "右侧列出旋转中心、旋转方向、旋转角三要素，及OP=OP'、∠POP'=θ对应性质。"
            "图与旁式的θ均用蓝色，点O用线框色。")

    ox, oy = 160, 275
    scale = 50  # 50px 每单位

    # ---------- 坐标系底图 ----------
    g.arrow(45, oy, 370, oy, c=GRAY, w=1.3, size=7)
    g.arrow(ox, 375, ox, 45, c=GRAY, w=1.3, size=7)
    label(g, 382, oy + 5, [("x", INK)], 18)
    label(g, ox - 10, 36, [("y", INK)], 18)
    label(g, ox - 14, oy + 20, [("O", GRAY)], 17, "end")

    # P(3, 0)
    px, py = ox + 3 * scale, oy  # (310, 275)

    # P' 由同一中心、同一转角精确计算：θ=60°逆时针
    theta_deg = 60
    theta_rad = math.radians(theta_deg)
    ppx = ox + 3 * scale * math.cos(theta_rad)   # 160 + 75 = 235
    ppy = oy - 3 * scale * math.sin(theta_rad)   # 275 - 129.9 = 145.1

    # 旋转辅助虚线圆弧（半径 150）
    g.arc(ox, oy, 150, 300, 360, c=LIGHT, w=1.4)

    # 旋转线段 OP 与 OP'
    g.line(ox, oy, px, py, c=BLUE, w=2.4)
    g.line(ox, oy, ppx, ppy, c=BLUE, w=2.4)

    # 等长标记（双刻痕）
    m1x, m1y = (ox + px) / 2, oy
    g.line(m1x - 2, m1y - 4, m1x - 2, m1y + 4, c=BLUE, w=1.4)
    g.line(m1x + 2, m1y - 4, m1x + 2, m1y + 4, c=BLUE, w=1.4)

    m2x, m2y = (ox + ppx) / 2, (oy + ppy) / 2
    ux, uy = unit(ppx - ox, ppy - oy)
    vx, vy = -uy, ux
    g.line(m2x - 2 * ux - 4 * vx, m2y - 2 * uy - 4 * vy,
           m2x - 2 * ux + 4 * vx, m2y - 2 * uy + 4 * vy, c=BLUE, w=1.4)
    g.line(m2x + 2 * ux - 4 * vx, m2y + 2 * uy - 4 * vy,
           m2x + 2 * ux + 4 * vx, m2y + 2 * uy + 4 * vy, c=BLUE, w=1.4)

    # 旋转角弧与箭头（半径 48，屏幕角度从 360°/0° 逆时针到 300°）
    g.arc(ox, oy, 48, 300, 360, c=BLUE, w=1.8)
    label(g, ox + 60, oy - 24, [("θ", BLUE)], 18, "start")

    # 弧外旋转指示箭头（半径 60，在 315° 处）
    ax_rad = math.radians(315)
    tx, ty = ox + 60 * math.cos(ax_rad), oy + 60 * math.sin(ax_rad)
    g.head(tx, ty, math.sin(ax_rad), -math.cos(ax_rad), BLUE, size=8)

    # 点与坐标标注（P(3,0) 放在正下方，与 x 轴箭头完全错开）
    g.dot(ox, oy, r=4.0, c=GRAY)
    g.dot(px, py, r=3.8, c=INK)
    g.dot(ppx, ppy, r=3.8, c=INK)

    label(g, px, py + 22, [("P(3, 0)", INK)], 15, "middle")
    label(g, ppx + 8, ppy - 6, [("P′", INK)], 16, "start")

    # ---------- 右栏：旋转三要素与性质 ----------
    g.rect(400, 42, 295, 348, c=LIGHT, sw=1.2, fill="#fdfefe", rx=8)
    g.text(420, 76, "旋转的三要素", size=18, weight=700)
    g.line(420, 92, 675, 92, c=LIGHT, w=1)

    g.text(420, 126, "① 旋转中心：", size=15)
    label(g, 530, 126, [("定点 ", INK), ("O(0, 0)", GRAY)], 15)

    g.text(420, 168, "② 旋转方向：", size=15)
    g.text(530, 168, "逆时针方向", c=INK, size=15)

    g.text(420, 210, "③ 旋转角：", size=15)
    label(g, 530, 210, [("转角 ", INK), ("θ", BLUE), ("（∠POP′ = ", INK), ("θ", BLUE), ("）", INK)], 15)

    g.line(420, 236, 675, 236, c=LIGHT, w=1)
    g.text(420, 266, "对应性质：", size=15, weight=600)
    label(g, 420, 298, [("• 对应点到中心距离相等：", INK), ("OP = OP′", BLUE)], 14)
    label(g, 420, 328, [("• 连线所成的角等于旋转角：", INK), ("∠POP′ = ", INK), ("θ", BLUE)], 14)
    label(g, 420, 358, [("• 点 ", INK), ("P", INK), (" 与点 ", INK), ("P′", INK),
                        (" 互为对应点", INK)], 14)

    return g


# ==============================================================================
# 图 4：origin-symmetry-28-2c.svg (28.2c 求关于原点对称的坐标)
# ==============================================================================
def origin_symmetry():
    g = Fig(720, 440, "origin-symmetry-28-2c",
            "关于原点对称的点的坐标规律",
            "第一步描出点A(3,1)及到两轴的投影；"
            "第二步连结AA'并反向等长延长到A'(-3,-1)，经过原点O且OA=OA'；"
            "第三步作A'到两轴投影，横坐标3到-3标蓝色短箭头，纵坐标1到-1标绿色短箭头，归纳出(x,y)到(-x,-y)的规律。"
            "数轴负号逐个核对，不用本图颜色表示正确或错误。")

    ox, oy = 245, 220
    scale = 46  # 46px 每单位

    # 坐标轴完整
    g.arrow(45, oy, 445, oy, c=GRAY, w=1.3, size=7)
    g.arrow(ox, 395, ox, 45, c=GRAY, w=1.3, size=7)
    label(g, 455, oy + 5, [("x", INK)], 18)
    label(g, ox - 10, 36, [("y", INK)], 18)
    label(g, ox - 14, oy + 20, [("O", INK)], 16, "end")

    # 点 A(3, 1) 与 A'(-3, -1)
    ax, ay = ox + 3 * scale, oy - 1 * scale       # (383, 174)
    apx, apy = ox - 3 * scale, oy + 1 * scale     # (107, 266)

    # x 轴刻度：负半轴放轴上方（避开第三象限连线），正半轴放轴下方（避开第一象限连线）
    for vx in [-3, -2, -1, 1, 2, 3]:
        px = ox + vx * scale
        g.line(px, oy - 3, px, oy + 3, c=GRAY, w=1)
        txt = str(vx).replace("-", "−")
        if vx < 0:
            label(g, px, oy - 8, [(txt, SOFT)], 14, "middle")
        else:
            label(g, px, oy + 18, [(txt, SOFT)], 14, "middle")

    # y 轴刻度
    for vy in [-2, -1, 1, 2]:
        py = oy - vy * scale
        g.line(ox - 3, py, ox + 3, py, c=GRAY, w=1)
        txt = str(vy).replace("-", "−")
        if vy == 1:
            # 虚线在右侧(x: 245->383)，数字放轴左侧
            label(g, ox - 8, py + 5, [(txt, SOFT)], 14, "end")
        elif vy == -1:
            # 虚线在左侧(x: 107->245)，数字放轴右侧
            label(g, ox + 8, py + 5, [(txt, SOFT)], 14, "start")
        else:
            label(g, ox - 8, py + 5, [(txt, SOFT)], 14, "end")

    # ---------- 第 1 步：描点 A(3, 1) 及投影 ----------
    step(g, 1)
    # A 到横轴投影（蓝色）
    g.line(ax, ay, ax, oy, c=BLUE, w=1.4, dash="3 3")
    g.right_angle(ax, oy, (0, -1), (-1, 0), s=7, c=BLUE, w=1.1)
    # A 到纵轴投影（绿色）
    g.line(ax, ay, ox, ay, c=GREEN, w=1.4, dash="3 3")
    g.right_angle(ox, ay, (1, 0), (0, 1), s=7, c=GREEN, w=1.1)

    g.dot(ax, ay, r=3.8, c=INK)
    label(g, ax + 8, ay - 6, [("A(3, 1)", INK)], 15, "start")

    g.text(485, 68, "1. 描点与投影", size=16)
    label(g, 485, 98, [("• 点 ", INK), ("A(3, 1)", INK)], 14)
    label(g, 485, 122, [("• 横向投影 ", INK), ("x = 3", BLUE)], 14)
    label(g, 485, 146, [("• 纵向投影 ", INK), ("y = 1", GREEN)], 14)
    end_step(g)

    # ---------- 第 2 步：连线 AA' 经过原点 ----------
    step(g, 2)
    # 实线连结 AA'
    g.line(ax, ay, apx, apy, c=INK, w=1.8)
    # 原点等距刻痕
    m1x, m1y = (ox + ax) / 2, (oy + ay) / 2
    g.line(m1x - 3, m1y - 3, m1x + 3, m1y + 3, c=GRAY, w=1.4)
    m2x, m2y = (ox + apx) / 2, (oy + apy) / 2
    g.line(m2x - 3, m2y - 3, m2x + 3, m2y + 3, c=GRAY, w=1.4)

    g.dot(apx, apy, r=3.8, c=INK)
    label(g, apx - 8, apy + 18, [("A′(−3, −1)", INK)], 15, "end")

    g.text(485, 186, "2. 绕原点旋转 180°", size=16)
    label(g, 485, 214, [("• 连结 ", INK), ("AA′", INK), (" 经过原点 ", INK), ("O", INK)], 14)
    label(g, 485, 238, [("• 原点是 ", INK), ("AA′", INK), (" 的中点（", INK), ("OA = OA′", SOFT), ("）", INK)], 14)
    end_step(g)

    # ---------- 第 3 步：A' 投影与坐标变化短箭头 ----------
    step(g, 3)
    # A' 到横轴投影（蓝色）
    g.line(apx, apy, apx, oy, c=BLUE, w=1.4, dash="3 3")
    g.right_angle(apx, oy, (0, 1), (1, 0), s=7, c=BLUE, w=1.1)
    # A' 到纵轴投影（绿色）
    g.line(apx, apy, ox, apy, c=GREEN, w=1.4, dash="3 3")
    g.right_angle(ox, apy, (-1, 0), (0, -1), s=7, c=GREEN, w=1.1)

    # 横坐标短箭头 3 -> -3：放在第二象限开阔处 (y=80)
    g.arrow(180, 80, 110, 80, c=BLUE, w=1.6, size=7)
    label(g, 145, 68, [("横坐标：", INK), ("3 → −3", BLUE)], 13, "middle")

    # 纵坐标短箭头 1 -> -1：放在第四象限开阔处 (x=330)
    g.arrow(330, 290, 330, 350, c=GREEN, w=1.6, size=7)
    label(g, 342, 324, [("纵坐标：", INK), ("1 → −1", GREEN)], 13, "start")

    g.text(485, 278, "3. 坐标规律", size=16)
    label(g, 485, 306, [("• 横坐标：", INK), ("3 → −3", BLUE), ("（互为相反数）", SOFT)], 14)
    label(g, 485, 330, [("• 纵坐标：", INK), ("1 → −1", GREEN), ("（互为相反数）", SOFT)], 14)

    g.rect(485, 356, 215, 48, c=BLUE, sw=1.5, fill=WATER, rx=6)
    label(g, 592, 386, [("(x, y) → (−x, −y)", INK)], 17, "middle")
    end_step(g)

    return g


# ==============================================================================
# 图 5：regular-polygon-rt-30-3b.svg (30.3b 正多边形中的直角三角形计算)
# ==============================================================================
def regular_polygon_rt():
    g = Fig(720, 420, "regular-polygon-rt-30-3b",
            "正六边形中的直角三角形计算：半径、边心距与半边",
            "左侧正六边形边长a=12，中心O，作边心距r垂直平分一边，连结半径R=12形成Rt△；"
            "右侧提取直角三角形，展示R²=r²+(a/2)²，代入R=12、半边6，求得边心距r=6√3，"
            "并标明两条平行对边的间距为2r。"
            "已知边实线，辅助半径和垂线虚线；R蓝#287fc4、r绿#197a60，式图同色。")

    ox, oy = 205, 210
    scale = 10.5
    R_px = 12 * scale           # 126
    r_px = 6 * math.sqrt(3) * scale  # ≈ 109.12
    half_a = 6 * scale          # 63

    # 六个顶点（顶边与底边水平）
    v_b = (ox + half_a, oy - r_px)      # (268, 100.9)
    v_a = (ox - half_a, oy - r_px)      # (142, 100.9)
    v_l = (ox - R_px, oy)               # (79, 210)
    v_lb = (ox - half_a, oy + r_px)     # (142, 319.1)
    v_rb = (ox + half_a, oy + r_px)     # (268, 319.1)
    v_r = (ox + R_px, oy)               # (331, 210)

    vertices = [v_b, v_a, v_l, v_lb, v_rb, v_r]

    # ---------- 第 1 步：正六边形与中心 ----------
    step(g, 1)
    g.poly(vertices, c=GRAY, w=2.4, close=True)
    g.dot(ox, oy, r=3.8, c=INK)
    label(g, ox - 12, oy + 18, [("O", INK)], 16, "end")

    label(g, v_a[0] - 12, v_a[1] - 8, [("A", INK)], 16, "end")
    label(g, v_b[0] + 12, v_b[1] - 8, [("B", INK)], 16, "start")

    # 顶边长 a=12
    label(g, ox, v_a[1] - 22, [("边长 a = 12", INK)], 14, "middle")
    end_step(g)

    # ---------- 第 2 步：半径与边心距，垂线平分该边 ----------
    step(g, 2)
    # 半径 R 连结 OB、OA（虚线）
    g.line(ox, oy, v_b[0], v_b[1], c=BLUE, w=2.2, dash="4 4")
    g.line(ox, oy, v_a[0], v_a[1], c=BLUE, w=1.4, dash="4 4")
    label(g, (ox + v_b[0]) / 2 + 16, (oy + v_b[1]) / 2 + 12, [("R", BLUE)], 16, "start")

    # 边心距 r 连结 OM（垂线）
    mx, my = ox, oy - r_px
    g.line(ox, oy, mx, my, c=GREEN, w=2.2, dash="4 4")
    g.right_angle(mx, my, (1, 0), (0, 1), s=8, c=GREEN, w=1.2)
    g.dot(mx, my, r=3.5, c=GREEN)
    label(g, mx + 8, (oy + my) / 2, [("r", GREEN)], 16, "start")
    label(g, mx, my - 6, [("M", GREEN)], 14, "middle")

    # 半边 6 标注
    label(g, (v_a[0] + mx) / 2, my + 16, [("6", INK)], 13, "middle")
    label(g, (mx + v_b[0]) / 2, my + 16, [("6", INK)], 13, "middle")

    # 对边间距指示（沿同一垂线向下延长到底边中点，标下半段 r 与总间距 2r）
    mbx, mby = ox, oy + r_px
    g.line(ox, oy, mbx, mby, c=GREEN, w=1.8, dash="4 4")
    g.right_angle(mbx, mby, (1, 0), (0, -1), s=8, c=GREEN, w=1.2)
    g.dot(mbx, mby, r=3.5, c=GREEN)
    label(g, ox + 8, (oy + mby) / 2, [("r", GREEN)], 16, "start")
    label(g, ox, mby + 18, [("对边间距 = 2r", GRAY)], 13, "middle")
    end_step(g)

    # ---------- 第 3 步：右栏提取直角三角形与勾股计算 ----------
    step(g, 3)
    g.text(420, 32, "直角三角形关系", size=16, weight=600)

    # 提取 Rt△OMB：M_rt 在 (465, 180)
    m_rt = (465, 180)
    b_rt = (465 + half_a * 1.15, 180)                # 水平边 a/2 (537.45, 180)
    o_rt = (465, 180 - r_px * 1.15)                  # 竖直边 r (465, 54.5)

    g.line(m_rt[0], m_rt[1], b_rt[0], b_rt[1], c=INK, w=2.2)
    g.line(m_rt[0], m_rt[1], o_rt[0], o_rt[1], c=GREEN, w=2.4)
    g.line(o_rt[0], o_rt[1], b_rt[0], b_rt[1], c=BLUE, w=2.4)
    g.right_angle(m_rt[0], m_rt[1], (1, 0), (0, -1), s=8, c=GRAY, w=1.2)

    g.dot(m_rt[0], m_rt[1], r=3.5, c=INK)
    g.dot(b_rt[0], b_rt[1], r=3.5, c=INK)
    g.dot(o_rt[0], o_rt[1], r=3.5, c=INK)

    label(g, m_rt[0] - 12, m_rt[1] + 16, [("M", INK)], 15, "end")
    label(g, b_rt[0] + 10, b_rt[1] + 16, [("B", INK)], 15, "start")
    label(g, o_rt[0] - 12, o_rt[1] - 4, [("O", INK)], 15, "end")

    label(g, (m_rt[0] + b_rt[0]) / 2, m_rt[1] + 20, [("a/2 = 6", INK)], 14, "middle")
    label(g, m_rt[0] - 14, (m_rt[1] + o_rt[1]) / 2, [("r", GREEN)], 16, "end")
    label(g, (o_rt[0] + b_rt[0]) / 2 + 14, (o_rt[1] + b_rt[1]) / 2 - 6,
          [("R = 12", BLUE)], 15, "start")

    # 勾股公式
    label(g, 420, 230, [("核心关系（勾股定理）：", INK)], 15)
    g.rect(420, 244, 280, 44, c=LIGHT, sw=1.2, fill=WATER, rx=6)
    label(g, 560, 272, [("R", BLUE), ("² = ", INK), ("r", GREEN),
                        ("² + (a/2)²", INK)], 18, "middle")

    label(g, 420, 316, [("• 代入半径与半边长：", INK)], 14)
    label(g, 436, 342, [("r", GREEN), ("² = ", INK), ("12", BLUE),
                        ("² − 6² = 144 − 36 = 108", INK)], 15)
    label(g, 436, 370, [("r", GREEN), (" = √108 = ", INK), ("6√3", GREEN)], 15)
    label(g, 420, 404, [("• 两条平行对边的间距为 ", INK), ("2r", GREEN)], 14)
    end_step(g)

    return g


# ==============================================================================
# 预览渲染与主入口
# ==============================================================================
def render_png(svg_path, directory, w, h):
    """沿用Chromium headless预览，隔离临时目录。"""
    found = sorted(glob.glob(str(Path.home() /
                   "Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell")))
    if not found:
        raise RuntimeError("未找到 Chromium，不能生成预览")
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
        ("g8a-13-triangles", "triangle-inequality-13-2a.svg", triangle_inequality()),
        ("g8a-15-axis-symmetry", "axis-symmetry-15-2a.svg", axis_symmetry()),
        ("g9a-28-rotation", "rotation-elements-28-1a.svg", rotation_elements()),
        ("g9a-28-rotation", "origin-symmetry-28-2c.svg", origin_symmetry()),
        ("g9a-30-line-and-circle", "regular-polygon-rt-30-3b.svg", regular_polygon_rt()),
    ]
    for chapter, filename, fig in figures:
        path = ROOT / "course/math" / chapter / "figures" / filename
        fig.save(str(path))
        print(f"SAVED: {path.relative_to(ROOT)}")
        if preview_dir:
            shot = render_png(path, preview_dir, fig.w, fig.h)
            print(f"RENDERED: {shot.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
