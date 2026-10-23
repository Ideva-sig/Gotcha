#!/usr/bin/env python3
"""数学第三批子批 3a：生成 18、25、27 章共 12 张示意图。

包含：
- 18 章：18.1b、18.3a、18.5a
- 25 章：25.2b、25.2c、25.2e、25.3a、25.3b
- 27 章：27.1b、27.2b、27.2d、27.3b
"""
from pathlib import Path
from html import escape
import glob
import math
import os
import re
import subprocess
import sys
import tempfile

from svgkit import *

ROOT = Path(__file__).resolve().parents[2]


def label(g, x, y, parts, size=17, anchor="start", weight=500):
    """混排：数学变量斜体（Times New Roman），中文、符号、数字正体。"""
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
          f'style="font-size:{size}px;font-weight:{weight};stroke:none">{"".join(spans)}</text>')


def step(g, number):
    g.raw(f'<g data-step="{number}">')


def end_step(g):
    g.raw('</g>')


# ==============================================================================
# 第 25 章：一元二次方程（25.2b、25.2c、25.2e、25.3a、25.3b）
# ==============================================================================

def complete_square():
    """25.2b 配方法拼面积与代数两边同加。
    正方形x²、两块3x矩形、补3×3小正方形，对应等式两边同加9。
    """
    g = Fig(720, 430, "cs-252b", "配方法的几何拼面积与代数两边同加",
            "左侧展示课本x²+6x+4=0在x>0时的几何拼面积：蓝色x×x正方形与两块黄色3×x矩形拼成L形，"
            "补上绿色3×3小正方形后拼成边长x+3的大正方形，面积为(x+3)²。"
            "右侧展示对应的代数步骤：移项得x²+6x=−4，两边同加9配成(x+3)²=5，降次解得x=−3±√5。")

    # 分割线
    g.line(365, 30, 365, 400, LIGHT, 1, dash="4 4")

    # 左侧几何拼图
    step(g, 1)
    g.text(35, 35, "几何拼面积（x > 0 示意）", size=15, weight=700)
    # 大拼图基准点 (70, 75)
    # 主正方形 x^2: 120 x 120
    g.rect(70, 75, 120, 120, c=BLUE, sw=2, fill="#e0f2fe")
    label(g, 130, 142, [("x²", BLUE)], 22, "middle", weight=700)
    # 两块矩形 3x: 右侧 48 x 120，下方 120 x 48
    g.rect(190, 75, 48, 120, c=YELLOW, sw=2, fill="#fef9c3")
    label(g, 214, 142, [("3x", YELLOW)], 18, "middle", weight=700)
    g.rect(70, 195, 120, 48, c=YELLOW, sw=2, fill="#fef9c3")
    label(g, 130, 226, [("3x", YELLOW)], 18, "middle", weight=700)
    end_step(g)

    step(g, 2)
    # 边长标注在图形外侧
    label(g, 130, 62, [("x", BLUE)], 16, "middle")
    label(g, 214, 62, [("3", YELLOW)], 16, "middle")
    label(g, 52, 142, [("x", BLUE)], 16, "middle")
    label(g, 52, 226, [("3", YELLOW)], 16, "middle")
    # 缺角说明
    label(g, 195, 290, [("右下角补上 3×3 的小正方形", SOFT)], 14)
    end_step(g)

    step(g, 3)
    # 补上绿色小正方形 48 x 48
    g.rect(190, 195, 48, 48, c=GREEN, sw=2, fill="#dcfce7")
    label(g, 214, 226, [("9", GREEN)], 18, "middle", weight=700)
    # 面积等式
    label(g, 175, 335, [("x² + 6x + 9 = (x + 3)²", GREEN)], 18, "middle", weight=700)
    label(g, 175, 368, [("补齐为边长 (x+3) 的大正方形", SOFT)], 14, "middle")
    end_step(g)

    # 右侧代数推导
    step(g, 4)
    g.text(395, 35, "代数解方程（两边同加 9）", size=15, weight=700)
    label(g, 395, 75, [("原方程：", SOFT), ("x² + 6x + 4 = 0", INK)], 16)
    label(g, 395, 115, [("1. 移常数项：", SOFT)], 15)
    label(g, 420, 145, [("x² + 6x = −4", INK)], 17)

    label(g, 395, 185, [("2. 等式两边同时加上 9：", SOFT)], 15)
    label(g, 420, 218, [("x² + 6x + ", INK), ("9", BLUE), (" = −4 + ", INK), ("9", BLUE)], 18)
    label(g, 420, 245, [("一次项系数 6 的一半的平方是 3²=9", SOFT)], 13)

    label(g, 395, 280, [("3. 左边配方，右边合并：", SOFT)], 15)
    label(g, 420, 312, [("(", INK), ("x + 3", GREEN), (")² = 5", INK)], 18, weight=600)

    label(g, 395, 348, [("4. 直接开平方降次：", SOFT)], 15)
    g.rect(415, 362, 230, 45, c=GREEN, sw=1.8, fill="#f0fdf4", rx=6)
    label(g, 530, 391, [("x = −3 ± √5", GREEN)], 18, "middle", weight=700)
    end_step(g)

    return g


def discriminant_branch():
    """25.2c 判别式三种根情况分支图。
    起点ax²+bx+c=0，由(x+b/(2a))²=Δ/(4a²)及4a²>0分成Δ>0、=0、<0三列。
    """
    g = Fig(720, 420, "db-252c", "判别式与一元二次方程根的情况",
            "起点为一般形式ax²+bx+c=0(a≠0)，配方得到(x+b/(2a))²=Δ/(4a²)。"
            "因为4a²恒大于0，等号右边的正负完全由判别式Δ=b²−4ac决定。"
            "分为三列：Δ>0有两个不相等的实数根；Δ=0有两个相等的实数根；Δ<0无实数根。")

    # 顶部起点
    step(g, 1)
    g.rect(170, 15, 380, 68, c=GRAY, sw=1.5, fill="#f8fafc", rx=6)
    label(g, 360, 42, [("ax² + bx + c = 0  (a ≠ 0)", INK)], 18, "middle", weight=700)
    label(g, 360, 68, [("配方推导：", SOFT), ("(x + b/(2a))² = Δ / (4a²)", INK)], 15, "middle")

    label(g, 360, 108, [("其中判别式 ", SOFT), ("Δ = b² − 4ac", BLUE),
                       ("；因 4a² > 0，右侧符号由 Δ 决定", SOFT)], 15, "middle")

    # 三条分支箭头
    g.arrow(360, 120, 130, 155, c=GRAY, w=1.5, size=8)
    g.arrow(360, 120, 360, 155, c=GRAY, w=1.5, size=8)
    g.arrow(360, 120, 590, 155, c=GRAY, w=1.5, size=8)
    end_step(g)

    # 左列：Δ > 0
    step(g, 2)
    g.rect(30, 165, 200, 235, c=BLUE, sw=1.5, fill="#f0f9ff", rx=8)
    label(g, 130, 195, [("Δ > 0", BLUE)], 22, "middle", weight=700)
    label(g, 130, 225, [("右侧大于 0", SOFT)], 14, "middle")
    label(g, 130, 255, [("x + b/(2a) = ±√Δ / (2a)", INK)], 14, "middle")
    label(g, 130, 310, [("有两个不相等的", BLUE)], 16, "middle", weight=700)
    label(g, 130, 335, [("实数根", BLUE)], 16, "middle", weight=700)
    label(g, 130, 375, [("x = (−b ± √Δ)/(2a)", INK)], 14, "middle")
    end_step(g)

    # 中列：Δ = 0
    step(g, 3)
    g.rect(260, 165, 200, 235, c=GREEN, sw=1.5, fill="#f0fdf4", rx=8)
    label(g, 360, 195, [("Δ = 0", GREEN)], 22, "middle", weight=700)
    label(g, 360, 225, [("右侧等于 0", SOFT)], 14, "middle")
    label(g, 360, 255, [("x + b/(2a) = 0", INK)], 15, "middle")
    label(g, 360, 310, [("有两个相等的", GREEN)], 16, "middle", weight=700)
    label(g, 360, 335, [("实数根", GREEN)], 16, "middle", weight=700)
    label(g, 360, 375, [("x₁ = x₂ = −b/(2a)", INK)], 15, "middle")
    end_step(g)

    # 右列：Δ < 0
    step(g, 4)
    g.rect(490, 165, 200, 235, c=CORAL, sw=1.5, fill="#fef2f2", rx=8)
    label(g, 590, 195, [("Δ < 0", CORAL)], 22, "middle", weight=700)
    label(g, 590, 225, [("右侧小于 0", SOFT)], 14, "middle")
    label(g, 590, 255, [("负数没有实数平方根", SOFT)], 14, "middle")
    label(g, 590, 320, [("没有实数根", CORAL)], 18, "middle", weight=700)
    label(g, 590, 350, [("（无实根）", CORAL)], 15, "middle")
    label(g, 590, 380, [("在实数范围内无解", SOFT)], 13, "middle")
    end_step(g)

    return g


def factor_solve():
    """25.2e 因式分解法降次求根步骤图。
    x(x−2)+(x−2)=0 提公因式后分两支求解。
    """
    g = Fig(720, 390, "fs-252e", "因式分解法两式相乘为零的分支求解",
            "第一步展示方程x(x−2)+(x−2)=0，黄色标出两处公因式(x−2)。"
            "第二步提取公因式得到(x−2)(x+1)=0，说明两项相乘为零意味着至少有一个为零。"
            "第三步分两支独立求解：由x−2=0得x₁=2；由x+1=0得x₂=−1。")

    step(g, 1)
    g.text(40, 35, "1. 识别公因式", size=15, weight=700)
    # 黄色背景块标出 (x−2)
    g.rect(170, 52, 68, 32, c=YELLOW, sw=1.5, fill="#fef9c3", rx=4)
    g.rect(265, 52, 68, 32, c=YELLOW, sw=1.5, fill="#fef9c3", rx=4)
    label(g, 155, 74, [("x", INK)], 18)
    label(g, 176, 74, [("(x−2)", YELLOW)], 17, weight=700)
    label(g, 246, 74, [("+", INK)], 18)
    label(g, 271, 74, [("(x−2)", YELLOW)], 17, weight=700)
    label(g, 342, 74, [("= 0", INK)], 18)
    label(g, 395, 74, [("把后项看作整体 1·(x−2)", SOFT)], 14)
    end_step(g)

    step(g, 2)
    g.arrow(240, 95, 240, 130, c=GRAY, w=1.5, size=8)
    g.text(40, 145, "2. 提取公因式", size=15, weight=700)
    g.rect(160, 130, 185, 45, c=BLUE, sw=1.8, fill="#f0f9ff", rx=6)
    label(g, 252, 158, [("(", INK), ("x−2", YELLOW), (")(", INK), ("x+1", GREEN), (") = 0", INK)], 18, "middle", weight=700)
    label(g, 380, 158, [("A · B = 0  ⇒  至少有一个因式为 0（逻辑“或”）", SOFT)], 14)
    end_step(g)

    step(g, 3)
    g.text(40, 205, "3. 分成两个一次方程", size=15, weight=700)
    # 左右两支箭头（从中部分开，避免碰到左侧标题）
    g.arrow(220, 185, 160, 225, c=GRAY, w=1.5, size=7)
    g.arrow(285, 185, 345, 225, c=GRAY, w=1.5, size=7)

    # 左支
    g.rect(70, 235, 180, 125, c=GREEN, sw=1.5, fill="#f0fdf4", rx=8)
    label(g, 160, 265, [("第一支：", SOFT), ("x − 2 = 0", INK)], 16, "middle")
    label(g, 160, 310, [("解得：", SOFT)], 14, "middle")
    label(g, 160, 340, [("x₁ = 2", GREEN)], 22, "middle", weight=700)

    # 右支
    g.rect(290, 235, 180, 125, c=GREEN, sw=1.5, fill="#f0fdf4", rx=8)
    label(g, 380, 265, [("第二支：", SOFT), ("x + 1 = 0", INK)], 16, "middle")
    label(g, 380, 310, [("解得：", SOFT)], 14, "middle")
    label(g, 380, 340, [("x₂ = −1", GREEN)], 22, "middle", weight=700)

    # 右侧总结提示
    g.rect(495, 235, 190, 125, c=LIGHT, sw=1, fill="#f8fafc", rx=6)
    label(g, 510, 265, [("求解结论：", INK)], 15, weight=700)
    label(g, 510, 295, [("原方程有两个实数根：", SOFT)], 13)
    label(g, 510, 325, [("x₁ = 2，x₂ = −1", GREEN)], 15, weight=700)
    label(g, 510, 348, [("不能两边同时除以(x−2)", CORAL)], 12)
    end_step(g)

    return g


def photo_frame():
    """25.3a 相框面积示意与方程列式（会泄题，只存不插）。
    内矩形22×29，四周等宽x，外矩形(22+2x)(29+2x)，框边面积=照片面积的1/4。
    """
    g = Fig(720, 440, "pf-253a", "相框面积关系与一元二次方程列式",
            "左侧展示照片与等宽相框的几何关系：内矩形尺寸22×29cm，四周边框等宽x，"
            "外矩形总尺寸为(22+2x)×(29+2x)cm。浅黄色区域为相框边。"
            "右侧展示面积方程推导：内面积638，外面积(22+2x)(29+2x)，框边面积为外减内等于照片的1/4，"
            "解方程得有效正根x≈1.5cm。")

    # 分割线
    g.line(335, 30, 335, 410, LIGHT, 1, dash="4 4")

    step(g, 1)
    g.text(35, 35, "相框几何尺寸（等宽 x）", size=15, weight=700)
    # 外矩形在 (65, 80)，宽 170，高 210，浅黄
    g.rect(65, 80, 170, 210, c=GRAY, sw=1.5, fill="#fef9c3")
    # 内矩形（照片）在 (85, 100)，宽 130，高 170，白底蓝边
    g.rect(85, 100, 130, 170, c=BLUE, sw=2, fill="#ffffff")
    label(g, 150, 180, [("照片", BLUE)], 18, "middle", weight=700)
    label(g, 150, 205, [("22 × 29", BLUE)], 14, "middle")

    # 宽度标注 x
    label(g, 75, 95, [("x", CORAL)], 14, "middle")
    label(g, 225, 95, [("x", CORAL)], 14, "middle")
    label(g, 75, 280, [("x", CORAL)], 14, "middle")
    label(g, 225, 280, [("x", CORAL)], 14, "middle")

    # 尺寸标注（图外）
    label(g, 150, 65, [("内宽 22", BLUE)], 14, "middle")
    label(g, 38, 185, [("内长 29", BLUE)], 14, "middle")
    label(g, 150, 315, [("外宽 22 + 2x", INK)], 14, "middle")
    label(g, 285, 185, [("外长 29 + 2x", INK)], 14, "middle")
    end_step(g)

    step(g, 2)
    label(g, 50, 350, [("注：四周边框均等宽，故长、宽两侧各加一个 x", SOFT)], 13)
    label(g, 50, 375, [("外边长分别为 (22+2x) cm 与 (29+2x) cm", SOFT)], 13)
    end_step(g)

    # 右侧面积推导
    step(g, 3)
    g.text(360, 35, "面积方程推导（框边面积 = 照片的 1/4）", size=15, weight=700)

    label(g, 360, 75, [("1. 照片面积（内面积）：", SOFT)], 14)
    label(g, 385, 102, [("内面积 = 22 × 29 = 638 (cm²)", BLUE)], 16)

    label(g, 360, 140, [("2. 相框总面积（外面积）：", SOFT)], 14)
    label(g, 385, 168, [("外面积 = (22 + 2x)(29 + 2x) (cm²)", INK)], 16)

    label(g, 360, 205, [("3. 框边面积等量关系：", SOFT)], 14)
    label(g, 385, 235, [("框边面积 = 外面积 − 内面积 = ", INK), ("(1/4) · 内面积", CORAL)], 15)
    label(g, 385, 268, [("(22+2x)(29+2x) − 638 = 159.5", INK)], 16, weight=600)

    label(g, 360, 305, [("4. 整理方程并求根：", SOFT)], 14)
    label(g, 385, 332, [("8x² + 204x − 319 = 0", INK)], 16)

    g.rect(380, 352, 280, 50, c=GREEN, sw=1.8, fill="#f0fdf4", rx=6)
    label(g, 520, 375, [("x ≈ 1.5 cm  (负根舍去)", GREEN)], 16, "middle", weight=700)
    label(g, 520, 395, [("保留一位小数得到相框宽度 1.5 cm", SOFT)], 12, "middle")
    end_step(g)

    return g


def successive_change():
    """25.3b 连续变化方程模型与课本食品成本实例。
    三列为初始、第一年、第二年；增长行与下降行；下方课本成本10000→6000实例。
    """
    g = Fig(720, 440, "sc-253b", "两次连续变化的模型与解方程筛根",
            "上方展示两次连续变化的通用模型：增长行为A→A(1+x)→A(1+x)²；下降行为A→A(1−x)→A(1−x)²。"
            "第二次变化的基数是第一年的量，箭头从第一年的整份量出发。"
            "下方展示课本成本10000元两年降至6000元实例：方程为10000(1−x)²=6000，"
            "结合0≤x<1筛去大于1的无效根，解得年平均下降率约为22.5%。")

    # 列标头
    step(g, 1)
    g.text(40, 32, "通用模型：连续两次变化", size=15, weight=700)
    label(g, 130, 60, [("【初始量】", SOFT)], 15, "middle")
    label(g, 360, 60, [("【变化一次】", SOFT)], 15, "middle")
    label(g, 590, 60, [("【变化两次】", SOFT)], 15, "middle")

    # 增长行
    label(g, 40, 96, [("增长行：", INK)], 15, weight=600)
    label(g, 130, 96, [("A", INK)], 18, "middle")
    g.arrow(165, 92, 285, 92, c=BLUE, w=1.5, size=7)
    label(g, 225, 82, [("× (1+x)", BLUE)], 13, "middle")
    label(g, 360, 96, [("A(1+x)", BLUE)], 18, "middle")
    g.arrow(425, 92, 515, 92, c=BLUE, w=1.5, size=7)
    label(g, 470, 82, [("× (1+x)", BLUE)], 13, "middle")
    label(g, 590, 96, [("A(1+x)²", BLUE)], 18, "middle", weight=700)

    # 下降行
    label(g, 40, 142, [("下降行：", INK)], 15, weight=600)
    label(g, 130, 142, [("A", INK)], 18, "middle")
    g.arrow(165, 138, 285, 138, c=YELLOW, w=1.5, size=7)
    label(g, 225, 128, [("× (1−x)", YELLOW)], 13, "middle")
    label(g, 360, 142, [("A(1−x)", YELLOW)], 18, "middle")
    g.arrow(425, 138, 515, 138, c=YELLOW, w=1.5, size=7)
    label(g, 470, 128, [("× (1−x)", YELLOW)], 13, "middle")
    label(g, 590, 142, [("A(1−x)²", YELLOW)], 18, "middle", weight=700)

    label(g, 360, 178, [("注意：第二次变化是以第一年的整份量为基准，不能写成 A(1±2x)", SOFT)], 13, "middle")
    end_step(g)

    # 下方课本实例
    step(g, 2)
    g.line(35, 195, 685, 195, LIGHT, 1, dash="4 4")
    g.text(40, 222, "课本探究实例：生产成本两年由 10000 元降至 6000 元", size=15, weight=700)

    # 流程三阶段
    label(g, 110, 256, [("初始：", SOFT), ("10000", BLUE)], 16, "middle")
    g.arrow(170, 252, 250, 252, c=GRAY, w=1.5, size=7)
    label(g, 210, 242, [("× (1−x)", SOFT)], 12, "middle")

    label(g, 330, 256, [("一年后：10000(1−x)", INK)], 15, "middle")
    g.arrow(415, 252, 490, 252, c=GRAY, w=1.5, size=7)
    label(g, 452, 242, [("× (1−x)", SOFT)], 12, "middle")

    label(g, 580, 256, [("两年后：", SOFT), ("6000", BLUE)], 16, "middle")
    end_step(g)

    step(g, 3)
    # 列方程与解法
    label(g, 60, 296, [("列方程：", SOFT), ("10000(1 − x)² = 6000", INK)], 17, weight=600)
    label(g, 60, 328, [("整理得：(1 − x)² = 0.6  ⇒  1 − x = ±√0.6", INK)], 16)
    label(g, 60, 360, [("候选解：", SOFT), ("x = 1 − √0.6 ≈ 0.225", GREEN),
                      (" 或 ", SOFT), ("x = 1 + √0.6 ≈ 1.775", CORAL)], 15)

    # 实际筛根框
    g.rect(40, 380, 640, 46, c=GREEN, sw=1.5, fill="#f0fdf4", rx=6)
    label(g, 55, 408, [("实际筛根：", INK), ("年下降率必须满足 0 ≤ x < 1", CORAL),
                      ("；舍去 x > 1，年平均下降率约为 ", SOFT), ("22.5%", GREEN)], 15, weight=600)
    end_step(g)

    return g


def fraction_cancel():
    """18.1b 约分步骤图。
    从原分式 → 完全平方分解 → 标相同因式 → 约分，底部始终保留 3a+b≠0。
    """
    g = Fig(720, 390, "fc-181b", "分式的约分与取值限制保留",
            "第一步展示原分式，分子为二次三项式9a²+6ab+b²，分母为3a+b。"
            "第二步将分子按完全平方公式分解为(3a+b)(3a+b)。"
            "第三步用黄色标出分子与分母共有的公因式(3a+b)。"
            "第四步约去公因式得到最简结果3a+b；底部始终强调原分母非零条件3a+b≠0必须保留。")

    # 底部底图提示（在所有步骤之外）
    g.rect(38, 325, 644, 45, c=LIGHT, sw=1, fill="#f8fafc", rx=6)
    label(g, 55, 353, [("原分式有意义的前提条件：", SOFT), ("3a+b ≠ 0", CORAL),
                      ("；约分后结果变为整式，但该限制仍必须保留", SOFT)], 15)

    step(g, 1)
    g.text(40, 40, "1. 原分式", size=15, weight=700)
    label(g, 110, 115, [("9a² + 6ab + b²", INK)], 18, "middle")
    g.line(35, 132, 185, 132, INK, 1.8)
    label(g, 110, 165, [("3a + b", INK)], 18, "middle")
    label(g, 110, 220, [("分子为二次三项式", SOFT)], 14, "middle")
    end_step(g)

    step(g, 2)
    g.arrow(192, 132, 222, 132, c=GRAY, w=1.5, size=8)
    g.text(236, 40, "2. 分子因式分解", size=15, weight=700)
    label(g, 310, 115, [("(3a+b)(3a+b)", BLUE)], 17, "middle")
    g.line(235, 132, 385, 132, INK, 1.8)
    label(g, 310, 165, [("3a + b", BLUE)], 17, "middle")
    label(g, 310, 220, [("分子配成完全平方", BLUE)], 14, "middle")
    end_step(g)

    step(g, 3)
    g.arrow(395, 132, 425, 132, c=GRAY, w=1.5, size=8)
    g.text(436, 40, "3. 标出公因式", size=15, weight=700)
    # 黄色背景框标出 (3a+b)
    g.rect(480, 94, 85, 30, c=YELLOW, sw=1.5, fill="#fef9c3", rx=4)
    g.rect(450, 144, 85, 30, c=YELLOW, sw=1.5, fill="#fef9c3", rx=4)
    label(g, 452, 115, [("(3a+b)", INK)], 17, "middle")
    label(g, 522, 115, [("(3a+b)", YELLOW)], 17, "middle", weight=700)
    g.line(435, 132, 570, 132, INK, 1.8)
    label(g, 492, 165, [("(3a+b)", YELLOW)], 17, "middle", weight=700)
    label(g, 502, 220, [("公因式为 ", INK), ("(3a+b)", YELLOW)], 14, "middle")
    end_step(g)

    step(g, 4)
    g.arrow(580, 132, 605, 132, c=GRAY, w=1.5, size=8)
    g.text(615, 40, "4. 约分结果", size=15, weight=700)
    # 结果框
    g.rect(612, 108, 92, 50, c=GREEN, sw=2, fill="#f0fdf4", rx=6)
    label(g, 658, 140, [("3a + b", GREEN)], 20, "middle", weight=700)
    label(g, 658, 220, [("约去共同因式", GREEN)], 14, "middle")
    end_step(g)

    return g


def fraction_add_sub():
    """18.3a 异分母分式加减与通分步骤图。
    通分时把补乘的(x+8y)与分子1同色；减号及整个括号用珊瑚红，原式限制一直保留。
    """
    g = Fig(720, 420, "fas-183a", "异分母分式减法与通分括号警惕",
            "第一步观察两分母，将x²−64y²分解为(x−8y)(x+8y)，确定最简公分母。"
            "第二步通分，后一项分子分母同补乘(x+8y)，补乘项用蓝色。"
            "第三步合并分子，强调减号及整个括号−(x+8y)用珊瑚红，展开为2x−x−8y=x−8y。"
            "第四步约去公因式x−8y，化简为最简分式1/(x+8y)。底部注明x≠±8y限制全程保留。")

    # 底部底图提示
    g.rect(38, 360, 644, 42, c=LIGHT, sw=1, fill="#f8fafc", rx=6)
    label(g, 55, 386, [("限制条件：", SOFT), ("x ≠ 8y", CORAL), (" 且 ", SOFT),
                      ("x ≠ −8y", CORAL), ("（分母不能为 0，运算过程全程保留）", SOFT)], 15)

    step(g, 1)
    g.text(35, 36, "1. 确定公分母", size=15, weight=700)
    label(g, 35, 68, [("原式：", SOFT)], 15)
    # 原式
    label(g, 125, 90, [("2x", INK)], 17, "middle")
    g.line(75, 102, 175, 102, INK, 1.5)
    label(g, 125, 125, [("x² − 64y²", INK)], 15, "middle")

    label(g, 190, 104, [("−", INK)], 20, "middle")

    label(g, 235, 90, [("1", INK)], 17, "middle")
    g.line(205, 102, 265, 102, INK, 1.5)
    label(g, 235, 125, [("x − 8y", INK)], 15, "middle")

    label(g, 35, 168, [("最简公分母：", SOFT), ("(x−8y)(x+8y)", BLUE)], 14)
    end_step(g)

    step(g, 2)
    g.arrow(295, 102, 330, 102, c=GRAY, w=1.5, size=8)
    g.text(350, 36, "2. 通分（补乘因式）", size=15, weight=700)
    label(g, 350, 68, [("第二项同乘缺少的因式 ", SOFT), ("(x+8y)", BLUE)], 14)

    label(g, 425, 90, [("2x", INK)], 17, "middle")
    g.line(365, 102, 485, 102, INK, 1.5)
    label(g, 425, 125, [("(x−8y)(x+8y)", INK)], 14, "middle")

    label(g, 502, 104, [("−", INK)], 20, "middle")

    label(g, 595, 90, [("1 · ", INK), ("(x+8y)", BLUE)], 15, "middle")
    g.line(520, 102, 670, 102, INK, 1.5)
    label(g, 595, 125, [("(x−8y)", INK), ("(x+8y)", BLUE)], 14, "middle")
    end_step(g)

    step(g, 3)
    g.text(35, 215, "3. 分子相减（必须加括号）", size=15, weight=700)
    label(g, 175, 245, [("2x", INK), (" − (x + 8y)", CORAL)], 18, "middle")
    g.line(45, 258, 305, 258, INK, 1.8)
    label(g, 175, 282, [("(x − 8y)(x + 8y)", INK)], 15, "middle")
    label(g, 175, 316, [("分子去括号：2x − x − 8y = ", SOFT), ("x − 8y", GREEN)], 14, "middle")
    end_step(g)

    step(g, 4)
    g.arrow(320, 258, 360, 258, c=GRAY, w=1.5, size=8)
    g.text(380, 215, "4. 约分得最简分式", size=15, weight=700)
    label(g, 475, 245, [("x − 8y", GREEN)], 17, "middle")
    g.line(405, 258, 545, 258, INK, 1.8)
    label(g, 475, 282, [("(x − 8y)(x + 8y)", INK)], 15, "middle")

    label(g, 570, 258, [("=", INK)], 22, "middle")
    g.rect(595, 230, 85, 55, c=GREEN, sw=2, fill="#f0fdf4", rx=6)
    label(g, 637, 248, [("1", GREEN)], 17, "middle", weight=700)
    g.line(605, 256, 670, 256, GREEN, 1.8)
    label(g, 637, 276, [("x+8y", GREEN)], 15, "middle", weight=700)
    label(g, 475, 316, [("约去共同因式 (x − 8y)", GREEN)], 14, "middle")
    end_step(g)

    return g


def fraction_equation():
    """18.5a 解分式方程与验根步骤图。
    整式-1补乘公分母用珊瑚红；候选值x=1进入检验分支，最终“无解”完整显示。
    """
    g = Fig(720, 440, "fe-185a", "分式方程去分母漏乘与增根检验",
            "第一步展示原分式方程，公分母为(x−1)(x+2)，排除分母为0的限制x≠1和x≠−2。"
            "第二步两边同乘公分母，珊瑚红特别标注整式−1必须乘以公分母，不能漏乘。"
            "第三步解整式方程得到候选值x=1。"
            "第四步将候选值代入最简公分母检验，结果为0产生增根，最终确定原方程无解。")

    # Step 1: 原方程
    step(g, 1)
    g.text(35, 35, "1. 原分式方程", size=15, weight=700)
    label(g, 80, 68, [("x", INK)], 17, "middle")
    g.line(55, 78, 105, 78, INK, 1.5)
    label(g, 80, 98, [("x − 1", INK)], 15, "middle")

    label(g, 130, 78, [("− 1 =", INK)], 18, "middle")

    label(g, 225, 68, [("3", INK)], 17, "middle")
    g.line(165, 78, 285, 78, INK, 1.5)
    label(g, 225, 98, [("(x − 1)(x + 2)", INK)], 14, "middle")

    label(g, 35, 136, [("最简公分母：", SOFT), ("(x−1)(x+2)", BLUE),
                      ("；需排除 ", SOFT), ("x ≠ 1, −2", CORAL)], 14)
    end_step(g)

    # Step 2: 去分母
    step(g, 2)
    g.arrow(310, 78, 345, 78, c=GRAY, w=1.5, size=8)
    g.text(365, 35, "2. 去分母（两边同乘公分母）", size=15, weight=700)
    label(g, 365, 68, [("x(x+2)", INK), (" − 1·(x−1)(x+2)", CORAL), (" = 3", INK)], 17)
    # 警示说明框
    g.rect(365, 95, 320, 48, c=CORAL, sw=1.2, fill="#fef2f2", rx=5)
    label(g, 378, 116, [("易错警示：整式项 ", CORAL), ("−1", CORAL), (" 必须同样乘公分母！", CORAL)], 13)
    label(g, 378, 135, [("若漏乘，就彻底改变了方程，导致错解。", SOFT)], 13)
    end_step(g)

    # Step 3: 解整式方程
    step(g, 3)
    g.line(35, 165, 685, 165, LIGHT, 1, dash="4 4")
    g.text(35, 195, "3. 解整式方程求候选值", size=15, weight=700)
    label(g, 35, 226, [("提取公因式 (x+2)：", SOFT)], 14)
    label(g, 35, 256, [("[x − (x−1)](x+2) = 3", INK)], 16)
    label(g, 35, 288, [("1 · (x+2) = 3  ⇒  ", INK), ("x = 1", BLUE)], 17)
    g.rect(215, 268, 65, 30, c=BLUE, sw=1.5, fill=WATER, rx=4)
    label(g, 247, 289, [("候选值", BLUE)], 14, "middle")
    end_step(g)

    # Step 4: 检验分支
    step(g, 4)
    g.arrow(295, 280, 335, 280, c=GRAY, w=1.5, size=8)
    g.text(350, 195, "4. 代入最简公分母检验", size=15, weight=700)

    label(g, 350, 226, [("代入公分母 (x−1)(x+2)：", SOFT)], 14)
    label(g, 350, 256, [("当 x = 1 时，(", INK), ("1", BLUE), (" − 1)(", INK), ("1", BLUE), (" + 2) = ", INK), ("0 · 3 = 0", CORAL)], 16)

    # 判定分支
    g.arrow(420, 276, 420, 310, c=CORAL, w=1.5, size=7)
    label(g, 435, 298, [("分母为 0！x=1 是增根", CORAL)], 14)

    # 最终结论大框
    g.rect(350, 325, 335, 65, c=CORAL, sw=2, fill="#fef2f2", rx=8)
    label(g, 517, 353, [("x = 1 不是原方程的解", CORAL)], 15, "middle", weight=600)
    label(g, 517, 376, [("原分式方程无解", CORAL)], 18, "middle", weight=700)
    end_step(g)

    return g


# ==============================================================================
# 第 27 章：反比例函数（27.1b、27.2b、27.2d、27.3b）
# ==============================================================================

def inverse_find_k():
    """27.1b 待定系数法求反比例解析式与检验点。
    以(2,6)为已知点，三栏/四步推导，坐标系显示(2,6)与(4,3)及两支双曲线。
    """
    g = Fig(720, 460, "ifk-271b", "待定系数法求反比例解析式及检验点",
            "左侧直角坐标系展示反比例函数y=12/x的双曲线两支，标出已知点(2,6)与检验点(4,3)及其虚线投影。"
            "右侧展示四步推导：第一步由点(2,6)在曲线上；第二步代入算得k=2×6=12；"
            "第三步写出解析式y=12/x；第四步代入x=4算出y=3，验证两点乘积恒为12。")

    # 分割线
    g.line(355, 25, 355, 435, LIGHT, 1, dash="4 4")

    # 左侧坐标系
    # 原点在 (180, 230)，scale = 20
    ox, oy, s = 180, 230, 20
    # 轴
    g.arrow(45, oy, 335, oy, GRAY, 1.3, size=7)
    g.arrow(ox, 415, ox, 45, GRAY, 1.3, size=7)
    label(g, 342, oy + 5, [("x", INK)], 16)
    label(g, ox - 10, 38, [("y", INK)], 16)
    label(g, ox - 14, oy + 18, [("O", INK)], 15, "end")

    # 刻度线
    for v in (-4, -2, 2, 4, 6):
        px = ox + v * s
        g.line(px, oy - 3, px, oy + 3, GRAY, 1)
        label(g, px, oy + 16, [(str(v).replace("-", "−"), SOFT)], 12, "middle")
    for v in (-4, -2, 2, 4, 6):
        py = oy - v * s
        g.line(ox - 3, py, ox + 3, py, GRAY, 1)
        label(g, ox - 8, py + 4, [(str(v).replace("-", "−"), SOFT)], 12, "end")

    # 双曲线 y = 12/x (两支)
    # 第一象限支 x in [1.8, 6.5]
    pts1 = [(ox + x * s, oy - (12.0 / x) * s) for x in [1.8 + i * 0.1 for i in range(48)]]
    g.poly(pts1, c=GREEN, w=2.2)
    # 第三象限支 x in [-6.5, -1.8]
    pts2 = [(ox + x * s, oy - (12.0 / x) * s) for x in [-6.5 + i * 0.1 for i in range(48)]]
    g.poly(pts2, c=GREEN, w=2.2)

    # 点 (2,6)
    p1x, p1y = ox + 2 * s, oy - 6 * s
    g.line(p1x, oy, p1x, p1y, BLUE, 1.2, dash="3 3")
    g.line(ox, p1y, p1x, p1y, BLUE, 1.2, dash="3 3")
    g.dot(p1x, p1y, r=4.5, c=BLUE)
    label(g, p1x + 8, p1y - 6, [("(2, 6)", BLUE)], 15, weight=700)

    # 点 (4,3)
    p2x, p2y = ox + 4 * s, oy - 3 * s
    g.line(p2x, oy, p2x, p2y, BLUE, 1.2, dash="3 3")
    g.line(ox, p2y, p2x, p2y, BLUE, 1.2, dash="3 3")
    g.dot(p2x, p2y, r=4.5, c=BLUE)
    label(g, p2x + 8, p2y - 6, [("(4, 3)", BLUE)], 15, weight=700)

    # 右侧推导步骤
    step(g, 1)
    g.text(380, 35, "待定系数法四步推导", size=15, weight=700)
    label(g, 380, 70, [("1. 设解析式与已知点：", SOFT)], 14)
    label(g, 405, 98, [("设 ", INK), ("y = k / x", INK), ("，已知点 ", INK), ("(2, 6)", BLUE), (" 在图象上", INK)], 16)
    end_step(g)

    step(g, 2)
    label(g, 380, 138, [("2. 代入坐标求系数 k：", SOFT)], 14)
    label(g, 405, 168, [("代入得：", INK), ("6 = k / 2", BLUE)], 16)
    label(g, 405, 198, [("解得：", INK), ("k = 2 × 6 = 12", BLUE)], 17, weight=700)
    end_step(g)

    step(g, 3)
    label(g, 380, 240, [("3. 写回函数解析式：", SOFT)], 14)
    g.rect(400, 255, 180, 46, c=GREEN, sw=2, fill="#f0fdf4", rx=6)
    label(g, 490, 285, [("y = 12 / x", GREEN)], 20, "middle", weight=700)
    label(g, 405, 322, [("双曲线两支分别位于第一、三象限", SOFT)], 13)
    end_step(g)

    step(g, 4)
    label(g, 380, 355, [("4. 代入求值与检验点：", SOFT)], 14)
    label(g, 405, 385, [("当 x = 4 时，", INK), ("y = 12 / 4 = 3", INK)], 16)
    label(g, 405, 415, [("得到点 ", INK), ("(4, 3)", BLUE), ("；两点横纵坐标乘积均为 12", SOFT)], 14)
    end_step(g)

    return g


def compare_values():
    """27.2b 比较函数值与读范围（会泄题，只存不插）。
    三栏对应习题27.2第4题：求k、读y<4的范围、比较A,B,C三点纵坐标。
    """
    g = Fig(720, 450, "cv-272b", "反比例函数读值范围与函数值比较",
            "第一栏由点(−2,−4)求得k=8与解析式y=8/x。"
            "第二栏在y=8/x上画水平线y=4，展示y小于4对应的两段图段：x小于0与x大于2（端点均为空心）。"
            "第三栏比较三点A(−3,y₁)、B(−5,y₂)、C(4,y₃)的纵坐标，得出y₁小于y₂小于y₃。")

    # 三栏分割线
    g.line(240, 25, 240, 430, LIGHT, 1, dash="4 4")
    g.line(480, 25, 480, 430, LIGHT, 1, dash="4 4")

    # ---------------- 栏 1：求 k 与解析式 ----------------
    step(g, 1)
    g.text(25, 32, "1. 点 (−2,−4) 求 k", size=14, weight=700)
    # 栏1坐标系，原点在 (120, 140)，scale = 13
    o1x, o1y, s1 = 120, 140, 13
    g.arrow(40, o1y, 205, o1y, GRAY, 1.2, size=6)
    g.arrow(o1x, 225, o1x, 50, GRAY, 1.2, size=6)
    label(g, 210, o1y + 4, [("x", SOFT)], 13)
    label(g, o1x - 8, 45, [("y", SOFT)], 13)
    label(g, o1x - 10, o1y + 14, [("O", SOFT)], 12, "end")

    # 双曲线 y = 8/x
    pts1_pos = [(o1x + x * s1, o1y - (8.0 / x) * s1) for x in [1.5 + i * 0.15 for i in range(35)]]
    pts1_neg = [(o1x + x * s1, o1y - (8.0 / x) * s1) for x in [-6.5 + i * 0.15 for i in range(35)]]
    g.poly(pts1_pos, c=BLUE, w=1.8)
    g.poly(pts1_neg, c=BLUE, w=1.8)

    # 标点 (-2, -4)
    dot1x, dot1y = o1x - 2 * s1, o1y + 4 * s1
    g.line(dot1x, o1y, dot1x, dot1y, BLUE, 1, dash="2 2")
    g.line(o1x, dot1y, dot1x, dot1y, BLUE, 1, dash="2 2")
    g.dot(dot1x, dot1y, r=4, c=BLUE)
    label(g, dot1x - 6, dot1y + 16, [("(-2, -4)", BLUE)], 13, "end")

    label(g, 25, 270, [("点在双曲线上：", SOFT)], 13)
    label(g, 25, 298, [("k = (−2) × (−4) = 8", BLUE)], 15, weight=700)
    label(g, 25, 335, [("得到解析式：", SOFT)], 13)
    g.rect(25, 350, 185, 42, c=BLUE, sw=1.5, fill="#f0f9ff", rx=5)
    label(g, 117, 376, [("y = 8 / x", BLUE)], 17, "middle", weight=700)
    end_step(g)

    # ---------------- 栏 2：y < 4 取值范围 ----------------
    step(g, 2)
    g.text(265, 32, "2. 求 y < 4 的范围", size=14, weight=700)
    o2x, o2y, s2 = 360, 140, 13
    g.arrow(275, o2y, 445, o2y, GRAY, 1.2, size=6)
    g.arrow(o2x, 225, o2x, 50, GRAY, 1.2, size=6)
    label(g, 450, o2y + 4, [("x", SOFT)], 13)
    label(g, o2x - 8, 45, [("y", SOFT)], 13)
    label(g, o2x - 10, o2y + 14, [("O", SOFT)], 12, "end")

    # 双曲线 y=8/x
    pts2_pos = [(o2x + x * s2, o2y - (8.0 / x) * s2) for x in [1.5 + i * 0.15 for i in range(35)]]
    g.poly(pts2_pos, c=LIGHT, w=1.5)

    # 水平线 y = 4
    g.line(275, o2y - 4 * s2, 445, o2y - 4 * s2, GRAY, 1.2, dash="3 3")
    label(g, 450, o2y - 4 * s2 + 4, [("y=4", SOFT)], 12)

    # y < 4 绿色加粗高亮段：
    # 1) 第三象限整支 x < 0
    pts2_neg = [(o2x + x * s2, o2y - (8.0 / x) * s2) for x in [-6.5 + i * 0.15 for i in range(35)]]
    g.poly(pts2_neg, c=GREEN, w=2.4)
    # 2) 第一象限 x > 2
    pts2_green = [(o2x + x * s2, o2y - (8.0 / x) * s2) for x in [2.05 + i * 0.15 for i in range(31)]]
    g.poly(pts2_green, c=GREEN, w=2.4)

    # 空心圆圈 (2, 4)
    g.circle(o2x + 2 * s2, o2y - 4 * s2, 3.5, c=GREEN, sw=1.5, fill="#fff")
    label(g, o2x + 2 * s2 + 6, o2y - 4 * s2 - 6, [("(2, 4)", GREEN)], 13)

    label(g, 265, 260, [("• 第一象限 x > 2：曲线在 y=4 下方", SOFT)], 12)
    label(g, 265, 285, [("• 第三象限 x < 0：整支 y < 0 < 4", SOFT)], 12)
    label(g, 265, 315, [("（x=0 与 x=2 均为断开空心端点）", CORAL)], 12)

    g.rect(265, 340, 195, 55, c=GREEN, sw=1.5, fill="#f0fdf4", rx=5)
    label(g, 362, 365, [("y < 4 的范围：", INK)], 13, "middle")
    label(g, 362, 386, [("x < 0  或  x > 2", GREEN)], 15, "middle", weight=700)
    end_step(g)

    # ---------------- 栏 3：比较三点函数值 ----------------
    step(g, 3)
    g.text(505, 32, "3. 比较三点纵坐标", size=14, weight=700)
    o3x, o3y, s3 = 600, 140, 13
    g.arrow(515, o3y, 685, o3y, GRAY, 1.2, size=6)
    g.arrow(o3x, 225, o3x, 50, GRAY, 1.2, size=6)
    label(g, 690, o3y + 4, [("x", SOFT)], 13)
    label(g, o3x - 8, 45, [("y", SOFT)], 13)
    label(g, o3x - 10, o3y - 6, [("O", SOFT)], 12, "end")

    pts3_pos = [(o3x + x * s3, o3y - (8.0 / x) * s3) for x in [1.5 + i * 0.15 for i in range(35)]]
    pts3_neg = [(o3x + x * s3, o3y - (8.0 / x) * s3) for x in [-6.5 + i * 0.15 for i in range(35)]]
    g.poly(pts3_pos, c=BLUE, w=1.8)
    g.poly(pts3_neg, c=BLUE, w=1.8)

    # 点 C(4, y3): y3 = 2 > 0
    cx, cy = o3x + 4 * s3, o3y - 2 * s3
    g.line(o3x, cy, cx, cy, BLUE, 1, dash="2 2")
    g.dot(cx, cy, r=3.5, c=BLUE)
    label(g, cx, cy - 10, [("C", BLUE)], 13, "middle", weight=700)
    label(g, o3x - 6, cy + 4, [("y₃", BLUE)], 12, "end")

    # 点 A(-3, y1): y1 = -8/3 ≈ -2.67
    ax, ay = o3x - 3 * s3, o3y + 2.67 * s3
    g.line(ax, ay, o3x, ay, BLUE, 1, dash="2 2")
    g.dot(ax, ay, r=3.5, c=BLUE)
    label(g, ax - 16, ay, [("A", BLUE)], 13, "end", weight=700)
    label(g, o3x + 6, ay + 14, [("y₁", BLUE)], 12)

    # 点 B(-5, y2): y2 = -8/5 = -1.6
    bx, by = o3x - 5 * s3, o3y + 1.6 * s3
    g.line(bx, by, o3x, by, BLUE, 1, dash="2 2")
    g.dot(bx, by, r=3.5, c=BLUE)
    label(g, bx + 10, by - 6, [("B", BLUE)], 13, "start", weight=700)
    label(g, o3x + 6, by - 4, [("y₂", BLUE)], 12)

    label(g, 505, 260, [("• C 在第一象限：", SOFT), ("y₃ > 0", BLUE)], 13)
    label(g, 505, 288, [("• A、B 在第三象限：", SOFT)], 13)
    label(g, 520, 312, [("因 −5 < −3，递减得 ", SOFT), ("y₂ > y₁", BLUE)], 13)
    label(g, 520, 335, [("且 ", SOFT), ("y₁ < y₂ < 0", BLUE)], 13)

    g.rect(505, 355, 195, 45, c=GREEN, sw=1.8, fill="#f0fdf4", rx=5)
    label(g, 602, 384, [("y₁ < y₂ < y₃", GREEN)], 18, "middle", weight=700)
    end_step(g)

    return g


def rect_area_coord():
    """27.2d 坐标联系矩形与面积（GD2024第23题第(1)问，会泄题，只存不插）。
    B(m,am)、A(m,k/m)、D(k/(am),k/m)、C(k/(am),am)，两坐标矩形面积相等。
    """
    g = Fig(720, 440, "rac-272d", "矩形边平行于坐标轴时的坐标与面积关系",
            "左侧直角坐标系展示直线y=ax与双曲线y=k/x(第一象限)。矩形ABCD对角线BD在直线上，"
            "AD平行于x轴。展示以原点为顶点的两个坐标轴矩形O-A与O-C面积均为k。"
            "右侧展示推导：由坐标关系得C点坐标为(k/(am),am)，其横纵坐标乘积恒为k，"
            "证明点C必在反比例函数y=k/x的图象上。")

    # 分割线
    g.line(355, 25, 355, 420, LIGHT, 1, dash="4 4")

    # 参数取 a=0.5, m=2, k=8:
    # B=(2, 1), A=(2, 4), D=(8, 4), C=(8, 1)
    # 屏幕比例：原点在 (65, 360)，scale_x = 28, scale_y = 52
    ox, oy, sx, sy = 65, 360, 28, 52

    # 坐标轴
    g.arrow(45, oy, 335, oy, GRAY, 1.3, size=7)
    g.arrow(ox, 385, ox, 45, GRAY, 1.3, size=7)
    label(g, 340, oy + 5, [("x", INK)], 16)
    label(g, ox - 10, 40, [("y", INK)], 16)
    label(g, ox - 14, oy + 16, [("O", INK)], 15, "end")

    # 双曲线 y = 8/x (蓝色)
    pts_hyp = [(ox + x * sx, oy - (8.0 / x) * sy) for x in [1.5 + i * 0.15 for i in range(48)]]
    g.poly(pts_hyp, c=BLUE, w=2)
    label(g, 310, oy - 1.2 * sy, [("y = k/x", BLUE)], 14)

    # 直线 y = ax (灰色)
    g.line(ox, oy, ox + 8.8 * sx, oy - 4.4 * sy, GRAY, 1.5)
    label(g, ox + 8.8 * sx - 15, oy - 4.6 * sy, [("y = ax", SOFT)], 14)

    # 矩形 ABCD 的四个顶点
    bx, by = ox + 2 * sx, oy - 1 * sy
    ax, ay = ox + 2 * sx, oy - 4 * sy
    dx, dy = ox + 8 * sx, oy - 4 * sy
    cx, cy = ox + 8 * sx, oy - 1 * sy

    # 两个坐标轴矩形的浅色背景
    # 矩形 O-A: [0, 2] x [0, 4]
    g.rect(ox, ay, 2 * sx, 4 * sy, c=BLUE, sw=1.2, fill="#e0f2fe", rx=0)
    # 矩形 O-C: [0, 8] x [0, 1]
    g.rect(ox, cy, 8 * sx, 1 * sy, c=GREEN, sw=1.2, fill="#dcfce7", rx=0)

    # 矩形 ABCD 实线轮廓
    g.poly([(ax, ay), (dx, dy), (cx, cy), (bx, by)], c=INK, w=2, close=True)
    # 对角线 BD
    g.line(bx, by, dx, dy, INK, 1.5, dash="4 3")

    # 顶点圆点与名称
    for (px, py), name, pos in [((ax, ay), "A", (ax - 18, ay - 6)),
                                ((bx, by), "B", (bx - 18, by + 16)),
                                ((cx, cy), "C", (cx + 8, cy + 16)),
                                ((dx, dy), "D", (dx + 10, dy + 18))]:
        g.dot(px, py, r=4, c=INK)
        label(g, pos[0], pos[1], [(name, INK)], 16, weight=700)

    # 右侧推导说明
    step(g, 1)
    g.text(380, 35, "GD2024第23题(1) 坐标与面积推导", size=15, weight=700)
    label(g, 380, 70, [("1. 由矩形边平行于坐标轴写出各点坐标：", SOFT)], 14)
    label(g, 405, 96, [("设 ", INK), ("B(m, am)", INK), ("，其中 m > 0，a > 0", SOFT)], 15)
    label(g, 405, 124, [("A 与 B 横坐标相同，且 A 在双曲线上：", SOFT)], 14)
    label(g, 425, 148, [("A(m, ", INK), ("k/m", BLUE), (")", INK)], 16, weight=600)
    end_step(g)

    step(g, 2)
    label(g, 405, 180, [("AD // x 轴，D 的纵坐标为 k/m；又 D 在直线 y=ax 上：", SOFT)], 13)
    label(g, 425, 206, [("k/m = ax  ⇒  x = k/(am)", INK)], 15)
    label(g, 425, 232, [("故 ", INK), ("D(k/(am), k/m)", INK)], 15)
    end_step(g)

    step(g, 3)
    label(g, 405, 266, [("C 与 D 同横坐标、与 B 同纵坐标：", SOFT)], 14)
    label(g, 425, 292, [("C(", INK), ("k/(am)", GREEN), (", ", INK), ("am", GREEN), (")", INK)], 16, weight=700)
    end_step(g)

    step(g, 4)
    label(g, 380, 332, [("2. 坐标矩形面积恒等与验证：", SOFT)], 14)
    label(g, 405, 358, [("矩形 O-A 面积：", SOFT), ("m · (k/m) = ", INK), ("k", BLUE)], 15)
    label(g, 405, 384, [("矩形 O-C 面积：", SOFT), ("(k/(am)) · (am) = ", INK), ("k", GREEN)], 15)

    g.rect(395, 398, 305, 36, c=GREEN, sw=1.5, fill="#f0fdf4", rx=5)
    label(g, 547, 422, [("C 点横纵坐标乘积为 k  ⇒  C 在双曲线上！", GREEN)], 14, "middle", weight=700)
    end_step(g)

    return g


def model_data_fit():
    """27.3b 从数据选择反比例模型（会泄题，只存不插）。
    数据表、xy乘积列表、散点与近似曲线y=2200/x、尺寸估计x≈55英寸。
    """
    g = Fig(720, 440, "mdf-273b", "电子屏幕数据反比例模型拟合与估计",
            "左侧展示课本电子屏幕尺寸x与像素密度y的数据表及乘积xy列表，"
            "各组乘积均接近2200，说明适合近似反比例模型y=2200/x。"
            "右侧坐标系展示5个蓝色数据散点与绿色拟合双曲线y=2200/x，"
            "并用虚线投影展示当像素密度为40 PPI时估计尺寸约为55英寸。")

    # 分割线
    g.line(335, 25, 335, 420, LIGHT, 1, dash="4 4")

    # 左侧数据与乘积表格
    step(g, 1)
    g.text(30, 35, "数据表与乘积检验", size=15, weight=700)

    # 画表格
    tx, ty = 30, 65
    g.rect(tx, ty, 280, 120, c=GRAY, sw=1.2, fill="#ffffff")
    g.line(tx, ty + 40, tx + 280, ty + 40, GRAY, 1)
    g.line(tx, ty + 80, tx + 280, ty + 80, GRAY, 1)
    # 竖线
    g.line(tx + 85, ty, tx + 85, ty + 120, GRAY, 1)
    for i in range(1, 5):
        g.line(tx + 85 + i * 39, ty, tx + 85 + i * 39, ty + 120, GRAY, 0.8)

    # 表头
    label(g, tx + 42, ty + 25, [("尺寸 x (英寸)", SOFT)], 12, "middle")
    label(g, tx + 42, ty + 65, [("密度 y (PPI)", SOFT)], 12, "middle")
    label(g, tx + 42, ty + 105, [("乘积 xy", INK)], 13, "middle", weight=600)

    # 数据行
    xs = ["5", "7", "15", "24", "27"]
    ys = ["440", "314", "147", "92", "81"]
    xys = ["2200", "2198", "2205", "2208", "2187"]
    for i in range(5):
        cx = tx + 85 + i * 39 + 19
        label(g, cx, ty + 25, [(xs[i], BLUE)], 13, "middle")
        label(g, cx, ty + 65, [(ys[i], BLUE)], 13, "middle")
        label(g, cx, ty + 105, [(xys[i], GREEN)], 12, "middle", weight=600)

    label(g, 30, 212, [("规律分析：", INK)], 14, weight=600)
    label(g, 30, 238, [("• 各组乘积 xy 均非常接近 2200", SOFT)], 13)
    label(g, 30, 262, [("• 平均乘积约为 2199.6 ≈ 2200", SOFT)], 13)
    label(g, 30, 290, [("确定近似反比例模型：", SOFT)], 13)

    g.rect(30, 305, 280, 48, c=GREEN, sw=1.8, fill="#f0fdf4", rx=6)
    label(g, 170, 335, [("y = 2200 / x  (x > 0)", GREEN)], 18, "middle", weight=700)

    label(g, 30, 382, [("实测数据存在取整与近似误差，", SOFT)], 12)
    label(g, 30, 402, [("曲线不要求严格经过每个离散点", SOFT)], 12)
    end_step(g)

    # 右侧散点与拟合曲线坐标系
    # 原点在 (360, 360)，横轴尺寸 x (0~65寸)，纵轴密度 y (0~500 PPI)
    ox, oy = 360, 360
    sx, sy = 4.6, 0.56

    step(g, 2)
    # 坐标轴
    g.arrow(ox - 10, oy, ox + 310, oy, GRAY, 1.3, size=7)
    g.arrow(ox, oy + 10, ox, oy - 315, GRAY, 1.3, size=7)
    label(g, ox + 305, oy + 18, [("x (英寸)", SOFT)], 13)
    label(g, ox - 10, oy - 315, [("y (PPI)", SOFT)], 13)
    label(g, ox - 10, oy + 15, [("O", SOFT)], 13, "end")

    # 刻度
    for vx in (15, 30, 45, 60):
        px = ox + vx * sx
        g.line(px, oy - 3, px, oy + 3, GRAY, 1)
        label(g, px, oy + 15, [(str(vx), SOFT)], 12, "middle")
    for vy in (100, 200, 300, 400):
        py = oy - vy * sy
        g.line(ox - 3, py, ox + 3, py, GRAY, 1)
        label(g, ox - 6, py + 4, [(str(vy), SOFT)], 11, "end")

    # 5 个已知散点 (蓝色)
    pts_raw = [(5, 440), (7, 314), (15, 147), (24, 92), (27, 81)]
    for vx, vy in pts_raw:
        g.dot(ox + vx * sx, oy - vy * sy, r=4, c=BLUE)

    # 拟合双曲线 y = 2200/x (绿色)
    curve = [(ox + x * sx, oy - (2200.0 / x) * sy) for x in [4.5 + i * 0.8 for i in range(71)]]
    g.poly(curve, c=GREEN, w=2.2)
    label(g, ox + 215, oy - 80, [("y = 2200/x", GREEN)], 14, weight=700)
    end_step(g)

    # 估计点 y = 40 时 x ≈ 55
    step(g, 3)
    est_x, est_y = 55, 40
    epx, epy = ox + est_x * sx, oy - est_y * sy
    g.line(ox, epy, epx, epy, CORAL, 1.2, dash="3 3")
    g.line(epx, oy, epx, epy, CORAL, 1.2, dash="3 3")
    g.dot(epx, epy, r=4.5, c=CORAL)
    label(g, epx + 8, epy - 6, [("估计点 (55, 40)", CORAL)], 13, "start", weight=600)
    label(g, epx, oy + 15, [("55", CORAL)], 12, "middle", weight=700)

    # 下方估计结论框
    g.rect(365, 392, 335, 40, c=CORAL, sw=1.5, fill="#fef2f2", rx=5)
    label(g, 532, 417, [("当 y = 40 PPI 时，屏幕尺寸约为 ", SOFT), ("55 英寸", CORAL)], 14, "middle", weight=700)
    end_step(g)

    return g


def render_png(svg_path, directory, w, h):
    """沿用 draw-math-26 的 Chromium 预览，并隔离临时 HTML 与浏览器配置。"""
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
        ("g8a-18-fractions", "fraction-cancel-18-1b.svg", fraction_cancel()),
        ("g8a-18-fractions", "fraction-add-sub-18-3a.svg", fraction_add_sub()),
        ("g8a-18-fractions", "fraction-equation-18-5a.svg", fraction_equation()),
        ("g9a-25-quadratic-equations", "complete-square-25-2b.svg", complete_square()),
        ("g9a-25-quadratic-equations", "discriminant-branch-25-2c.svg", discriminant_branch()),
        ("g9a-25-quadratic-equations", "factor-solve-25-2e.svg", factor_solve()),
        ("g9a-25-quadratic-equations", "photo-frame-25-3a.svg", photo_frame()),
        ("g9a-25-quadratic-equations", "successive-change-25-3b.svg", successive_change()),
        ("g9a-27-inverse-proportion", "inverse-find-k-27-1b.svg", inverse_find_k()),
        ("g9a-27-inverse-proportion", "compare-values-27-2b.svg", compare_values()),
        ("g9a-27-inverse-proportion", "rect-area-coord-27-2d.svg", rect_area_coord()),
        ("g9a-27-inverse-proportion", "model-data-fit-27-3b.svg", model_data_fit()),
    ]
    for chapter, filename, fig in figures:
        path = ROOT / "course/math" / chapter / "figures" / filename
        fig.save(str(path))
        print(path.relative_to(ROOT))
        if preview_dir:
            shot = render_png(path, preview_dir, fig.w, fig.h)
            print(f"  -> PNG: {shot.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
