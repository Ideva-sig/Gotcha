#!/usr/bin/env python3
"""实物感画法重画 b3：7 张（2026-10-25）。

坐标、文字照抄 draw-opt-a.py（只读，不运行、不 import），只改线宽、填充和支架画法。
只写 output/preview/fig-review/restyle/，不碰 course/。
"""
from svgkit import *
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/preview/fig-review/restyle'
MAIN, THIN = 2.4, 1.6
SUFFIX = ' 静态 SVG，无动画；图形尺寸仅作示意，不表示实测数值或题目数据。'


def fig(w, h, name, title, desc):
    return Fig(w, h, 'opt-a-' + name, title, desc + SUFFIX)


def shape_fill(g, kind, color, opacity, attrs):
    g.raw(f'<{kind} {attrs} fill="{color}" fill-opacity="{opacity}" stroke="none"/>')


def tint(g, x, y, w, h, color=BLUE, opacity=.12):
    shape_fill(g, 'rect', color, opacity, f'x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}"')


def body(g, x, y, w, h, color=GRAY, opacity=.08):
    """主角物体：白底 + 淡色 + 2.4 轮廓。"""
    g.rect(x, y, w, h, GRAY, MAIN, fill='#fff')
    tint(g, x, y, w, h, color, opacity)
    g.rect(x, y, w, h, GRAY, MAIN, fill='none')


def load(g, x, y, w, h):
    body(g, x, y, w, h, YELLOW, .18)


def wheel(g, cx, cy, r):
    g.circle(cx, cy, r, GRAY, MAIN, fill='#fff')
    shape_fill(g, 'circle', GRAY, .08, f'cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}"')
    g.circle(cx, cy, r, GRAY, MAIN, fill='none')


def mount(g, x1, x2, y):
    x = x1 + 4
    while x <= x2:
        g.line(x, y, x + 5.7, y - 5.7, GRAY, 1.4)
        x += 10
    g.line(x1, y, x2, y, GRAY, MAIN)


def vessel(g, cx, top, bottom, surface, half=65):
    tint(g, cx - half, surface, half * 2, bottom - surface)
    g.poly([(cx - half, top), (cx - half, bottom), (cx + half, bottom), (cx + half, top)], w=MAIN)
    g.line(cx - half, surface, cx + half, surface, BLUE, 1.8)


def dimension(g, x1, y1, x2, y2, color=GRAY):
    ux, uy = unit(x2 - x1, y2 - y1)
    nx, ny = -uy, ux
    g.line(x1, y1, x2, y2, color, 1.6)
    for x, y in ((x1, y1), (x2, y2)):
        g.line(x - nx * 5, y - ny * 5, x + nx * 5, y + ny * 5, color, 1.6)


def out(g, name):
    return g.save(str(OUT / (name + '.svg')))


def cart_balanced_pulls():
    name = 'cart-balanced-pulls'
    g = fig(600, 240, name, '小车两端的平衡拉力',
            '同一辆小车的两端受到大小相等、方向相反、在同一直线上的两个水平拉力。')
    body(g, 245, 92, 110, 58)
    for x in (268, 332):
        g.circle(x, 161, 11, GRAY, MAIN, fill='#fff')
        shape_fill(g, 'circle', GRAY, .08, f'cx="{x}" cy="161" r="11"')
        g.circle(x, 161, 11, GRAY, MAIN, fill='none')
    g.line(95, 120, 505, 120, GRAY, THIN, '5 4')
    g.arrow(245, 120, 155, 120, BLUE, 2.6, 12)
    g.arrow(355, 120, 445, 120, CORAL, 2.6, 12)
    g.dot(245, 120, 3, BLUE); g.dot(355, 120, 3, CORAL)
    g.sym(177, 99, 'F', '1', c=BLUE)
    g.sym(420, 99, 'F', '2', c=CORAL)
    g.text(300, 65, '同一小车', anchor='middle')
    for x, label in ((140, '大小相等'), (300, '方向相反'), (460, '同一直线')):
        g.text(x, 211, label, anchor='middle', size=14)
    return out(g, name)


def suspended_force_balance():
    name = 'suspended-force-balance'
    g = fig(580, 310, name, '悬挂静止物体的二力平衡',
            '左图是弹簧测力计悬挂的静止物体；右图只分析该物体受到的向上拉力和向下重力，两力等大、反向、共线。')
    mount(g, 82, 202, 30)
    g.line(142, 30, 142, 37, GRAY, THIN)
    g.circle(142, 44, 7, GRAY, THIN, fill='none')
    body(g, 125, 51, 34, 85)
    g.poly([(142, 59), (136, 66), (148, 73), (136, 80), (148, 87), (142, 94)], w=THIN)
    g.line(142, 94, 142, 172, GRAY, THIN)
    load(g, 120, 172, 44, 44)
    g.text(142, 254, '静止悬挂', anchor='middle')
    cx, cy, length = 425, 158, 78
    load(g, cx - 22, cy - 22, 44, 44)
    g.arrow(cx, cy, cx, cy - length, BLUE, 2.6, 12)
    g.arrow(cx, cy, cx, cy + length, CORAL, 2.6, 12)
    g.dot(cx, cy, 3, GRAY)
    g.text(cx + 17, cy - length + 5, '拉力', c=BLUE)
    g.text(cx + 17, cy + length + 5, '重力', c=CORAL)
    g.text(cx, 281, '研究物体', anchor='middle', size=13, c=SOFT)
    return out(g, name)


def manometer(g, left, top, depth, gap, liquid_label):
    cx, half = left + 65, 54
    surface, bottom = top + 55, top + 178
    vessel(g, cx, top + 36, bottom, surface, half)
    probe_y = surface + depth
    body(g, cx - 8, probe_y - 10, 16, 20)
    g.line(cx - 8, probe_y - 9, cx - 8, probe_y + 9, CORAL, 2)
    ul, ur, radius = left + 195, left + 243, 24
    tube_bottom = top + 145
    g.poly([(cx + 8, probe_y), (left + 132, probe_y), (left + 132, top + 15),
            (ul + 4, top + 15), (ul + 4, top + 30)], w=THIN)
    yl, yr = top + 94 + gap, top + 94 - gap
    g.raw(f'<path d="M{ul} {yl}V{tube_bottom}A24 24 0 0 0 {ur} {tube_bottom}'
          f'V{yr}H{ur-8}V{tube_bottom}A16 16 0 0 1 {ul+8} {tube_bottom}'
          f'V{yl}Z" fill="{BLUE}" fill-opacity=".28" stroke="none"/>')  # U 形管很细，液柱沿用原图的 .28 才看得清
    for offset, r in ((0, radius), (8, radius - 8)):
        g.raw(f'<path d="M{ul+offset} {top+30}V{tube_bottom}A{r} {r} 0 0 0 '
              f'{ur-offset} {tube_bottom}V{top+30}" stroke="{GRAY}" stroke-width="{MAIN}" fill="none"/>')
    g.line(ul, top + 30, ul + 8, top + 30, GRAY, MAIN)
    g.line(ul, yl, ul + 8, yl, BLUE, 1.8)
    g.line(ur - 8, yr, ur, yr, BLUE, 1.8)
    dimension(g, ur + 15, yr, ur + 15, yl, CORAL)
    g.text(cx, top + 205, liquid_label, anchor='middle', size=13)
    g.text(ul + 24, top + 205, '液面差', anchor='middle', size=13, c=SOFT)


def liquid_pressure_manometers():
    name = 'liquid-pressure-manometers'
    g = fig(660, 500, name, '用液体压强计比较深度和密度',
            '上排为同一种液体的浅、深两个位置，下排为同一深度的较小、较大密度液体。探头软管连接 U 形管封闭左端，右端开口；压强较大时左液面更低、右液面更高，液面差更大。测压液始终相同。')
    g.text(330, 23, '同种液体', anchor='middle')
    manometer(g, 25, 35, 36, 36 * .36, '浅处')
    manometer(g, 355, 35, 83, 83 * .36, '深处')
    g.text(330, 268, '同一深度', anchor='middle')
    manometer(g, 25, 280, 56, 16, '密度较小')
    manometer(g, 355, 280, 56, 29, '密度较大')
    return out(g, name)


def liquid_depth_h():
    name = 'liquid-depth-h'
    g = fig(560, 285, name, '液面下的竖直深度 h',
            '容器中标出液面与一个所求位置，h 仅表示从液面竖直向下到该位置的距离，不量到容器底。')
    vessel(g, 245, 35, 238, 76, 125)
    px, py = 268, 181
    g.dot(px, py, 4, CORAL)
    g.line(px + 8, py, 416, py, GRAY, THIN, '5 4')
    g.line(376, 76, 416, 76, GRAY, THIN, '5 4')
    dimension(g, 429, 76, 429, py, BLUE)
    g.sym(444, 137, 'h', c=BLUE)
    g.text(100, 81, '液面', anchor='end', c=BLUE)
    g.text(px, 214, '所求位置', anchor='middle', size=13)
    return out(g, name)


def torricelli_mercury():
    name = 'torricelli-mercury'
    g = fig(600, 390, name, '托里拆利实验的水银柱高度差',
            '倒置玻璃管顶端封闭，下端开口并浸在水银槽内。管内水银上方是真空；标出管内外液面之间的竖直高度差 760 mm，槽面上的大气压支持水银柱。')
    left, right, upper, surface, bottom = 210, 246, 104, 309, 351
    tint(g, 128, surface, 224, bottom - surface, GRAY, .25)
    g.poly([(128, 283), (128, bottom), (352, bottom), (352, 283)], w=MAIN)
    tint(g, left + 1, upper, right - left - 2, 334 - upper, GRAY, .25)
    g.raw(f'<path d="M{left} 334V58Q{left} 40 228 40Q{right} 40 {right} 58V334" '
          f'stroke="{GRAY}" stroke-width="{MAIN}" fill="none"/>')
    g.line(left, upper, right, upper, GRAY, THIN)
    g.line(128, surface, left, surface, GRAY, THIN)
    g.line(right, surface, 352, surface, GRAY, THIN)
    g.text(228, 83, '真空', anchor='middle', size=13)
    g.text(107, 165, '玻璃管', anchor='middle', size=13)
    g.line(139, 160, 201, 160, GRAY, THIN)
    for y in (upper, surface):
        g.line(right + 8, y, 396, y, GRAY, THIN, '5 4')
    dimension(g, 410, upper, 410, surface, BLUE)
    g.text(427, (upper + surface) / 2 + 5, '760 mm', c=BLUE)
    for x in (165, 309):
        g.arrow(x, 260, x, 300, BLUE, 2.2, 10)
    g.text(309, 247, '大气压', anchor='middle', c=BLUE)
    g.text(240, 377, '水银槽', anchor='middle')
    return out(g, name)


def buoyancy_factor_comparisons():
    name = 'buoyancy-factor-comparisons'
    g = fig(660, 570, name, '比较浸入体积与液体密度',
            '上排同一物体逐渐浸入同种液体，依次部分浸入、刚好浸没、浸没后更深；下排同一物体完全浸没在密度不同的两种液体中，浸入体积相同。不写具体浸入比例或液体名称。')
    g.text(330, 24, '同种液体', anchor='middle')
    for cx, objtop, label in ((110, 72, '部分浸入'), (330, 110, '刚好浸没'), (550, 137, '浸没更深')):
        mount(g, cx - 30, cx + 30, 40)
        vessel(g, cx, 65, 245, 110, 76)
        g.line(cx, 40, cx, objtop, GRAY, THIN)
        load(g, cx - 22, objtop, 44, 80)
        if objtop < 110:
            tint(g, cx - 21, 110, 42, objtop + 79 - 110, BLUE, .12)
        g.text(cx, 273, label, anchor='middle')
    g.text(330, 311, '浸入体积相同', anchor='middle')
    for cx, label in ((210, '密度较小'), (450, '密度较大')):
        mount(g, cx - 30, cx + 30, 330)
        vessel(g, cx, 341, 511, 365, 85)
        g.line(cx, 330, cx, 386, GRAY, THIN)
        load(g, cx - 22, 386, 44, 80)
        g.text(cx, 545, label, anchor='middle')
    return out(g, name)


def buoyancy_pressure_origin():
    name = 'buoyancy-pressure-origin'
    g = fig(620, 350, name, '上下表面压力差产生浮力',
            '完全浸没的长方体，上下表面面积相同。分别标出从液面到上、下表面的竖直深度；上表面受到向下的压力，下表面受到更大的向上压力。右侧表示压力差即竖直向上的浮力。')
    vessel(g, 306, 35, 308, 65, 236)
    left, right, top, bot = 245, 345, 141, 219
    load(g, left, top, right - left, bot - top)
    for x, target in ((129, top), (184, bot)):
        dimension(g, x, 65, x, target, BLUE)
        g.line(x + 8, target, left - 8, target, GRAY, THIN, '5 4')
        label_y = (65 + target) / 2 + (5 if target == top else 43)
        g.sym(x - 11, label_y, 'h', '上' if target == top else '下',
              c=BLUE, anchor='end', size=17)
    g.arrow(269, top, 269, top + 34, CORAL, 2.6, 10)
    g.arrow(321, bot, 321, bot - 57, CORAL, 2.6, 10)
    g.text(369, 143, '向下压力', c=CORAL, size=13)
    g.text(369, 232, '向上压力', c=CORAL, size=13)
    g.arrow(458, 209, 458, 209 - (57 - 34), BLUE, 2.6, 8)
    g.sym(474, 207, 'F', '浮', c=BLUE, size=17)
    g.text(300, 332, '下表面更深', anchor='middle', c=SOFT, size=13)
    return out(g, name)


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for fn in (cart_balanced_pulls, suspended_force_balance, liquid_depth_h,
               liquid_pressure_manometers, torricelli_mercury,
               buoyancy_factor_comparisons, buoyancy_pressure_origin):
        print(fn())
