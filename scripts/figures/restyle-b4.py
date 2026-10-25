#!/usr/bin/env python3
"""实物感画法重画 b4：滑轮、称重法、功、杠杆两张（2026-10-25）。

用法：python3 scripts/figures/restyle-b4.py
只写 output/preview/fig-review/restyle/，不碰 course/。
"""
from svgkit import *
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/preview/fig-review/restyle'
MAIN, THIN = 2.4, 1.6  # 主角轮廓、绳子与细部
SUFFIX = ' 静态 SVG，无动画；图形尺寸仅作示意，不表示实测数值或题目数据。'
DASH = '5 4'


def shape_fill(g, kind, color, opacity, attrs):
    g.raw(f'<{kind} {attrs} fill="{color}" fill-opacity="{opacity}" stroke="none"/>')


def box(g, x, y, w, h):
    """被提起、被称量的物体：黄色淡填充 + 灰色粗轮廓。"""
    g.rect(x, y, w, h, GRAY, MAIN, fill='#fff')
    shape_fill(g, 'rect', YELLOW, .18, f'x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}"')
    g.rect(x, y, w, h, GRAY, MAIN, fill='none')


def wheel(g, cx, cy, r):
    g.circle(cx, cy, r, GRAY, MAIN, fill='#fff')
    shape_fill(g, 'circle', GRAY, .08, f'cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}"')
    g.circle(cx, cy, r, GRAY, MAIN, fill='none')
    g.circle(cx, cy, 4, GRAY, THIN, fill='#fff')


def mount(g, x1, x2, y):
    """固定横梁：粗线 + 上方一排 45° 短斜线。"""
    x = x1 + 4
    while x <= x2:
        g.line(x, y, x + 5.7, y - 5.7, GRAY, 1.4)
        x += 10
    g.line(x1, y, x2, y, GRAY, MAIN)


def draw_pulleys():
    name = 'fixed-movable-pulleys'
    g = Fig(640, 390, 'opt-a-' + name, '定滑轮和动滑轮的轴与物体',
            '左图定滑轮轴连接上方支架，物体挂在绳的一端，向下拉另一端。右图动滑轮轴连接物体，绳的一端固定上方，另一端向上拉，轴随物体一起上升。不标具体拉力或重量。' + SUFFIX)
    r = 28
    for cx in (160, 440):
        mount(g, cx - 62, cx + 62, 36)
    # 定滑轮：轴挂在支架上，绳绕上半周
    fx, fy = 160, 88
    g.line(fx, 36, fx, fy, GRAY, THIN)
    wheel(g, fx, fy, r)
    g.raw(f'<path d="M{fx-r} {fy}A{r} {r} 0 0 1 {fx+r} {fy}" stroke="{GRAY}" stroke-width="{THIN}"/>')
    g.line(fx - r, fy, fx - r, 258, GRAY, THIN)
    g.line(fx + r, fy, fx + r, 210, GRAY, THIN)
    g.arrow(fx + r, 210, fx + r, 262, BLUE, 2.6, 11)
    g.sym(fx + r + 15, 239, 'F', c=BLUE)
    box(g, fx - r - 24, 258, 48, 43)
    g.text(fx - r, 284, '物体', anchor='middle', size=13)
    g.text(68, 88, '轴固定', anchor='middle', size=13)
    g.line(101, 83, fx - 8, 83, GRAY, THIN)
    # 动滑轮：绳一端固定在支架，绕下半周，轴连物体
    mx, my = 440, 224
    g.line(mx - r, 36, mx - r, my, GRAY, THIN)
    g.line(mx + r, my, mx + r, 123, GRAY, THIN)
    g.arrow(mx + r, 123, mx + r, 66, BLUE, 2.6, 11)
    g.sym(mx + r + 15, 105, 'F', c=BLUE)
    wheel(g, mx, my, r)
    g.raw(f'<path d="M{mx-r} {my}A{r} {r} 0 0 0 {mx+r} {my}" stroke="{GRAY}" stroke-width="{THIN}"/>')
    g.line(mx, my + 5, mx, 294, GRAY, THIN)
    box(g, mx - 24, 294, 48, 43)
    g.text(mx, 320, '物体', anchor='middle', size=13)
    g.text(550, 216, '轴随物体', anchor='middle', size=13)
    g.line(mx + 9, my, 515, my, GRAY, THIN)
    g.arrow(549, 325, 549, 257, CORAL, 2.2, 10)
    g.text(567, 295, '上升', c=CORAL, size=13)
    g.text(160, 369, '定滑轮', anchor='middle')
    g.text(440, 369, '动滑轮', anchor='middle')
    return g.save(str(OUT / f'{name}.svg'))


def spring_scale(g, cx, top, end):
    # 吊环、外壳（灰淡填充）、白色刻度板、弹簧、指针、挂钩
    g.circle(cx, top - 9, 7, GRAY, THIN, fill='none')
    g.rect(cx - 18, top, 36, 126, GRAY, MAIN, fill='#fff')
    shape_fill(g, 'rect', GRAY, .08, f'x="{f(cx-18)}" y="{top}" width="36" height="126"')
    g.rect(cx + 5, top + 42, 12, 62, LIGHT, 1, fill='#fff')
    g.rect(cx - 18, top, 36, 126, GRAY, MAIN, fill='none')
    pts = [(cx, top + 8)]
    for i in range(9):
        pts.append((cx + (-6 if i % 2 == 0 else 6), top + 16 + (end - top - 24) * i / 8))
    pts.append((cx, end))
    g.poly(pts, w=THIN)
    g.line(cx, end, cx, top + 145, GRAY, THIN)
    for j in range(6):
        g.line(cx + 8, top + 48 + j * 10, cx + 15, top + 48 + j * 10, GRAY, THIN)
    g.line(cx - 13, end, cx - 5, end, CORAL, 1.8)
    g.raw(f'<path d="M{cx} {top+145}a7 7 0 1 1 -7 7" stroke="{GRAY}" stroke-width="{THIN}" fill="none"/>')


def draw_buoyancy():
    name = 'buoyancy-weighing'
    dy = 22  # 顶部加固定横梁，整图下移
    g = Fig(600, 365 + dy, 'opt-a-' + name, '称重法测量浮力',
            '同一物体分别静止悬挂在空气中和浸没在液体中。测力计示数只用 G 和 F拉 标明，不标具体读数；液体中的物体不接触容器底或壁。' + SUFFIX)
    top = 39 + dy
    for i, cx in enumerate((155, 435)):
        mount(g, cx - 30, cx + 30, 14)
        g.line(cx, 14, cx, top - 16, GRAY, THIN)
        spring_scale(g, cx, top, (124 if i == 0 else 102) + dy)
        if i:
            cx0, half, ctop, bottom, surface = cx, 85, 197 + dy, 324 + dy, 223 + dy
            g.raw(f'<rect x="{cx0-half}" y="{surface}" width="{half*2}" height="{bottom-surface}" '
                  f'fill="{BLUE}" fill-opacity=".12" stroke="none"/>')
            g.poly([(cx0 - half, ctop), (cx0 - half, bottom), (cx0 + half, bottom), (cx0 + half, ctop)], w=MAIN)
            g.line(cx0 - half, surface, cx0 + half, surface, BLUE, 1.8)
        g.line(cx, top + 159, cx, 250 + dy, GRAY, THIN)
        box(g, cx - 24, 250 + dy, 48, 48)
        g.line(cx + 26, 111 + dy, cx + 59, 111 + dy, GRAY, THIN)
        g.sym(cx + 71, 117 + dy, 'G' if i == 0 else 'F', None if i == 0 else '拉', c=BLUE)
        g.text(cx, 350 + dy, '空气中' if i == 0 else '浸入液体', anchor='middle')
    return g.save(str(OUT / f'{name}.svg'))




def tint(g, kind, color, opacity, attrs):
    shape_fill(g, kind, color, opacity, attrs)


def draw_work():
    name = 'work-force-distance'
    g = Fig(540, 345, 'opt-a-' + name, '沿力方向移动的距离 s',
            '同一构件从下方起点竖直提升到上方终点，拉力 F 竖直向上；s 标在与拉力平行的竖直尺寸线上，两端与构件同一参考点的起、终位置等高。' + SUFFIX)
    cx, start, end = 247, 268, 125
    for y in (start, end):
        box(g, cx - 27, y - 25, 54, 50)
    for y in (start, end):
        g.dot(cx, y, 3, GRAY)
        g.line(cx + 35, y, 381, y, GRAY, THIN, DASH)
    g.arrow(cx, end - 25, cx, 44, BLUE, 2.6, 12)
    g.sym(cx + 16, 76, 'F', c=BLUE)
    g.arrow(397, start, 397, end, BLUE, 2, 10)
    g.line(390, start, 404, start, BLUE, 1.6)
    g.line(390, end, 404, end, BLUE, 1.6)
    g.sym(413, (start + end) / 2 + 5, 's', c=BLUE)
    g.text(181, start + 5, '起点', anchor='end')
    g.text(181, end + 5, '终点', anchor='end')
    g.text(270, 327, '沿力方向移动', anchor='middle', size=13, c=SOFT)
    return g.save(str(OUT / f'{name}.svg'))


def lever(g, a, b, ox, beam_y, arm_y, force1, force2):
    # 杠杆本体：灰淡填充的窄条；力臂的彩色段仍画在杆的中线上（含义保留）
    hh = 6
    g.rect(a, beam_y - hh, b - a, 2 * hh, GRAY, MAIN, fill='#fff')
    shape_fill(g, 'rect', GRAY, .08, f'x="{f(a)}" y="{f(beam_y-hh)}" width="{f(b-a)}" height="{2*hh}"')
    g.rect(a, beam_y - hh, b - a, 2 * hh, GRAY, MAIN, fill='none')
    g.line(a, beam_y, ox, beam_y, BLUE, 2)
    g.line(ox, beam_y, b, beam_y, CORAL, 2)
    pts = [(ox, beam_y + hh), (ox - 14, beam_y + 30), (ox + 14, beam_y + 30)]
    g.poly(pts, c=GRAY, w=MAIN, close=True, fill='#fff')
    shape_fill(g, 'polygon', GRAY, .08, 'points="' + ' '.join(f'{f(x)},{f(y)}' for x, y in pts) + '"')
    g.poly(pts, c=GRAY, w=MAIN, close=True, fill='none')
    g.dot(ox, beam_y, 3, GRAY)
    g.line(ox, beam_y - 8, ox, arm_y, GRAY, THIN, DASH)
    for x, force, color, sub in ((a, force1, BLUE, '1'), (b, force2, CORAL, '2')):
        g.line(x, arm_y - 6, x, beam_y - hh - 2, GRAY, THIN, DASH)
        dimension(g, x, arm_y, ox, arm_y, color)
        g.right_angle(x, arm_y, (1 if x < ox else -1, 0), (0, 1), 8, color, 1.6)
        g.arrow(x, beam_y, x, beam_y + force, color, 2.6, 11)
        g.sym((x + ox) / 2, arm_y - 13, 'l', sub, c=color, anchor='middle')
    g.sym(a - 16, beam_y + force1 - 6, 'F', '1', c=BLUE, anchor='end')
    g.sym(b + 16, beam_y + force2 - 6, 'F', '2', c=CORAL)
    g.sym(ox + 23, beam_y + 26, 'O', size=16)


def dimension(g, x1, y1, x2, y2, color=GRAY):
    ux, uy = unit(x2 - x1, y2 - y1)
    nx, ny = -uy, ux
    g.line(x1, y1, x2, y2, color, 1.6)
    for x, y in ((x1, y1), (x2, y2)):
        g.line(x - nx * 5, y - ny * 5, x + nx * 5, y + ny * 5, color, 1.6)


def draw_levers():
    name = 'lever-equilibrium'
    g = Fig(620, 275, 'opt-a-' + name, '杠杆平衡的力与力臂',
            '水平静止的杠杆，支点 O 两侧的竖直向下力 F1、F2 和对应的水平力臂 l1、l2。每条力臂从 O 到该力的作用线并与作用线垂直；较长力臂对应较小的力，两侧力与力臂乘积相等。' + SUFFIX)
    a, b, ox, force1 = 105, 485, 325, 48
    force2 = force1 * (ox - a) / (b - ox)
    lever(g, a, b, ox, 128, 65, force1, force2)
    g.sym(310, 251, 'F₁l₁ = F₂l₂', anchor='middle', size=20)
    p1 = g.save(str(OUT / f'{name}.svg'))

    name = 'lever-type-comparisons'
    g = Fig(660, 520, 'opt-a-' + name, '动力臂和阻力臂的三种关系',
            '三排水平杠杆分别表示动力臂大于、短于、等于阻力臂，依次为省力、费力、等臂杠杆；支点与两条竖直力的作用线确定水平力臂，箭长按平衡条件计算。' + SUFFIX)
    a, b = 230, 570
    for i, (ox, label, relation) in enumerate(((441, '省力杠杆', '>'), (359, '费力杠杆', '<'), (400, '等臂杠杆', '='))):
        row = i * 168
        g.text(95, row + 81, label, anchor='middle')
        g.sym(61, row + 113, 'l', '1', size=17)
        g.text(95, row + 113, escape(relation), anchor='middle', size=17, weight=500)
        g.sym(112, row + 113, 'l', '2', size=17)
        force1 = 45 if i == 0 else (65 if i == 1 else 52)
        force2 = force1 * (ox - a) / (b - ox)
        lever(g, a, b, ox, row + 77, row + 32, force1, force2)
    p2 = g.save(str(OUT / f'{name}.svg'))
    return p1, p2


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for p in (draw_pulleys(), draw_buoyancy(), draw_work(), *draw_levers()):
        print(p)
