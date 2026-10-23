#!/usr/bin/env python3
"""一次函数、反比例函数探索器的静态初始图（组件失败、打印、减少动态时显示）。
坐标视窗与组件一致：x、y 都是 [-6, 6]。用法：python3 scripts/figures/draw-math-widgets-static.py
"""
import importlib.util, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
spec = importlib.util.spec_from_file_location('m26', Path(__file__).parent / 'draw-math-26.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
from svgkit import *
ROOT = Path(__file__).resolve().parents[2]


def save(g, path):
    import html
    g.title, g.desc = html.escape(g.title), html.escape(g.desc)
    g.save(str(path))


def line_fig():
    name = 'line-explorer-23-2a'
    g = Fig(720, 440, name, '一次函数探索器的初始状态',
            '等比例坐标系，横纵坐标都从−6到6。蓝色直线y=2x−1，k=2大于0，从左向右上升，经过(0,−1)和(1,1)。右侧为读数：k=2，b=−1。')
    p = m.Plot(g, 30, 40, 360, 360, -6, 6, -6, 6)
    p.axes(xticks=range(-5, 6), yticks=range(-5, 6))
    p.curve(lambda x: 2 * x - 1, -2.5, 3.5, BLUE)
    p.dot(0, -1, BLUE); p.dot(1, 1, BLUE)
    m.label(g, *[v + d for v, d in zip(p.p(0, -1), (10, 18))], [('(0, −1)', BLUE)], size=15)
    m.label(g, *[v + d for v, d in zip(p.p(1, 1), (10, 18))], [('(1, 1)', BLUE)], size=15)
    m.caption(g, 450, '初始读数', y=60)
    m.label(g, 450, 110, [('k=2', BLUE)], size=21)
    m.label(g, 450, 146, [('b=−1', GREEN)], size=21)
    m.label(g, 450, 196, [('y=2x−1', BLUE)], size=23)
    m.label(g, 450, 236, [('k>0：从左向右上升', BLUE)], size=16)
    m.label(g, 450, 270, [('与 y 轴交于 (0, ', INK), ('−1', GREEN), (')', INK)], size=16)
    save(g, ROOT / 'course/math/g8b-23-linear-functions/figures' / (name + '.svg'))


def inverse_fig():
    name = 'inverse-explorer-27-2a'
    g = Fig(720, 440, name, '反比例函数探索器的初始状态',
            '等比例坐标系，横纵坐标都从−6到6。蓝色双曲线y=3/x分两支，位于第一、第三象限；点P(2,1.5)在第一象限的一支上。右侧为读数：k=3大于0。')
    p = m.Plot(g, 30, 40, 360, 360, -6, 6, -6, 6)
    p.axes(xticks=range(-5, 6), yticks=range(-5, 6))
    p.curve(lambda x: 3 / x, 0.5, 6, BLUE)
    p.curve(lambda x: 3 / x, -6, -0.5, BLUE)
    p.dot(2, 1.5, CORAL)
    m.label(g, *[v + d for v, d in zip(p.p(2, 1.5), (10, -8))], [('P(2, 1.5)', CORAL)], size=15)
    m.caption(g, 450, '初始读数', y=60)
    m.label(g, 450, 110, [('k=3', BLUE)], size=21)
    m.label(g, 450, 160, [('y=3/x', BLUE)], size=23)
    m.label(g, 450, 200, [('k>0：第一、第三象限', BLUE)], size=16)
    m.label(g, 450, 240, [('P 的横纵坐标之积 = ', INK), ('3', BLUE)], size=16)
    save(g, ROOT / 'course/math/g9a-27-inverse-proportion/figures' / (name + '.svg'))


line_fig(); inverse_fig(); print('ok')
